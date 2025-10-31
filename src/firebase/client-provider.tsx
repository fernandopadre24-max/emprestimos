
"use client";

import React, { useEffect, useState } from "react";
import type { FirebaseApp } from "firebase/app";
import type { Auth } from "firebase/auth";
import type { Firestore } from "firebase/firestore";
import { initializeFirebase } from ".";
import { FirebaseProvider } from "./provider";
import { Skeleton } from "@/components/ui/skeleton";

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
    // Render a loading state while Firebase is initializing
    return (
       <div className="flex flex-col h-screen">
          <header className="flex h-14 lg:h-[60px] items-center gap-4 border-b bg-muted/40 px-6">
            <Skeleton className="h-6 w-32" />
            <div className="ml-auto flex items-center gap-2">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-8 w-8 rounded-full" />
            </div>
          </header>
          <div className="flex flex-1">
            <nav className="hidden border-r bg-muted/40 md:block">
              <div className="flex h-full max-h-screen flex-col gap-2 p-2">
                <Skeleton className="h-8 w-32" />
                <div className="flex-1">
                  <div className="flex flex-col gap-2">
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                  </div>
                </div>
              </div>
            </nav>
            <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
               <Skeleton className="w-full h-full" />
            </main>
          </div>
        </div>
    );
  }

  return <FirebaseProvider value={firebase}>{children}</FirebaseProvider>;
}

