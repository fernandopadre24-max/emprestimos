
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  runTransaction,
  Firestore,
  writeBatch,
  query,
  where,
  getDocs,
  getDoc,
} from 'firebase/firestore';
import type { Transaction } from './types';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { updateBalance } from './bank';


const BANK_ACCOUNTS_COLLECTION = 'bankAccounts';
const TRANSACTIONS_COLLECTION = 'transactions';


export function addTransaction(
    firestore: Firestore, 
    accountId: string, 
    transactionData: Omit<Transaction, 'id' | 'accountId' | 'type' | 'date'>, 
    type: 'receita' | 'despesa'
) {
  const newTransaction: Omit<Transaction, 'id'> = {
    ...transactionData,
    accountId,
    type,
    date: new Date().toISOString(),
  };

  const coll = collection(firestore, BANK_ACCOUNTS_COLLECTION, accountId, TRANSACTIONS_COLLECTION);
  
  addDoc(coll, newTransaction).catch(async (serverError) => {
    const permissionError = new FirestorePermissionError({
      path: coll.path,
      operation: 'create',
      requestResourceData: newTransaction,
    });
    errorEmitter.emit('permission-error', permissionError);
    return; // Stop execution if there is a permission error
  });

  // Update balance
  const amountToUpdate = type === 'receita' ? transactionData.amount : -transactionData.amount;
  updateBalance(firestore, accountId, amountToUpdate);
}


export function updateTransaction(
  firestore: Firestore,
  accountId: string,
  transactionId: string,
  transaction: Partial<Transaction>
) {
    const docRef = doc(firestore, BANK_ACCOUNTS_COLLECTION, accountId, TRANSACTIONS_COLLECTION, transactionId);
    updateDoc(docRef, transaction).catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: docRef.path,
            operation: 'update',
            requestResourceData: transaction,
        });
        errorEmitter.emit('permission-error', permissionError);
    });
    // Note: Balance is not automatically adjusted on edit for simplicity.
    // A more robust solution would calculate the diff and update the balance.
}

export function deleteTransaction(
    firestore: Firestore, 
    accountId: string, 
    transactionId: string
) {
    const docRef = doc(firestore, BANK_ACCOUNTS_COLLECTION, accountId, TRANSACTIONS_COLLECTION, transactionId);
    deleteDoc(docRef).catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: docRef.path,
            operation: 'delete',
        });
        errorEmitter.emit('permission-error', permissionError);
    });
    // Note: Balance is not automatically adjusted on delete.
}

export async function deleteTransactionsBySource(firestore: Firestore, sourceId: string) {
    const batch = writeBatch(firestore);
    const transactionsCollectionGroup = collectionGroup(firestore, TRANSACTIONS_COLLECTION);
    const q = query(transactionsCollectionGroup, where('sourceId', '==', sourceId));
  
    try {
      const querySnapshot = await getDocs(q);
      const balanceUpdates: Record<string, number> = {};
  
      querySnapshot.forEach((docSnapshot) => {
        const transaction = docSnapshot.data() as Transaction;
        batch.delete(docSnapshot.ref);
  
        const amountToRevert = transaction.type === 'receita' ? -transaction.amount : transaction.amount;
        
        if (balanceUpdates[transaction.accountId]) {
          balanceUpdates[transaction.accountId] += amountToRevert;
        } else {
          balanceUpdates[transaction.accountId] = amountToRevert;
        }
      });
  
      // Commit all deletions
      await batch.commit();
  
      // After deletions, update balances in separate transactions
      for (const accountId in balanceUpdates) {
        const amount = balanceUpdates[accountId];
        const accountRef = doc(firestore, BANK_ACCOUNTS_COLLECTION, accountId);
        await runTransaction(firestore, async (transaction) => {
          const accountDoc = await transaction.get(accountRef);
          if (accountDoc.exists()) {
            const currentBalance = accountDoc.data().saldo || 0;
            const newBalance = currentBalance + amount;
            transaction.update(accountRef, { saldo: newBalance });
          }
        });
      }
  
    } catch (error) {
      console.error("Error reverting transactions by source:", error);
      // In a real app, you would handle this more gracefully.
      const permissionError = new FirestorePermissionError({
          path: `transactions (sourceId: ${sourceId})`,
          operation: 'delete',
      });
      errorEmitter.emit('permission-error', permissionError);
    }
}
