"use client";

import { useEffect } from "react";
import { errorEmitter } from "@/firebase/error-emitter";

// This is a client-side only component that will listen for
// permission errors and throw them to be caught by the Next.js
// error overlay.
export function FirebaseErrorListener() {
  useEffect(() => {
    const handler = (error: Error) => {
      // Throw the error to be caught by the Next.js error overlay
      throw error;
    };

    errorEmitter.on("permission-error", handler);

    return () => {
      errorEmitter.off("permission-error", handler);
    };
  }, []);

  return null;
}
