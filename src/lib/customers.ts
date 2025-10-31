import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  Firestore,
} from 'firebase/firestore';
import type { Customer } from './types';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

const CUSTOMERS_COLLECTION = 'customers';

export function addCustomer(firestore: Firestore, customer: Omit<Customer, 'id'>) {
  const coll = collection(firestore, CUSTOMERS_COLLECTION);
  addDoc(coll, customer).catch(async (serverError) => {
    const permissionError = new FirestorePermissionError({
      path: coll.path,
      operation: 'create',
      requestResourceData: customer,
    });
    errorEmitter.emit('permission-error', permissionError);
  });
}

export function updateCustomer(
  firestore: Firestore,
  id: string,
  customer: Partial<Customer>
) {
  const docRef = doc(firestore, CUSTOMERS_COLLECTION, id);
  updateDoc(docRef, customer).catch(async (serverError) => {
    const permissionError = new FirestorePermissionError({
      path: docRef.path,
      operation: 'update',
      requestResourceData: customer,
    });
    errorEmitter.emit('permission-error', permissionError);
  });
}

export function deleteCustomer(firestore: Firestore, id: string) {
  const docRef = doc(firestore, CUSTOMERS_COLLECTION, id);
  deleteDoc(docRef).catch(async (serverError) => {
    const permissionError = new FirestorePermissionError({
      path: docRef.path,
      operation: 'delete',
    });
    errorEmitter.emit('permission-error', permissionError);
  });
}
