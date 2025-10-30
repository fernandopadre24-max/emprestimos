import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import ReportForm from "./report-form";

export default function RelatoriosPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Gerador de Relatórios Financeiros</CardTitle>
        <CardDescription>
          Use nossa ferramenta de IA para gerar relatórios financeiros detalhados ou resumidos com base em um período específico.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ReportForm />
      </CardContent>
    </Card>
  );
}
