'use client';

import { useEffect, useState } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import type { FirestorePermissionError } from '@/firebase/errors';
import { useToast } from '@/hooks/use-toast';

function PermissionErrorCard({ error }: { error: FirestorePermissionError }) {
  const { path, operation, requestResourceData } = error.context;

  return (
    <div className="mt-4 rounded-md bg-destructive/10 p-4 text-sm text-destructive-foreground/80">
      <p className="font-bold">Firestore Permission Denied</p>
      <ul className="mt-2 list-disc pl-5">
        <li>
          <span className="font-semibold">Operation:</span>{' '}
          <code className="rounded bg-destructive/20 p-1 text-xs">
            {operation}
          </code>
        </li>
        <li>
          <span className="font-semibold">Path:</span>{' '}
          <code className="rounded bg-destructive/20 p-1 text-xs">{path}</code>
        </li>
      </ul>
      {requestResourceData && (
        <div className="mt-2">
          <p className="font-semibold">Request Data:</p>
          <pre className="mt-1 overflow-auto rounded bg-destructive/20 p-2 text-xs">
            {JSON.stringify(requestResourceData, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

export function FirebaseErrorListener() {
  const { toast } = useToast();

  useEffect(() => {
    const handlePermissionError = (error: FirestorePermissionError) => {
      console.error('Captured Firestore Permission Error:', error);

      toast({
        variant: 'destructive',
        title: 'Erro de Permissão',
        description: (
          <div>
            <p>Sua operação foi bloqueada pelas regras de segurança.</p>
            <PermissionErrorCard error={error} />
          </div>
        ),
        duration: 10000,
      });
    };

    errorEmitter.on('permission-error', handlePermissionError);

    return () => {
      errorEmitter.off('permission-error', handlePermissionError);
    };
  }, [toast]);

  return null;
}
