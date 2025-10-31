
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

// This function ensures Firebase is initialized only once.
function initializeFirebaseServices() {
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApp();
  }
  auth = getAuth(app);
  firestore = getFirestore(app);

  // Connect to emulators in development.
  // The `_firebaseEmulatorsConnected` global flag prevents multiple connections.
  if (process.env.NODE_ENV === 'development' && !(global as any)._firebaseEmulatorsConnected) {
    try {
      console.log('Connecting to Firebase Auth emulator...');
      connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
      console.log('Firebase Auth emulator connected.');
    } catch (e) {
      console.error('Failed to connect to Firebase Auth emulator', e);
    }
    
    try {
      console.log('Connecting to Firestore emulator...');
      connectFirestoreEmulator(firestore, '127.0.0.1', 8080);
      console.log('Firestore emulator connected.');
    } catch (e) {
      console.error('Failed to connect to Firestore emulator', e);
    }
    (global as any)._firebaseEmulatorsConnected = true;
  }
  
  return { app, auth, firestore };
}

// Initialize on module load.
initializeFirebaseServices();


/**
 * Initializes the Firebase app and returns the app, auth, and firestore instances.
 * If the app is already initialized, it returns the existing instances.
 *
 * This function also connects to the Firebase emulators if the app is running in development mode.
 *
 * @returns An object containing the Firebase app, auth, and firestore instances.
 */
export async function initializeFirebase() {
  return { app, auth, firestore };
}

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './firestore/utils';
export * from './auth/use-user';
