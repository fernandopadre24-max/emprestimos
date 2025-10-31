
"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Upload } from "lucide-react";
import { useRef, useState, useEffect } from "react";

export default function PerfilPage() {
    const userAvatarPlaceholder = PlaceHolderImages.find(p => p.id === "user-avatar");
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();

    const [name, setName] = useState("Usuário CredSimples");
    const [email, setEmail] = useState("usuario@credisimples.com");
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");


    useEffect(() => {
        const savedAvatar = localStorage.getItem("userAvatar");
        if (savedAvatar) {
            setAvatarPreview(savedAvatar);
        }

        const savedName = localStorage.getItem("userName");
        if (savedName) {
            setName(savedName);
        }

        const savedEmail = localStorage.getItem("userEmail");
        if (savedEmail) {
            setEmail(savedEmail);
        }
    }, []);

    const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const result = reader.result as string;
                setAvatarPreview(result);
                localStorage.setItem("userAvatar", result);
                toast({
                    title: "Sucesso!",
                    description: "Sua foto de perfil foi atualizada.",
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
        localStorage.setItem("userName", name);
        localStorage.setItem("userEmail", email);
        toast({
            title: "Sucesso!",
            description: "Suas informações foram atualizadas.",
            className: "bg-accent text-accent-foreground"
        })
    }

    const handleUpdatePassword = () => {
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
            title: "Sucesso!",
            description: "Sua senha foi atualizada.",
            className: "bg-accent text-accent-foreground"
        });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
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
                           <AvatarImage src={avatarPreview || userAvatarPlaceholder?.imageUrl} alt="Avatar do usuário" data-ai-hint={userAvatarPlaceholder?.imageHint} />
                            <AvatarFallback>CS</AvatarFallback>
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
                            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
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
