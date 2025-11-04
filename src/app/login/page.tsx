'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { Logo } from '@/components/icons';
import { useEffect } from 'react';
import { useUser } from '@/firebase/auth/use-user';


export default function LoginPage() {
  const auth = useAuth();
  const router = useRouter();
  const { user, isLoading } = useUser();

  const handleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      router.push('/');
    } catch (error) {
      console.error('Error signing in with Google', error);
    }
  };
  
  useEffect(() => {
    if (!isLoading && user) {
      router.push('/');
    }
  }, [user, isLoading, router]);

  if(isLoading || user) {
      return (
        <div className="flex h-screen w-full items-center justify-center">
            <p>Carregando...</p>
        </div>
      )
  }

  return (
    <div className="flex h-screen w-full items-center justify-center bg-muted/40">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
            <div className="flex justify-center items-center mb-4">
                <Logo className="h-8 w-8 text-primary" />
            </div>
          <CardTitle className="text-2xl font-headline">Bem-vindo ao CredSimples</CardTitle>
          <CardDescription>Entre com sua conta do Google para continuar.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <Button onClick={handleSignIn} className="w-full">
              Entrar com Google
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
