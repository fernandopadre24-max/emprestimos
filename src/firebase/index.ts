import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, type Auth } from 'firebase/auth';
import {
  getFirestore,
  connectFirestoreEmulator,
  type Firestore,
} from 'firebase/firestore';

import { firebaseConfig } from './config';

let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

const auth = getAuth(app);
const firestore = getFirestore(app);

if (process.env.NODE_ENV === 'development') {
  // Use um objeto para rastrear o status da conexão para evitar múltiplas conexões
  if (!(global as any)._firebaseEmulatorsConnected) {
    console.log('Conectando aos emuladores do Firebase...');
    try {
      connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
      console.log('Emulador do Firebase Auth conectado.');
    } catch (e) {
      console.error('Erro ao conectar ao emulador do Firebase Auth', e);
    }
    
    try {
      connectFirestoreEmulator(firestore, '127.0.0.1', 8080);
      console.log('Emulador do Firestore conectado.');
    } catch (e) {
      console.error('Erro ao conectar ao emulador do Firestore', e);
    }
    (global as any)._firebaseEmulatorsConnected = true;
  }
}


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
