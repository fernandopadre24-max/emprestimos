import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  Firestore,
} from 'firebase/firestore';
import type { Category } from './types';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

const CATEGORIES_COLLECTION = 'categories';

export function addCategory(firestore: Firestore, category: Omit<Category, 'id'>) {
  const coll = collection(firestore, CATEGORIES_COLLECTION);
  addDoc(coll, category).catch(async (serverError) => {
    const permissionError = new FirestorePermissionError({
      path: coll.path,
      operation: 'create',
      requestResourceData: category,
    });
    errorEmitter.emit('permission-error', permissionError);
  });
}

export function deleteCategory(firestore: Firestore, id: string) {
  const docRef = doc(firestore, CATEGORIES_COLLECTION, id);
  deleteDoc(docRef).catch(async (serverError) => {
    const permissionError = new FirestorePermissionError({
      path: docRef.path,
      operation: 'delete',
    });
    errorEmitter.emit('permission-error', permissionError);
  });
}
