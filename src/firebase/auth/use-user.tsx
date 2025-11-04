
"use client";

import { useState } from "react";
import type { User } from "firebase/auth";

const mockUser: User = {
  uid: "mock-user-id",
  email: "usuario@example.com",
  emailVerified: true,
  displayName: "Usuário Padrão",
  photoURL: "https://images.unsplash.com/photo-1530268729831-4b0b9e170218?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwxMHx8cGVyc29uJTIwZmFjZXxlbnwwfHx8fDE3NjE4NTM0MjR8MA&ixlib=rb-4.1.0&q=80&w=1080",
  phoneNumber: null,
  providerId: "mock",
  isAnonymous: false,
  metadata: {
    creationTime: new Date().toUTCString(),
    lastSignInTime: new Date().toUTCString(),
  },
  providerData: [],
  refreshToken: "mock-token",
  tenantId: null,
  delete: () => Promise.resolve(),
  getIdToken: () => Promise.resolve("mock-id-token"),
  getIdTokenResult: () => Promise.resolve({
    token: "mock-id-token",
    expirationTime: new Date().toUTCString(),
    authTime: new Date().toUTCString(),
    issuedAtTime: new Date().toUTCString(),
    signInProvider: null,
    signInSecondFactor: null,
    claims: {},
  }),
  reload: () => Promise.resolve(),
  toJSON: () => ({}),
};


export function useUser() {
  const [user] = useState<User | null>(mockUser);
  const [isLoading] = useState(false);

  return { user, isLoading };
}
