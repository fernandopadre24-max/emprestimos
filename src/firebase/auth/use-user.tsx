'use client';
import { Auth, onAuthStateChanged, type User } from 'firebase/auth';
import { useEffect, useState } from 'react';
import { useAuth } from '../';

/**
 * Hook to get the current user.
 *
 * @returns An object with the current user, a loading state, and an error state.
 */
export function useUser() {
  const auth = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!auth) {
      // Auth service is not yet available.
      return;
    }
    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        setUser(user);
        setLoading(false);
      },
      (error) => {
        setError(error);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, [auth]);

  return { user, loading, error };
}
