
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Auth,
  createUserWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';
import { useAuth, useFirestore } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function SignUpPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const auth = useAuth() as Auth;
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const handleSignUp = async () => {
    if (!firestore) return;

    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      
      const user = userCredential.user;

      await updateProfile(user, {
        displayName: name,
      });

      // Create a user profile document in Firestore
      await setDoc(doc(firestore, "users", user.uid), {
        displayName: name,
        photoURL: null,
      });


      toast({
        title: 'Cadastro realizado com sucesso!',
        description: 'Você será redirecionado para o dashboard.',
        className: 'bg-accent text-accent-foreground',
      });
      router.push('/');
    } catch (error: any) {
      console.error('Erro de cadastro:', error);
      let description = 'Ocorreu um erro ao tentar se cadastrar.';
      if (error.code === 'auth/email-already-in-use') {
        description = 'Este e-mail já está em uso.';
      } else if (error.code === 'auth/weak-password') {
        description = 'A senha deve ter no mínimo 6 caracteres.';
      }
      toast({
        variant: 'destructive',
        title: 'Falha no Cadastro',
        description: description,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-headline">Cadastro</CardTitle>
          <CardDescription>
            Crie sua conta para começar a gerenciar seus empréstimos.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Nome</Label>
            <Input
              id="name"
              placeholder="Seu nome"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              placeholder="seu@email.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button className="w-full" onClick={handleSignUp} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Cadastrar
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Já tem uma conta?{' '}
            <Link href="/login" className="underline hover:text-primary">
              Faça login
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
