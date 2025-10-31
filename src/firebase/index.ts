
"use client";

import {
  type FirebaseApp,
  type FirebaseOptions,
  initializeApp,
  getApps,
} from "firebase/app";
import { type Auth, getAuth, connectAuthEmulator } from "firebase/auth";
import {
  type Firestore,
  getFirestore,
  connectFirestoreEmulator,
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

  if (process.env.NODE_ENV === "development") {
    // Point to the emulators running on localhost.
    try {
      connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
      connectFirestoreEmulator(firestore, "127.0.0.1", 8080);
    } catch (e) {
      console.error("Error connecting to Firebase emulators. Is it running?", e);
    }
  }


  return { app, auth, firestore };
}

export { initializeFirebase };
export * from "./provider";
export * from "./auth/use-user";
export * from "./firestore/use-doc";
export * from "./firestore/use-collection";
