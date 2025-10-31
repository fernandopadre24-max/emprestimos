
"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import type { FirebaseApp } from "firebase/app";
import type { Auth } from "firebase/auth";
import type { Firestore } from "firebase/firestore";
import { initializeFirebase } from ".";
import { FirebaseErrorListener } from "@/components/FirebaseErrorListener";

interface FirebaseContextValue {
  app: FirebaseApp | null;
  auth: Auth | null;
  firestore: Firestore | null;
}

const FirebaseContext = createContext<FirebaseContextValue | null>(null);

export function FirebaseProvider({ children }: { children: React.ReactNode }) {
  const [services, setServices] = useState<FirebaseContextValue>({
    app: null,
    auth: null,
    firestore: null,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Initialize Firebase on the client-side
    const { app, auth, firestore } = initializeFirebase();
    setServices({ app, auth, firestore });
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">Carregando...</div>
      </div>
    );
  }

  return (
    <FirebaseContext.Provider value={services}>
      {children}
      <FirebaseErrorListener />
    </FirebaseContext.Provider>
  );
}

export const useFirebase = () => {
  const context = useContext(FirebaseContext);
  if (!context) {
    throw new Error("useFirebase must be used within a FirebaseProvider");
  }
  return context;
};

export const useFirebaseApp = () => {
  const { app } = useFirebase();
  if (!app) {
    throw new Error("Firebase App not available.");
  }
  return app;
};

export const useAuth = () => {
  const { auth } = useFirebase();
  if (!auth) {
    throw new Error("Firebase Auth not available.");
  }
  return auth;
};

export const useFirestore = () => {
  const { firestore } = useFirebase();
  if (!firestore) {
    throw new Error("Firebase Firestore not available.");
  }
  return firestore;
};
