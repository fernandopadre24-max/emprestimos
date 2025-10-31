import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, type Auth } from 'firebase/auth';
import {
  getFirestore,
  connectFirestoreEmulator,
  type Firestore,
} from 'firebase/firestore';

import { firebaseConfig } from './config';

// Flag to ensure emulators are connected only once
let emulatorsConnected = false;

/**
 * Initializes the Firebase app and returns the app, auth, and firestore instances.
 * If the app is already initialized, it returns the existing instances.
 *
 * This function also connects to the Firebase emulators if the app is running in development mode.
 *
 * @returns An object containing the Firebase app, auth, and firestore instances.
 */
export async function initializeFirebase() {
  const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  const auth = getAuth(app);
  const firestore = getFirestore(app);

  if (process.env.NODE_ENV === 'development' && !emulatorsConnected) {
    console.log('Connecting to Firebase emulators...');
    try {
      connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
      console.log('Firebase Auth emulator connected.');
    } catch (e) {
      console.error('Error connecting to Firebase Auth emulator', e);
    }
    
    try {
      connectFirestoreEmulator(firestore, '127.0.0.1', 8080);
      console.log('Firestore emulator connected.');
    } catch (e) {
      console.error('Error connecting to Firestore emulator', e);
    }
    emulatorsConnected = true;
  }

  return { app, auth, firestore };
}

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './firestore/utils';
export * from './auth/use-user';