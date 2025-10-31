
"use client";

import React, { createContext, useContext } from "react";
import type { FirebaseApp } from "firebase/app";
import type { Auth } from "firebase/auth";
import type { Firestore } from "firebase/firestore";
import { FirebaseErrorListener } from "@/components/FirebaseErrorListener";

interface FirebaseContextValue {
  app: FirebaseApp;
  auth: Auth;
  firestore: Firestore;
}

const FirebaseContext = createContext<FirebaseContextValue | null>(null);

interface FirebaseProviderProps {
  children: React.ReactNode;
  value: FirebaseContextValue;
}

export function FirebaseProvider({ children, value }: FirebaseProviderProps) {
  return (
    <FirebaseContext.Provider value={value}>
      {children}
      <FirebaseErrorListener />
    </FirebaseContext.Provider>
  );
}

export const useFirebase = (): FirebaseContextValue => {
  const context = useContext(FirebaseContext);
  if (!context) {
    throw new Error("useFirebase must be used within a FirebaseProvider");
  }
  return context;
};

export const useFirebaseApp = (): FirebaseApp => {
  const { app } = useFirebase();
  if (!app) {
    throw new Error("Firebase App not available.");
  }
  return app;
};

export const useAuth = (): Auth => {
  const { auth } = useFirebase();
  if (!auth) {
    throw new Error("Firebase Auth not available.");
  }
  return auth;
};

export const useFirestore = (): Firestore => {
  const { firestore } = useFirebase();
  if (!firestore) {
    throw new Error("Firebase Firestore not available.");
  }
  return firestore;
};
