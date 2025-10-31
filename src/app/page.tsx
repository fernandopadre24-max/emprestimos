
"use client"

import React, { useState, useMemo } from "react"
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
  LineChart,
  Line,
  AreaChart,
  Area,
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
import type { Loan, Customer, Transaction, BankAccount } from "@/lib/types"
import type { ChartConfig } from "@/components/ui/chart"
import { format, parseISO, getMonth } from "date-fns"
import { ptBR } from "date-fns/locale"
import { ArrowDownCircle, ArrowUpCircle, CreditCard, CircleDollarSign } from "lucide-react"
import { cn } from "@/lib/utils"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useCollection, useFirestore } from "@/firebase"
import { collection, query, collectionGroup, orderBy, limit } from "firebase/firestore"
import { Skeleton } from "@/components/ui/skeleton"


const chartConfig = {
  emprestimos: {
    label: "Empréstimos",
    color: "hsl(var(--chart-1))",
  },
  receitas: {
    label: "Receitas",
    color: "hsl(var(--chart-2))",
  },
  despesas: {
    label: "Despesas",
    color: "hsl(var(--chart-5))",
  },
} satisfies ChartConfig

export default function Dashboard() {
  const firestore = useFirestore();

  const loansQuery = useMemo(() => query(collection(firestore, 'loans'), orderBy('startDate', 'desc')), [firestore]);
  const customersQuery = useMemo(() => collection(firestore, 'customers'), [firestore]);
  const transactionsQuery = useMemo(() => collectionGroup(firestore, 'transactions'), [firestore]);
  const bankAccountsQuery = useMemo(() => collection(firestore, 'bankAccounts'), [firestore]);

  const { data: allLoans, isLoading: isLoadingLoans } = useCollection<Loan>(loansQuery);
  const { data: customers, isLoading: isLoadingCustomers } = useCollection<Customer>(customersQuery);
  const { data: transactions, isLoading: isLoadingTransactions } = useCollection<Transaction>(transactionsQuery);
  const { data: bankAccounts, isLoading: isLoadingBankAccounts } = useCollection<BankAccount>(bankAccountsQuery);
  
  const [chartType, setChartType] = useState<"bar" | "line" | "area">("bar");
  
  const recentLoans = useMemo(() => (allLoans || []).slice(0, 5), [allLoans]);

  const balanceChartData = useMemo(() => {
    const monthlyData: { month: string; emprestimos: number; receitas: number; despesas: number }[] = Array.from({ length: 12 }, (_, i) => ({
      month: format(new Date(new Date().getFullYear(), i, 1), "MMM", { locale: ptBR }),
      emprestimos: 0,
      receitas: 0,
      despesas: 0,
    }));
  
    (transactions || []).forEach(transaction => {
      const monthIndex = getMonth(parseISO(transaction.date));
      if (transaction.type === 'receita') {
        monthlyData[monthIndex].receitas += transaction.amount;
      } else {
        monthlyData[monthIndex].despesas += transaction.amount;
      }
    });

    (allLoans || []).forEach(loan => {
        const monthIndex = getMonth(parseISO(loan.startDate));
        monthlyData[monthIndex].emprestimos += loan.amount;
    });
  
    return monthlyData;
  }, [transactions, allLoans]);


  const totalValue = useMemo(() => (allLoans || []).reduce((acc, loan) => acc + loan.amount, 0), [allLoans])
  const totalCustomers = useMemo(() => (customers || []).length, [customers]);
  
  const profitability = useMemo(() => (allLoans || []).reduce((acc, loan) => {
    if (!loan.installments) return acc;
    const principalPerInstallment = loan.amount / loan.term;
    const loanProfit = loan.installments.reduce((installmentAcc, installment) => {
        if (installment.paidAmount > 0) {
            const profitFromInstallment = installment.paidAmount - principalPerInstallment;
            return installmentAcc + (profitFromInstallment > 0 ? profitFromInstallment : 0);
        }
        return installmentAcc;
    }, 0);
    return acc + loanProfit;
  }, 0), [allLoans]);
  
  const totalReceitas = useMemo(() => (transactions || [])
    .filter(t => t.type === 'receita')
    .reduce((acc, t) => acc + t.amount, 0), [transactions]);

  const totalDespesas = useMemo(() => (transactions || [])
    .filter(t => t.type === 'despesa')
    .reduce((acc, t) => acc + t.amount, 0), [transactions]);
    
  const balancoGeral = totalReceitas - totalDespesas;
  
  const isLoading = isLoadingLoans || isLoadingCustomers || isLoadingTransactions || isLoadingBankAccounts;


  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
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
            {isLoading ? <Skeleton className="h-8 w-3/4" /> :
            <div className="text-2xl font-bold font-headline">
              {totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
            }
            <p className="text-xs text-muted-foreground">
              Total de {(allLoans || []).length} empréstimos concedidos.
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
             {isLoading ? <Skeleton className="h-8 w-1/4" /> :
            <div className="text-2xl font-bold font-headline">+{totalCustomers}</div>
            }
            <p className="text-xs text-muted-foreground">
              Total de clientes cadastrados.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lucratividade (Juros)</CardTitle>
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
            {isLoading ? <Skeleton className="h-8 w-3/4" /> :
            <div className="text-2xl font-bold font-headline">
              {profitability.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
            }
            <p className="text-xs text-muted-foreground">
              Lucro total dos juros pagos.
            </p>
          </CardContent>
        </Card>
        <Card className="bg-green-100/50 border-green-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-800">
                Total Receitas
              </CardTitle>
              <ArrowUpCircle className="h-5 w-5 text-green-600" />
            </CardHeader>
            <CardContent>
              {isLoading ? <Skeleton className="h-8 w-3/4" /> :
              <div className="text-2xl font-bold font-headline text-green-800">
                {totalReceitas.toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                })}
              </div>
              }
              <p className="text-xs text-green-700">
                Soma de todas as receitas
              </p>
            </CardContent>
          </Card>
          <Card className="bg-red-100/50 border-red-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-red-800">
                Total Despesas
              </CardTitle>
              <ArrowDownCircle className="h-5 w-5 text-red-600" />
            </CardHeader>
            <CardContent>
              {isLoading ? <Skeleton className="h-8 w-3/4" /> :
              <div className="text-2xl font-bold font-headline text-red-800">
                {totalDespesas.toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                })}
              </div>
              }
              <p className="text-xs text-red-700">Soma de todas as despesas</p>
            </CardContent>
          </Card>
          <Card className="bg-blue-100/50 border-blue-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-800">
                Balanço Geral
              </CardTitle>
              <CircleDollarSign className="h-5 w-5 text-blue-600" />
            </CardHeader>
            <CardContent>
              {isLoading ? <Skeleton className="h-8 w-3/4" /> :
              <div className="text-2xl font-bold font-headline text-blue-800">
                {balancoGeral.toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                })}
              </div>
              }
              <p className="text-xs text-blue-700">Receitas - Despesas</p>
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
                {isLoading && Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                        <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-6 w-16 rounded-full" /></TableCell>
                    </TableRow>
                ))}
                {!isLoading && recentLoans.map(loan => {
                  const date = parseISO(loan.startDate);
                  const customer = (customers || []).find(c => c.id === loan.customerId);
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
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle className="font-headline">Balanço Geral</CardTitle>
                        <CardDescription>Balanço mensal do ano corrente</CardDescription>
                    </div>
                    <Tabs defaultValue="bar" className="w-auto" onValueChange={(value) => setChartType(value as "bar" | "line" | "area")}>
                        <TabsList>
                            <TabsTrigger value="bar">Barras</TabsTrigger>
                            <TabsTrigger value="line">Linhas</TabsTrigger>
                            <TabsTrigger value="area">Área</TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>
            </CardHeader>
            <CardContent className="pl-2">
              {isLoading ? <Skeleton className="w-full h-[300px]" /> :
                <ChartContainer config={chartConfig} className="w-full h-[300px]">
                    {chartType === 'bar' && 
                        <BarChart data={balanceChartData}>
                            <CartesianGrid vertical={false} />
                            <XAxis dataKey="month" tickLine={false} tickMargin={10} axisLine={false} />
                            <YAxis />
                            <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
                            <Bar dataKey="emprestimos" fill="var(--color-emprestimos)" radius={4} />
                            <Bar dataKey="receitas" fill="var(--color-receitas)" radius={4} />
                            <Bar dataKey="despesas" fill="var(--color-despesas)" radius={4} />
                        </BarChart>
                    }
                    {chartType === 'line' &&
                        <LineChart data={balanceChartData}>
                            <CartesianGrid vertical={false} />
                            <XAxis dataKey="month" tickLine={false} tickMargin={10} axisLine={false} />
                            <YAxis />
                            <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
                            <Line dataKey="emprestimos" stroke="var(--color-emprestimos)" />
                            <Line dataKey="receitas" stroke="var(--color-receitas)" />
                            <Line dataKey="despesas" stroke="var(--color-despesas)" />
                        </LineChart>
                    }
                    {chartType === 'area' &&
                        <AreaChart data={balanceChartData}>
                            <CartesianGrid vertical={false} />
                            <XAxis dataKey="month" tickLine={false} tickMargin={10} axisLine={false} />
                            <YAxis />
                            <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
                            <Area dataKey="emprestimos" fill="var(--color-emprestimos)" stroke="var(--color-emprestimos)" />
                            <Area dataKey="receitas" fill="var(--color-receitas)" stroke="var(--color-receitas)" />
                            <Area dataKey="despesas" fill="var(--color-despesas)" stroke="var(--color-despesas)" />
                        </AreaChart>
                    }
                </ChartContainer>
                }
            </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Saldos em Contas</CardTitle>
          <CardDescription>
            Resumo dos saldos em todas as contas bancárias cadastradas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Banco</TableHead>
                <TableHead>Conta</TableHead>
                <TableHead className="text-right">Saldo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && Array.from({ length: 2 }).map((_, i) => (
                    <TableRow key={i}>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-4 w-24" /></TableCell>
                    </TableRow>
              ))}
              {!isLoading && (bankAccounts || []).map((account) => (
                <TableRow key={account.id}>
                  <TableCell className="font-medium">{account.banco}</TableCell>
                  <TableCell>{account.agencia} / {account.conta}</TableCell>
                  <TableCell className={cn("text-right font-medium", account.saldo >= 0 ? 'text-green-600' : 'text-red-600')}>
                    {account.saldo.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

    