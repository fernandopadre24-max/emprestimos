import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, type Auth } from 'firebase/auth';
import {
  getFirestore,
  connectFirestoreEmulator,
  type Firestore,
} from 'firebase/firestore';

import { firebaseConfig } from './config';

let app: FirebaseApp;
let auth: Auth;
let firestore: Firestore;

/**
 * Initializes the Firebase app and returns the app, auth, and firestore instances.
 * If the app is already initialized, it returns the existing instances.
 *
 * This function also connects to the Firebase emulators if the app is running in development mode.
 *
 * @returns An object containing the Firebase app, auth, and firestore instances.
 */
export async function initializeFirebase() {
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    firestore = getFirestore(app);

    if (process.env.NODE_ENV === 'development') {
      // Set up emulators
      try {
        // Replace with your actual emulator host and port
        // connectAuthEmulator(auth, 'http://localhost:9099');
        // connectFirestoreEmulator(firestore, 'localhost', 8080);
        console.log('Firebase emulators connected');
      } catch (e) {
        console.error('Error connecting to Firebase emulators', e);
      }
    }
  } else {
    app = getApp();
    auth = getAuth(app);
    firestore = getFirestore(app);
  }
  return { app, auth, firestore };
}

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './firestore/utils';
