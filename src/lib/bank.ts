import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  runTransaction,
  Firestore,
} from 'firebase/firestore';
import type { BankAccount, NewBankAccount } from './types';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

const BANK_ACCOUNTS_COLLECTION = 'bankAccounts';

export function addBankAccount(firestore: Firestore, account: NewBankAccount) {
  const newAccount: Omit<BankAccount, 'id'> = {
    ...account,
    saldo: 0,
  };
  const coll = collection(firestore, BANK_ACCOUNTS_COLLECTION);
  addDoc(coll, newAccount).catch(async (serverError) => {
    const permissionError = new FirestorePermissionError({
      path: coll.path,
      operation: 'create',
      requestResourceData: account,
    });
    errorEmitter.emit('permission-error', permissionError);
  });
}

export function updateBankAccount(
  firestore: Firestore,
  id: string,
  account: Partial<BankAccount>
) {
  const docRef = doc(firestore, BANK_ACCOUNTS_COLLECTION, id);
  updateDoc(docRef, account).catch(async (serverError) => {
    const permissionError = new FirestorePermissionError({
      path: docRef.path,
      operation: 'update',
      requestResourceData: account,
    });
    errorEmitter.emit('permission-error', permissionError);
  });
}

export function deleteBankAccount(firestore: Firestore, id: string) {
  const docRef = doc(firestore, BANK_ACCOUNTS_COLLECTION, id);
  // Note: Deleting a document does not delete its subcollections.
  // In a production app, you might need a Cloud Function to handle this.
  deleteDoc(docRef).catch(async (serverError) => {
    const permissionError = new FirestorePermissionError({
      path: docRef.path,
      operation: 'delete',
    });
    errorEmitter.emit('permission-error', permissionError);
  });
}

export function updateBalance(
  firestore: Firestore,
  accountId: string,
  amount: number
) {
  const accountRef = doc(firestore, BANK_ACCOUNTS_COLLECTION, accountId);
  
  runTransaction(firestore, async (transaction) => {
    const accountDoc = await transaction.get(accountRef);
    if (!accountDoc.exists()) {
      throw "Account does not exist!";
    }

    const newBalance = (accountDoc.data().saldo || 0) + amount;
    transaction.update(accountRef, { saldo: newBalance });
  }).catch(async (serverError) => {
     const permissionError = new FirestorePermissionError({
      path: accountRef.path,
      operation: 'update',
      requestResourceData: { saldo: `current_balance + ${amount}` },
    });
    errorEmitter.emit('permission-error', permissionError);
  });
}
