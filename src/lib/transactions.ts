
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
            
            const newAmount = transactionUpdate.amount;

            // If amount changes, we need to adjust the balance
            if (newAmount !== undefined && newAmount !== originalAmount) {
                const originalValue = originalType === 'receita' ? originalAmount : -originalAmount;
                const updatedValue = originalType === 'receita' ? newAmount : -newAmount;
                const adjustment = updatedValue - originalValue;

                const accountRef = doc(firestore, BANK_ACCOUNTS_COLLECTION, accountId);
                const accountDoc = await firestoreTransaction.get(accountRef);
                if (!accountDoc.exists()) throw "Account does not exist!";
                
                const newBalance = (accountDoc.data().saldo || 0) + adjustment;
                firestoreTransaction.update(accountRef, { saldo: newBalance });
            }

            // Apply the update to the transaction document itself
            firestoreTransaction.update(docRef, transactionUpdate);

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
      
      // Use a transaction to ensure atomicity for balance updates
      await runTransaction(firestore, async (transaction) => {
          const balanceUpdates: Record<string, number> = {};

          for (const docSnapshot of querySnapshot.docs) {
              const transactionData = docSnapshot.data() as Transaction;
              const accountId = transactionData.accountId;

              // Defer deletion to the transaction batch
              batch.delete(docSnapshot.ref);

              const amountToRevert = transactionData.type === 'receita' ? -transactionData.amount : transactionData.amount;
              
              if (balanceUpdates[accountId]) {
                  balanceUpdates[accountId] += amountToRevert;
              } else {
                  balanceUpdates[accountId] = amountToRevert;
              }
          }

          for (const accountId in balanceUpdates) {
              const accountRef = doc(firestore, BANK_ACCOUNTS_COLLECTION, accountId);
              const accountDoc = await transaction.get(accountRef);
              if (accountDoc.exists()) {
                  const currentBalance = accountDoc.data().saldo || 0;
                  const newBalance = currentBalance + balanceUpdates[accountId];
                  transaction.update(accountRef, { saldo: newBalance });
              }
          }
      });
      
      // Commit the batched deletions after the transaction succeeds
      await batch.commit();
  
    } catch (error) {
      console.error("Error reverting transactions by source:", error);
      const permissionError = new FirestorePermissionError({
          path: `transactions (sourceId: ${sourceId})`,
          operation: 'delete',
      });
      errorEmitter.emit('permission-error', permissionError);
    }
}
