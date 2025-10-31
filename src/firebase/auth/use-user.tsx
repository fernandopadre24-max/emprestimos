
'use client';
import { Auth, onAuthStateChanged, type User as AuthUser } from 'firebase/auth';
import { useEffect, useState } from 'react';
import { useAuth, useFirestore } from '../';
import { doc, onSnapshot } from 'firebase/firestore';
import type { UserProfile } from '@/lib/types';


export type User = AuthUser & UserProfile;


/**
 * Hook to get the current user, combining Auth and Firestore data.
 *
 * @returns An object with the current user, a loading state, and an error state.
 */
export function useUser() {
  const auth = useAuth();
  const firestore = useFirestore();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!auth || !firestore) {
      // Services not yet available.
      return;
    }

    const unsubscribeAuth = onAuthStateChanged(
      auth,
      (authUser) => {
        if (authUser) {
          // User is signed in, now listen for Firestore profile data
          const userDocRef = doc(firestore, 'users', authUser.uid);
          const unsubscribeFirestore = onSnapshot(userDocRef, 
            (docSnap) => {
              if (docSnap.exists()) {
                const userProfile = docSnap.data() as UserProfile;
                setUser({ ...authUser, ...userProfile });
              } else {
                 // This case can happen briefly after sign up, before profile is created.
                 // We'll treat it as loading, as the profile should appear shortly.
                 console.warn("User profile document doesn't exist yet.");
                 setUser({ ...authUser, displayName: authUser.displayName, photoURL: authUser.photoURL });
              }
              setLoading(false);
            },
            (firestoreError) => {
                console.error("Error fetching user profile:", firestoreError);
                setError(firestoreError);
                setLoading(false);
            }
          );
           return () => unsubscribeFirestore();
        } else {
          // User is signed out
          setUser(null);
          setLoading(false);
        }
      },
      (authError) => {
        console.error("Authentication error:", authError);
        setError(authError);
        setLoading(false);
      }
    );

    return () => unsubscribeAuth();
  }, [auth, firestore]);

  return { user, loading, error };
}
