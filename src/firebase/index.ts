"use client";

import {
  type FirebaseApp,
  type FirebaseOptions,
  initializeApp,
} from "firebase/app";
import { type Auth, getAuth, connectAuthEmulator } from "firebase/auth";
import {
  type Firestore,
  getFirestore,
  connectFirestoreEmulator,
} from "firebase/firestore";
import { firebaseConfig } from "./config";

let app: FirebaseApp;
let auth: Auth;
let firestore: Firestore;

function initializeFirebase(options: FirebaseOptions = firebaseConfig): {
  app: FirebaseApp;
  auth: Auth;
  firestore: Firestore;
} {
  if (!app) {
    app = initializeApp(options);
    auth = getAuth(app);
    firestore = getFirestore(app);

    if (process.env.NODE_ENV === "development") {
      // Point to the emulators running on localhost.
      connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
      connectFirestoreEmulator(firestore, "127.0.0.1", 8080);
    }
  }

  return { app, auth, firestore };
}

export { initializeFirebase };
export * from "./provider";
export * from "./auth/use-user";
export * from "./firestore/use-doc";
export * from "./firestore/use-collection";
