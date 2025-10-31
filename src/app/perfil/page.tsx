
"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/firebase";
import { Upload } from "lucide-react";
import { useRef, useState, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function PerfilPage() {
    const { user, loading } = useUser();
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");


    useEffect(() => {
        if (user) {
            setAvatarPreview(user.photoURL || null);
            setName(user.displayName || "Usuário CredSimples");
            setEmail(user.email || "");
        }
    }, [user]);

    const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const result = reader.result as string;
                setAvatarPreview(result);
                // TODO: Implement Firebase profile update logic
                toast({
                    title: "Pré-visualização!",
                    description: "Sua foto de perfil foi atualizada na pré-visualização. A funcionalidade de salvar será implementada.",
                    className: "bg-accent text-accent-foreground"
                });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleSaveChanges = () => {
        // TODO: Implement Firebase profile update logic
        toast({
            title: "Funcionalidade em desenvolvimento!",
            description: "A atualização de informações de perfil será implementada em breve.",
        })
    }

    const handleUpdatePassword = () => {
         // TODO: Implement Firebase password update logic
        if (newPassword !== confirmPassword) {
            toast({
                variant: "destructive",
                title: "Erro",
                description: "As novas senhas não coincidem.",
            });
            return;
        }
        if (!newPassword || !currentPassword) {
             toast({
                variant: "destructive",
                title: "Erro",
                description: "Por favor, preencha todos os campos de senha.",
            });
            return;
        }
        
        toast({
            title: "Funcionalidade em desenvolvimento!",
            description: "A atualização de senha será implementada em breve.",
        });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
    }

    if (loading) {
        return (
             <div className="grid gap-6">
                <Card>
                    <CardHeader>
                        <Skeleton className="h-8 w-24" />
                        <Skeleton className="h-4 w-72" />
                    </CardHeader>
                </Card>
                 <div className="grid md:grid-cols-3 gap-6">
                    <div className="md:col-span-1 space-y-6">
                        <Card>
                            <CardHeader><Skeleton className="h-6 w-32" /></CardHeader>
                            <CardContent className="flex flex-col items-center gap-4">
                                <Skeleton className="h-32 w-32 rounded-full" />
                                <Skeleton className="h-10 w-36" />
                            </CardContent>
                        </Card>
                    </div>
                     <div className="md:col-span-2 space-y-6">
                        <Card>
                            <CardHeader>
                                <Skeleton className="h-6 w-40" />
                                <Skeleton className="h-4 w-52" />
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <Skeleton className="h-10 w-full" />
                                <Skeleton className="h-10 w-full" />
                            </CardContent>
                            <CardFooter className="border-t pt-6">
                                <Skeleton className="h-10 w-32" />
                            </CardFooter>
                        </Card>
                     </div>
                </div>
            </div>
        )
    }
    
    if (!user) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Acesso Negado</CardTitle>
                    <CardDescription>Você precisa estar logado para ver seu perfil.</CardDescription>
                </CardHeader>
            </Card>
        )
    }

  return (
    <div className="grid gap-6">
        <Card>
            <CardHeader>
                <CardTitle className="font-headline">Perfil</CardTitle>
                <CardDescription>Gerencie suas informações pessoais e de segurança.</CardDescription>
            </CardHeader>
        </Card>

        <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-1 space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Foto de Perfil</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center gap-4">
                        <Avatar className="h-32 w-32">
                           <AvatarImage src={avatarPreview || ''} alt="Avatar do usuário" />
                            <AvatarFallback>{name[0]}</AvatarFallback>
                        </Avatar>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleAvatarChange}
                            className="hidden"
                            accept="image/*"
                        />
                        <Button variant="outline" onClick={handleUploadClick}>
                            <Upload className="mr-2 h-4 w-4" />
                            Alterar Foto
                        </Button>
                    </CardContent>
                </Card>
            </div>
            <div className="md:col-span-2 space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Informações Pessoais</CardTitle>
                        <CardDescription>Atualize seu nome e e-mail.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Nome</Label>
                            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">E-mail</Label>
                            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} readOnly disabled/>
                        </div>
                    </CardContent>
                    <CardFooter className="border-t pt-6">
                        <Button onClick={handleSaveChanges}>Salvar Alterações</Button>
                    </CardFooter>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Alterar Senha</CardTitle>
                        <CardDescription>Para sua segurança, recomendamos o uso de uma senha forte.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="current-password">Senha Atual</Label>
                            <Input id="current-password" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="new-password">Nova Senha</Label>
                            <Input id="new-password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="confirm-password">Confirmar Nova Senha</Label>
                            <Input id="confirm-password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                        </div>
                    </CardContent>
                    <CardFooter className="border-t pt-6">
                        <Button onClick={handleUpdatePassword}>Atualizar Senha</Button>
                    </CardFooter>
                </Card>
            </div>
        </div>
    </div>
  );
}
