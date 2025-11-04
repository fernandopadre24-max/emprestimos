
"use client";

import {
  type FirebaseApp,
  type FirebaseOptions,
  initializeApp,
  getApps,
} from "firebase/app";
import { type Auth, getAuth } from "firebase/auth";
import {
  type Firestore,
  getFirestore,
} from "firebase/firestore";
import { firebaseConfig } from "./config";

function initializeFirebase(options: FirebaseOptions = firebaseConfig): {
  app: FirebaseApp;
  auth: Auth;
  firestore: Firestore;
} {
  // Check if Firebase has already been initialized
  if (getApps().length > 0) {
    const app = getApps()[0];
    const auth = getAuth(app);
    const firestore = getFirestore(app);
    return { app, auth, firestore };
  }
  
  const app = initializeApp(options);
  const auth = getAuth(app);
  const firestore = getFirestore(app);

  return { app, auth, firestore };
}

export { initializeFirebase };
export * from "./provider";
export * from "./auth/use-user";
export * from "./firestore/use-doc";
export * from "./firestore/use-collection";
