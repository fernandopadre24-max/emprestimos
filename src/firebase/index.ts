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

// Variáveis para garantir que os emuladores sejam conectados apenas uma vez.
let authEmulatorConnected = false;
let firestoreEmulatorConnected = false;

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
  } else {
    app = getApp();
    auth = getAuth(app);
    firestore = getFirestore(app);
  }

  if (process.env.NODE_ENV === 'development') {
    // Conecta ao emulador de autenticação se ainda não estiver conectado.
    if (!authEmulatorConnected) {
      try {
        connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
        console.log('Firebase Auth emulator connected.');
        authEmulatorConnected = true;
      } catch (e) {
        console.error('Error connecting to Firebase Auth emulator', e);
      }
    }
    // Conecta ao emulador do Firestore se ainda não estiver conectado.
    if (!firestoreEmulatorConnected) {
       try {
        connectFirestoreEmulator(firestore, '127.0.0.1', 8080);
        console.log('Firestore emulator connected.');
        firestoreEmulatorConnected = true;
       } catch (e) {
        console.error('Error connecting to Firestore emulator', e);
       }
    }
  }

  return { app, auth, firestore };
}

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './firestore/utils';
export * from './auth/use-user';
