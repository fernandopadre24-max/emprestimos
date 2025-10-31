
"use client"

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ThemeToggle } from "@/components/theme-toggle";

export default function SettingsPage() {
  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Configurações</CardTitle>
          <CardDescription>
            Gerencie as configurações da sua conta e as preferências do aplicativo.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Preferências</CardTitle>
            <CardDescription>Ajuste as configurações gerais do aplicativo.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between space-x-2">
              <Label htmlFor="language" className="flex flex-col space-y-1">
                <span>Idioma</span>
                <span className="font-normal leading-snug text-muted-foreground">
                  Selecione o idioma da interface.
                </span>
              </Label>
              <Select defaultValue="pt-br">
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Idioma" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pt-br">Português (Brasil)</SelectItem>
                  <SelectItem value="en-us">Inglês (EUA)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between space-x-2">
              <Label htmlFor="email-notifications" className="flex flex-col space-y-1">
                <span>Notificações por E-mail</span>
                <span className="font-normal leading-snug text-muted-foreground">
                  Receba atualizações sobre empréstimos e pagamentos.
                </span>
              </Label>
              <Switch id="email-notifications" defaultChecked />
            </div>
             <div className="flex items-center justify-between space-x-2">
              <Label htmlFor="push-notifications" className="flex flex-col space-y-1">
                <span>Notificações Push</span>
                <span className="font-normal leading-snug text-muted-foreground">
                  Receba alertas diretamente no seu dispositivo.
                </span>
              </Label>
              <Switch id="push-notifications" />
            </div>
          </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <CardTitle>Tema</CardTitle>
                <CardDescription>Customize a aparência do aplicativo.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex items-center justify-between space-x-2">
                    <Label htmlFor="theme-toggle" className="flex flex-col space-y-1">
                        <span>Aparência</span>
                        <span className="font-normal leading-snug text-muted-foreground">
                        Escolha entre o modo claro, escuro ou o padrão do sistema.
                        </span>
                    </Label>
                    <ThemeToggle />
                </div>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
