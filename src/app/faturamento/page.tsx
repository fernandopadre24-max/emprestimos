
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export default function FaturamentoPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Faturamento</CardTitle>
        <CardDescription>
          Gerencie suas informações de faturamento e assinaturas.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-center h-48 text-muted-foreground">
          <p>Página de faturamento em construção.</p>
        </div>
      </CardContent>
    </Card>
  );
}
