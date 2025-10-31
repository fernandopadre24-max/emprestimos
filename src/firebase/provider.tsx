'use client';

import { createContext, useContext } from 'react';
import type { FirebaseApp } from 'firebase/app';
import type { Auth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';

type FirebaseContextValue = {
  firebaseApp: FirebaseApp | null;
  auth: Auth | null;
  firestore: Firestore | null;
};

const FirebaseContext = createContext<FirebaseContextValue>({
  firebaseApp: null,
  auth: null,
  firestore: null,
});

/**
 * Provides the Firebase app, auth, and firestore instances to its children.
 *
 * This provider should be used at the root of your application.
 */
export const FirebaseProvider = ({
  children,
  firebaseApp,
  auth,
  firestore,
}: {
  children: React.ReactNode;
  firebaseApp: FirebaseApp;
  auth: Auth;
  firestore: Firestore;
}) => {
  return (
    <FirebaseContext.Provider value={{ firebaseApp, auth, firestore }}>
      {children}
      <FirebaseErrorListener />
    </FirebaseContext.Provider>
  );
};

/**
 * Hook to get the Firebase context.
 *
 * @returns The Firebase context, which includes the Firebase app, auth, and firestore instances.
 * @throws An error if the hook is not used within a FirebaseProvider.
 */
export const useFirebase = () => {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }
  return context;
};

/**
 * Hook to get the Firebase app instance.
 *
 * @returns The Firebase app instance.
 */
export const useFirebaseApp = () => useFirebase().firebaseApp;

/**
 * Hook to get the Firebase auth instance.
 *
 * @returns The Firebase auth instance.
 */
export const useAuth = () => useFirebase().auth;

/**
 * Hook to get the Firebase firestore instance.
 *
 * @returns The Firebase firestore instance.
 */
export const useFirestore = () => useFirebase().firestore;
