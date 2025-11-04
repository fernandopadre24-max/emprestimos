
"use client";

import React, { useEffect, useState } from "react";
import type { FirebaseApp } from "firebase/app";
import type { Auth } from "firebase/auth";
import type { Firestore } from "firebase/firestore";
import { initializeFirebase } from ".";
import { FirebaseProvider } from "./provider";
import { usePathname } from "next/navigation";


interface FirebaseClientProviderProps {
  children: React.ReactNode;
}

export default function FirebaseClientProvider({
  children,
}: FirebaseClientProviderProps) {
  const [firebase, setFirebase] = useState<{
    app: FirebaseApp;
    auth: Auth;
    firestore: Firestore;
  } | null>(null);


  useEffect(() => {
    // Initialize Firebase on the client-side
    const services = initializeFirebase();
    setFirebase(services);
  }, []);

  if (!firebase) {
    return <div className="flex h-screen w-full items-center justify-center"><p>Carregando...</p></div>
  }

  return <FirebaseProvider value={firebase}>{children}</FirebaseProvider>;
}
