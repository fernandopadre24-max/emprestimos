import LoanForm from "./loan-form";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export default function NovoEmprestimoPage() {
  return (
    <div className="grid gap-6">
       <Card>
        <CardHeader>
          <CardTitle className="font-headline">Nova Solicitação de Empréstimo</CardTitle>
          <CardDescription>Preencha os detalhes abaixo para criar uma nova solicitação de empréstimo.</CardDescription>
        </CardHeader>
        <CardContent>
          <LoanForm />
        </CardContent>
      </Card>
    </div>
  );
}
