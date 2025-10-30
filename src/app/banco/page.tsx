
"use client"

import { useState } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  ArrowDownCircle,
  ArrowUpCircle,
  ChevronDown,
  CircleDollarSign,
  CreditCard,
  Trash2,
  FilePenLine,
  ArrowRightLeft,
  Settings,
  Plus,
} from "lucide-react"

import { bankAccounts, bankSummary } from "@/lib/data"
import type { BankAccount } from "@/lib/types"

import { AddAccountDialog } from "@/components/banco/add-account-dialog"
import { NewTransactionDialog } from "@/components/banco/new-transaction-dialog"

export default function BancoPage() {
  const [isAddAccountOpen, setAddAccountOpen] = useState(false);
  const [isTransactionOpen, setTransactionOpen] = useState(false);
  const [transactionType, setTransactionType] = useState<"receita" | "despesa">("receita");
  const [selectedAccount, setSelectedAccount] = useState<BankAccount | null>(null);

  const handleTransaction = (account: BankAccount, type: "receita" | "despesa") => {
    setSelectedAccount(account);
    setTransactionType(type);
    setTransactionOpen(true);
  }

  const handleAddAccount = () => {
     // Lógica para adicionar a conta viria aqui
    setAddAccountOpen(false);
  }

  const handleNewTransaction = () => {
    // Lógica para adicionar a transação viria aqui
    setTransactionOpen(false);
  }

  return (
    <>
      <div className="flex flex-col gap-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold font-headline">Bancos</h1>
            <p className="text-muted-foreground">Controle Financeiro</p>
          </div>
          <div className="flex gap-2">
              <Button variant="outline">
                  <Settings className="mr-2 h-4 w-4" />
                  Gerenciar Categorias
              </Button>
              <Button onClick={() => setAddAccountOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar Conta
              </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-green-100/50 border-green-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-800">
                Receitas
              </CardTitle>
              <ArrowUpCircle className="h-5 w-5 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-headline text-green-800">
                {bankSummary.receitas.toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                })}
              </div>
              <p className="text-xs text-green-700">
                Total de entradas do período
              </p>
            </CardContent>
          </Card>
          <Card className="bg-red-100/50 border-red-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-red-800">
                Despesas
              </CardTitle>
              <ArrowDownCircle className="h-5 w-5 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-headline text-red-800">
                {bankSummary.despesas.toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                })}
              </div>
              <p className="text-xs text-red-700">Total de saídas do período</p>
            </CardContent>
          </Card>
          <Card className="bg-blue-100/50 border-blue-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-800">
                Balanço do Período
              </CardTitle>
              <CircleDollarSign className="h-5 w-5 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-headline text-blue-800">
                {bankSummary.balanco.toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                })}
              </div>
              <p className="text-xs text-blue-700">Receitas - Despesas</p>
            </CardContent>
          </Card>
          <Card className="bg-purple-100/50 border-purple-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-800">
                Saldo em Contas
              </CardTitle>
              <CreditCard className="h-5 w-5 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-headline text-purple-800">
                {bankSummary.saldoContas.toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                })}
              </div>
              <p className="text-xs text-purple-700">Soma dos saldos bancários</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12"></TableHead>
                <TableHead>Banco</TableHead>
                <TableHead>Agência</TableHead>
                <TableHead>Conta</TableHead>
                <TableHead>Saldo</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bankAccounts.map((account: BankAccount) => (
                <TableRow key={account.id}>
                  <TableCell>
                    <ChevronDown className="h-4 w-4" />
                  </TableCell>
                  <TableCell className="font-medium">{account.banco}</TableCell>
                  <TableCell>{account.agencia}</TableCell>
                  <TableCell>{account.conta}</TableCell>
                  <TableCell className="font-medium text-green-600">
                    {account.saldo.toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-green-500 hover:text-green-600" onClick={() => handleTransaction(account, 'receita')}>
                        <ArrowUpCircle className="h-4 w-4" />
                      </Button>
                       <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600" onClick={() => handleTransaction(account, 'despesa')}>
                        <ArrowDownCircle className="h-4 w-4" />
                      </Button>
                       <Button variant="ghost" size="icon" className="h-8 w-8">
                        <ArrowRightLeft className="h-4 w-4" />
                      </Button>
                       <Button variant="ghost" size="icon" className="h-8 w-8">
                        <FilePenLine className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>

      <AddAccountDialog
        isOpen={isAddAccountOpen}
        onOpenChange={setAddAccountOpen}
        onSubmit={handleAddAccount}
      />

      <NewTransactionDialog
        isOpen={isTransactionOpen}
        onOpenChange={setTransactionOpen}
        onSubmit={handleNewTransaction}
        transactionType={transactionType}
        account={selectedAccount}
      />
    </>
  )
}
