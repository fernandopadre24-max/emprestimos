
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
  collectionGroup,
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


export async function updateTransaction(
  firestore: Firestore,
  accountId: string,
  transactionId: string,
  transactionUpdate: Partial<Transaction>
) {
    const docRef = doc(firestore, BANK_ACCOUNTS_COLLECTION, accountId, TRANSACTIONS_COLLECTION, transactionId);

    try {
        await runTransaction(firestore, async (firestoreTransaction) => {
            const transactionDoc = await firestoreTransaction.get(docRef);
            if (!transactionDoc.exists()) {
                throw "Transaction does not exist!";
            }

            const originalTransaction = transactionDoc.data() as Transaction;
            const originalAmount = originalTransaction.amount;
            const originalType = originalTransaction.type;

            // Apply the update to the transaction document
            firestoreTransaction.update(docRef, transactionUpdate);

            // If the amount is part of the update, adjust the balance
            if (transactionUpdate.amount !== undefined && transactionUpdate.amount !== originalAmount) {
                // Calculate balance adjustment
                const originalValue = originalType === 'receita' ? originalAmount : -originalAmount;
                const newValue = originalType === 'receita' ? transactionUpdate.amount : -transactionUpdate.amount;
                const adjustment = newValue - originalValue;

                // Update the bank account balance
                const accountRef = doc(firestore, BANK_ACCOUNTS_COLLECTION, accountId);
                const accountDoc = await firestoreTransaction.get(accountRef);
                if (!accountDoc.exists()) {
                    throw "Account does not exist!";
                }
                const newBalance = (accountDoc.data().saldo || 0) + adjustment;
                firestoreTransaction.update(accountRef, { saldo: newBalance });
            }
        });
    } catch (serverError) {
        const permissionError = new FirestorePermissionError({
            path: docRef.path,
            operation: 'update',
            requestResourceData: transactionUpdate,
        });
        errorEmitter.emit('permission-error', permissionError);
    }
}


export function deleteTransaction(
    firestore: Firestore, 
    accountId: string, 
    transactionId: string,
    amount: number,
    type: 'receita' | 'despesa'
) {
    const docRef = doc(firestore, BANK_ACCOUNTS_COLLECTION, accountId, TRANSACTIONS_COLLECTION, transactionId);
    
    deleteDoc(docRef).catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: docRef.path,
            operation: 'delete',
        });
        errorEmitter.emit('permission-error', permissionError);
        return; // Stop execution on permission error
    });

    // Adjust balance after deletion
    const amountToRevert = type === 'receita' ? -amount : amount;
    updateBalance(firestore, accountId, amountToRevert);
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
  
      // After deletions, update balances in separate transactions for atomicity
      for (const accountId in balanceUpdates) {
        if (Object.prototype.hasOwnProperty.call(balanceUpdates, accountId)) {
            const amount = balanceUpdates[accountId];
            await updateBalance(firestore, accountId, amount);
        }
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
