
"use client"

import React, { useState, useEffect } from "react"
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

import { bankAccounts as initialBankAccounts, transactions as initialTransactions } from "@/lib/data"
import type { BankAccount, Transaction, NewBankAccount } from "@/lib/types"

import { AddAccountDialog } from "@/components/banco/add-account-dialog"
import { EditAccountDialog } from "@/components/banco/edit-account-dialog"
import { NewTransactionDialog } from "@/components/banco/new-transaction-dialog"
import { EditTransactionDialog } from "@/components/banco/edit-transaction-dialog"
import { Badge } from "@/components/ui/badge"
import { format, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"
import { cn } from "@/lib/utils"

export default function BancoPage() {
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [bankSummary, setBankSummary] = useState({
    receitas: 0,
    despesas: 0,
    balanco: 0,
    saldoContas: 0
  });

  const [isAddAccountOpen, setAddAccountOpen] = useState(false);
  const [isEditAccountOpen, setEditAccountOpen] = useState(false);
  const [isTransactionOpen, setTransactionOpen] = useState(false);
  const [isEditTransactionOpen, setEditTransactionOpen] = useState(false);
  const [transactionType, setTransactionType] = useState<"receita" | "despesa">("receita");
  const [selectedAccount, setSelectedAccount] = useState<BankAccount | null>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [expandedRows, setExpandedRows] = useState<string[]>([]);

  useEffect(() => {
    const storedBankAccounts = localStorage.getItem("bankAccounts");
    const storedTransactions = localStorage.getItem("transactions");

    const accountsData = storedBankAccounts ? JSON.parse(storedBankAccounts) : initialBankAccounts;
    const transactionsData = storedTransactions ? JSON.parse(storedTransactions) : initialTransactions;

    setBankAccounts(accountsData);
    setTransactions(transactionsData);

    if (!storedBankAccounts) localStorage.setItem("bankAccounts", JSON.stringify(accountsData));
    if (!storedTransactions) localStorage.setItem("transactions", JSON.stringify(transactionsData));
  }, []);

  useEffect(() => {
    // Recalculate summary whenever accounts or transactions change
    const saldoContas = bankAccounts.reduce((acc, account) => acc + account.saldo, 0);
    
    const receitas = transactions
      .filter(t => t.type === 'receita')
      .reduce((acc, t) => acc + t.amount, 0);

    const despesas = transactions
      .filter(t => t.type === 'despesa')
      .reduce((acc, t) => acc + t.amount, 0);

    const balanco = receitas - despesas;
    
    setBankSummary({ saldoContas, receitas, despesas, balanco });
  }, [bankAccounts, transactions]);


  const updateAndStoreBankAccounts = (newAccounts: BankAccount[]) => {
    setBankAccounts(newAccounts);
    localStorage.setItem("bankAccounts", JSON.stringify(newAccounts));
  }
  
  const updateAndStoreTransactions = (newTransactions: Transaction[]) => {
    setTransactions(newTransactions);
    localStorage.setItem("transactions", JSON.stringify(newTransactions));
  }


  const handleTransaction = (account: BankAccount, type: "receita" | "despesa") => {
    setSelectedAccount(account);
    setTransactionType(type);
    setTransactionOpen(true);
  }

  const handleEditAccountClick = (account: BankAccount) => {
    setSelectedAccount(account);
    setEditAccountOpen(true);
  }

  const handleAddAccount = (newAccountData: NewBankAccount) => {
    const newAccount: BankAccount = {
      id: (Math.random() + 1).toString(36).substring(7),
      saldo: 0,
      ...newAccountData
    };
    updateAndStoreBankAccounts([...bankAccounts, newAccount]);
    setAddAccountOpen(false);
  }

  const handleEditAccount = (editedAccountData: Partial<BankAccount>) => {
    if (!selectedAccount) return;
    
    const updatedAccounts = bankAccounts.map(account => 
      account.id === selectedAccount.id ? { ...account, ...editedAccountData } : account
    );
    updateAndStoreBankAccounts(updatedAccounts);
    setEditAccountOpen(false);
  }
  
  const handleDeleteAccount = (accountId: string) => {
    const updatedAccounts = bankAccounts.filter(account => account.id !== accountId);
    updateAndStoreBankAccounts(updatedAccounts);
  }

  const handleNewTransaction = (transactionData: Omit<Transaction, 'id' | 'accountId' | 'type' | 'date'>) => {
    if(!selectedAccount) return;
    const newTransaction: Transaction = {
      id: `T${(Math.random() + 1).toString(36).substring(7)}`,
      accountId: selectedAccount.id,
      type: transactionType,
      date: new Date().toISOString(),
      ...transactionData,
    };
    
    updateAndStoreTransactions([...transactions, newTransaction]);
    
    const updatedAccounts = bankAccounts.map(account => {
        if(account.id === selectedAccount.id) {
            const newBalance = transactionType === 'receita' ? account.saldo + newTransaction.amount : account.saldo - newTransaction.amount;
            return { ...account, saldo: newBalance };
        }
        return account;
    });
    updateAndStoreBankAccounts(updatedAccounts);

    setTransactionOpen(false);
  }

  const handleEditTransactionClick = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setEditTransactionOpen(true);
  };

  const handleEditTransaction = (editedTransactionData: Partial<Transaction>) => {
    if (!selectedTransaction) return;

    const oldTransaction = transactions.find(t => t.id === selectedTransaction.id);
    if (!oldTransaction) return;

    // Prevent direct editing of loan-related transactions for now
    if (oldTransaction.sourceId?.startsWith('loan:')) {
        alert("Não é possível editar transações de empréstimo diretamente. Estorne o pagamento na tela de Empréstimos.");
        setEditTransactionOpen(false);
        return;
    }

    const updatedTransactions = transactions.map(t =>
      t.id === selectedTransaction.id ? { ...t, ...editedTransactionData } : t
    );
    updateAndStoreTransactions(updatedTransactions);

    // Adjust account balance
    const amountDifference = (editedTransactionData.amount ?? oldTransaction.amount) - oldTransaction.amount;

    const updatedAccounts = bankAccounts.map(account => {
      if (account.id === oldTransaction.accountId) {
        let newBalance = account.saldo;
        if (oldTransaction.type === 'receita') {
            newBalance += amountDifference;
        } else { // despesa
            newBalance -= amountDifference;
        }
        return { ...account, saldo: newBalance };
      }
      return account;
    });
    updateAndStoreBankAccounts(updatedAccounts);

    setEditTransactionOpen(false);
    setSelectedTransaction(null);
  };

  const toggleRow = (id: string) => {
    setExpandedRows(current =>
      current.includes(id) ? current.filter(rowId => rowId !== id) : [...current, id]
    );
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
              {bankAccounts.map((account: BankAccount) => {
                const isExpanded = expandedRows.includes(account.id);
                const accountTransactions = transactions
                  .filter(t => t.accountId === account.id)
                  .sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime());
                return (
                <React.Fragment key={account.id}>
                  <TableRow>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => toggleRow(account.id)} className="h-8 w-8">
                        <ChevronDown className={cn("h-4 w-4 transition-transform", isExpanded && "rotate-180")} />
                      </Button>
                    </TableCell>
                    <TableCell className="font-medium">{account.banco}</TableCell>
                    <TableCell>{account.agencia}</TableCell>
                    <TableCell>{account.conta}</TableCell>
                    <TableCell className={cn("font-medium", account.saldo >= 0 ? 'text-green-600' : 'text-red-600')}>
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
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditAccountClick(account)}>
                          <FilePenLine className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600" onClick={() => handleDeleteAccount(account.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  {isExpanded && (
                     <TableRow>
                        <TableCell colSpan={6}>
                          <div className="p-4 bg-muted/50 rounded-md">
                            <h4 className="font-bold mb-2">Transações Recentes</h4>
                            {accountTransactions.length > 0 ? (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Data</TableHead>
                                            <TableHead>Descrição</TableHead>
                                            <TableHead>Tipo</TableHead>
                                            <TableHead className="text-right">Valor</TableHead>
                                            <TableHead className="text-right">Ações</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {accountTransactions.map((tx: Transaction) => (
                                            <TableRow key={tx.id}>
                                                <TableCell>{format(parseISO(tx.date), "dd/MM/yyyy", { locale: ptBR })}</TableCell>
                                                <TableCell>{tx.description}</TableCell>
                                                <TableCell>
                                                    <Badge variant={tx.type === 'receita' ? 'secondary' : 'destructive'} className={tx.type === 'receita' ? "bg-green-200 text-green-800" : ""}>{tx.type}</Badge>
                                                </TableCell>
                                                <TableCell className={cn("text-right font-medium", tx.type === 'receita' ? 'text-green-600' : 'text-red-600')}>
                                                    {tx.amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL"})}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                  <div className="flex justify-end gap-2">
                                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditTransactionClick(tx)}>
                                                        <FilePenLine className="h-4 w-4" />
                                                    </Button>
                                                  </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            ) : (
                                <p className="text-sm text-muted-foreground text-center py-4">Nenhuma transação para esta conta.</p>
                            )}
                          </div>
                        </TableCell>
                     </TableRow>
                  )}
                </React.Fragment>
              )})}
            </TableBody>
          </Table>
        </Card>
      </div>

      <AddAccountDialog
        isOpen={isAddAccountOpen}
        onOpenChange={setAddAccountOpen}
        onSubmit={handleAddAccount}
      />
      
      <EditAccountDialog
        isOpen={isEditAccountOpen}
        onOpenChange={setEditAccountOpen}
        onSubmit={handleEditAccount}
        account={selectedAccount}
      />

      <NewTransactionDialog
        isOpen={isTransactionOpen}
        onOpenChange={setTransactionOpen}
        onSubmit={handleNewTransaction}
        transactionType={transactionType}
        account={selectedAccount}
      />

      <EditTransactionDialog
        isOpen={isEditTransactionOpen}
        onOpenChange={setEditTransactionOpen}
        onSubmit={handleEditTransaction}
        transaction={selectedTransaction}
      />
    </>
  )
}

    

    