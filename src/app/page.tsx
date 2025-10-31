
"use client"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "@/components/ui/chart"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { loans as initialLoans, customers as initialCustomers, chartData } from "@/lib/data"
import type { Loan, Customer } from "@/lib/types"
import type { ChartConfig } from "@/components/ui/chart"
import { format, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"
import { useState, useEffect } from "react"

const chartConfig = {
  emprestimos: {
    label: "Empréstimos",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig

export default function Dashboard() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);

  useEffect(() => {
    const storedLoans = localStorage.getItem("loans");
    const storedCustomers = localStorage.getItem("customers");

    setLoans(storedLoans ? JSON.parse(storedLoans) : initialLoans);
    setCustomers(storedCustomers ? JSON.parse(storedCustomers) : initialCustomers);
  }, []);

  const totalValue = loans.reduce((acc, loan) => acc + loan.amount, 0)
  const totalCustomers = customers.length
  const profitability = loans.reduce((acc, loan) => {
    const principalPerInstallment = loan.amount / loan.term;
    const loanProfit = loan.installments.reduce((installmentAcc, installment) => {
        if (installment.paidAmount > 0) {
            // A simple approximation of interest is the part of the payment that exceeds the principal for that installment.
            // This is not entirely accurate for amortization schedules but gives a good estimate of profit from payments.
            const profitFromInstallment = installment.paidAmount - principalPerInstallment;
            return installmentAcc + (profitFromInstallment > 0 ? profitFromInstallment : 0);
        }
        return installmentAcc;
    }, 0);
    return acc + loanProfit;
  }, 0);
  const recentLoans = loans.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()).slice(0, 5);


  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Valor Total Emprestado
            </CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <line x1="12" x2="12" y1="2" y2="22" />
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-headline">
              {totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
            <p className="text-xs text-muted-foreground">
              Total de {loans.length} empréstimos concedidos.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clientes Ativos</CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-headline">+{totalCustomers}</div>
            <p className="text-xs text-muted-foreground">
              Total de clientes cadastrados.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lucratividade</CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4 text-muted-foreground"
            >
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-headline">
              {profitability.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
            <p className="text-xs text-muted-foreground">
              Lucro total dos juros pagos.
            </p>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle className="font-headline">Empréstimos Recentes</CardTitle>
            <CardDescription>
              Os 5 empréstimos mais recentes.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Código</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead className="hidden md:table-cell">Data</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentLoans.map(loan => {
                  const date = parseISO(loan.startDate);
                  const customer = customers.find(c => c.id === loan.customerId);
                  return (
                  <TableRow key={loan.id}>
                    <TableCell>
                      <div className="font-medium">{customer?.name}</div>
                      <div className="hidden text-sm text-muted-foreground md:inline">
                         {customer?.email}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono">{loan.loanCode}</TableCell>
                    <TableCell>{loan.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      {format(date, "dd/MM/yyyy", { locale: ptBR })}
                    </TableCell>
                    <TableCell className="text-right">
                       <Badge variant={loan.status === 'Pago' ? 'default' : loan.status === 'Atrasado' ? 'destructive' : 'secondary'} className={loan.status === 'Pago' ? "bg-accent text-accent-foreground" : ""}>
                        {loan.status}
                       </Badge>
                    </TableCell>
                  </TableRow>
                )})}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="font-headline">Distribuição de Empréstimos</CardTitle>
            <CardDescription>Janeiro - Junho 2024</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
              <ChartContainer config={chartConfig} className="w-full h-[300px]">
                <BarChart accessibilityLayer data={chartData}>
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="month"
                    tickLine={false}
                    tickMargin={10}
                    axisLine={false}
                    tickFormatter={(value) => value.slice(0, 3)}
                  />
                  <YAxis />
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent indicator="dot" />}
                  />
                  <Bar dataKey="emprestimos" fill="var(--color-emprestimos)" radius={8} />
                </BarChart>
              </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
