
"use client"

import React, { useMemo } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import type { Loan, Customer, BankAccount } from "@/lib/types"
import { format, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"
import { CircleDollarSign, CreditCard, Users } from "lucide-react"
import { useCollection, useFirestore } from "@/firebase"
import { collection, query, orderBy, limit } from "firebase/firestore"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"


export default function Dashboard() {
  const firestore = useFirestore();

  const loansQuery = useMemo(() => query(collection(firestore, 'loans'), orderBy('startDate', 'desc')), [firestore]);
  const customersQuery = useMemo(() => collection(firestore, 'customers'), [firestore]);
  const bankAccountsQuery = useMemo(() => collection(firestore, 'bankAccounts'), [firestore]);

  const { data: allLoans, isLoading: isLoadingLoans } = useCollection<Loan>(loansQuery);
  const { data: customers, isLoading: isLoadingCustomers } = useCollection<Customer>(customersQuery);
  const { data: bankAccounts, isLoading: isLoadingBankAccounts } = useCollection<BankAccount>(bankAccountsQuery);
  
  const recentLoans = useMemo(() => (allLoans || []).slice(0, 5), [allLoans]);
  const totalValue = useMemo(() => (allLoans || []).reduce((acc, loan) => acc + loan.amount, 0), [allLoans])
  const totalCustomers = useMemo(() => (customers || []).length, [customers]);
  const totalBalance = useMemo(() => (bankAccounts || []).reduce((acc, account) => acc + account.saldo, 0), [bankAccounts]);
  
  const isLoading = isLoadingLoans || isLoadingCustomers || isLoadingBankAccounts;


  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Valor Total Emprestado
            </CardTitle>
            <CircleDollarSign className="h-4 w-4 text-muted-foreground" />
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
            <Users className="h-4 w-4 text-muted-foreground" />
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
            <CardTitle className="text-sm font-medium">Saldo Total em Contas</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-3/4" /> :
            <div className="text-2xl font-bold font-headline text-primary">
              {totalBalance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
            }
            <p className="text-xs text-muted-foreground">
              Soma dos saldos disponíveis.
            </p>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-7">
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
