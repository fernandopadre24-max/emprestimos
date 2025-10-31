
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CreditCard, Download } from "lucide-react";

const paymentHistory = [
    { id: "INV-001", date: "15/07/2024", amount: "R$ 99,90", status: "Pago" },
    { id: "INV-002", date: "15/06/2024", amount: "R$ 99,90", status: "Pago" },
    { id: "INV-003", date: "15/05/2024", amount: "R$ 99,90", status: "Pago" },
    { id: "INV-004", date: "15/04/2024", amount: "R$ 99,90", status: "Pago" },
];

export default function FaturamentoPage() {
  return (
    <div className="grid gap-6">
        <Card>
            <CardHeader>
                <CardTitle className="font-headline">Faturamento</CardTitle>
                <CardDescription>
                Gerencie suas informações de faturamento e assinaturas.
                </CardDescription>
            </CardHeader>
        </Card>
        <div className="grid md:grid-cols-3 gap-6">
            <Card className="md:col-span-1">
                <CardHeader>
                    <CardTitle>Plano Atual</CardTitle>
                    <CardDescription>Você está no Plano Pro.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-1">
                        <p className="text-4xl font-bold font-headline">R$99,90<span className="text-lg font-normal text-muted-foreground">/mês</span></p>
                        <p className="text-xs text-muted-foreground">Sua próxima cobrança será em 15 de Agosto de 2024.</p>
                    </div>
                    <ul className="list-disc list-inside space-y-2 text-sm">
                        <li>Acesso a todos os recursos</li>
                        <li>Relatórios ilimitados via IA</li>
                        <li>Suporte prioritário</li>
                    </ul>
                </CardContent>
                <CardFooter>
                    <Button>Mudar de Plano</Button>
                </CardFooter>
            </Card>

            <Card className="md:col-span-2">
                <CardHeader>
                    <CardTitle>Informações de Faturamento</CardTitle>
                    <CardDescription>Gerencie seu método de pagamento.</CardDescription>
                </CardHeader>
                <CardContent>
                   <div className="flex items-center gap-4 p-4 border rounded-lg bg-muted/50">
                        <CreditCard className="h-8 w-8 text-muted-foreground" />
                        <div className="flex-1">
                            <p className="font-medium">Mastercard terminando em 1234</p>
                            <p className="text-sm text-muted-foreground">Expira em 12/2028</p>
                        </div>
                        <Button variant="outline">Atualizar</Button>
                   </div>
                </CardContent>
            </Card>
        </div>

        <Card>
            <CardHeader>
                <CardTitle>Histórico de Pagamentos</CardTitle>
                <CardDescription>Veja suas faturas e pagamentos anteriores.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Fatura</TableHead>
                            <TableHead>Data</TableHead>
                            <TableHead>Valor</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {paymentHistory.map((invoice) => (
                            <TableRow key={invoice.id}>
                                <TableCell className="font-medium">{invoice.id}</TableCell>
                                <TableCell>{invoice.date}</TableCell>
                                <TableCell>{invoice.amount}</TableCell>
                                <TableCell>
                                    <Badge variant={invoice.status === 'Pago' ? 'secondary' : 'destructive'} className={invoice.status === 'Pago' ? "bg-green-200 text-green-800" : ""}>
                                        {invoice.status}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="icon">
                                        <Download className="h-4 w-4" />
                                        <span className="sr-only">Baixar fatura</span>
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    </div>
  );
}
