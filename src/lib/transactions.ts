import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  runTransaction,
  Firestore,
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
