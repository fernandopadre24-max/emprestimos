"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Upload } from "lucide-react";
import { useRef, useState } from "react";

export default function PerfilPage() {
    const userAvatarPlaceholder = PlaceHolderImages.find(p => p.id === "user-avatar");
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setAvatarPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

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
                            <Input id="name" defaultValue="Usuário CredSimples" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">E-mail</Label>
                            <Input id="email" type="email" defaultValue="usuario@credisimples.com" />
                        </div>
                    </CardContent>
                    <CardFooter className="border-t pt-6">
                        <Button>Salvar Alterações</Button>
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
                            <Input id="current-password" type="password" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="new-password">Nova Senha</Label>
                            <Input id="new-password" type="password" />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="confirm-password">Confirmar Nova Senha</Label>
                            <Input id="confirm-password" type="password" />
                        </div>
                    </CardContent>
                    <CardFooter className="border-t pt-6">
                        <Button>Atualizar Senha</Button>
                    </CardFooter>
                </Card>
            </div>
        </div>
    </div>
  );
}
