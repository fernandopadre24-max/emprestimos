
"use client"

import React, { useState, useEffect, useMemo } from "react"
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
  X,
} from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

import type { BankAccount, Transaction, NewBankAccount, Category } from "@/lib/types"

import { AddAccountDialog } from "@/components/banco/add-account-dialog"
import { EditAccountDialog } from "@/components/banco/edit-account-dialog"
import { NewTransactionDialog } from "@/components/banco/new-transaction-dialog"
import { EditTransactionDialog } from "@/components/banco/edit-transaction-dialog"
import { ManageCategoriesDialog } from "@/components/banco/manage-categories-dialog"
import { Badge } from "@/components/ui/badge"
import { format, parseISO, isWithinInterval } from "date-fns"
import { ptBR } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DateRangePicker } from "@/components/ui/date-range-picker"
import type { DateRange } from "react-day-picker"

import { bankAccounts as mockBankAccounts, transactions as mockTransactions, categories as mockCategories } from "@/lib/data"


interface FilterState {
  searchTerm: string;
  type: string;
  dateRange: DateRange | undefined;
}

const initialFilterState: FilterState = {
  searchTerm: '',
  type: 'todos',
  dateRange: undefined,
};


export default function BancoPage() {
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>(mockBankAccounts);
  const [transactions, setTransactions] = useState<Transaction[]>(mockTransactions);
  const [categories, setCategories] = useState<Category[]>(mockCategories);

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
  const [isManageCategoriesOpen, setManageCategoriesOpen] = useState(false);
  const [isDeleteTransactionAlertOpen, setDeleteTransactionAlertOpen] = useState(false);


  const [transactionType, setTransactionType] = useState<"receita" | "despesa">("receita");
  const [selectedAccount, setSelectedAccount] = useState<BankAccount | null>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [expandedRows, setExpandedRows] = useState<string[]>([]);
  const [filters, setFilters] = useState<Record<string, FilterState>>({});


  useEffect(() => {
    // Recalculate summary whenever accounts or transactions change
    const saldoContas = (bankAccounts || []).reduce((acc, account) => acc + account.saldo, 0);
    
    const receitas = (transactions || [])
      .filter(t => t.type === 'receita')
      .reduce((acc, t) => acc + t.amount, 0);

    const despesas = (transactions || [])
      .filter(t => t.type === 'despesa')
      .reduce((acc, t) => acc + t.amount, 0);

    const balanco = receitas - despesas;
    
    setBankSummary({ saldoContas, receitas, despesas, balanco });
  }, [bankAccounts, transactions]);


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
      id: `BA${Date.now()}`,
      saldo: 0,
      ...newAccountData
    };
    setBankAccounts(prev => [...prev, newAccount]);
    setAddAccountOpen(false);
  }

  const handleEditAccount = (editedAccountData: Partial<BankAccount>) => {
    if (!selectedAccount) return;
    setBankAccounts(prev => prev.map(acc => acc.id === selectedAccount.id ? {...acc, ...editedAccountData} : acc));
    setEditAccountOpen(false);
  }
  
  const handleDeleteAccount = (accountId: string) => {
    setBankAccounts(prev => prev.filter(acc => acc.id !== accountId));
  }

  const handleNewTransaction = (transactionData: Omit<Transaction, 'id' | 'accountId' | 'type' | 'date'>) => {
    if(!selectedAccount) return;
    
    const newTransaction: Transaction = {
      id: `T${Date.now()}`,
      accountId: selectedAccount.id,
      type: transactionType,
      date: new Date().toISOString(),
      ...transactionData,
    };
    
    setTransactions(prev => [...prev, newTransaction]);

    setBankAccounts(prev => prev.map(acc => {
      if (acc.id === selectedAccount.id) {
        const newBalance = transactionType === 'receita'
          ? acc.saldo + newTransaction.amount
          : acc.saldo - newTransaction.amount;
        return { ...acc, saldo: newBalance };
      }
      return acc;
    }));

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
    
    if (oldTransaction.sourceId?.startsWith('loan:')) {
        alert("Não é possível editar transações de empréstimo diretamente. Estorne o pagamento na tela de Empréstimos.");
        setEditTransactionOpen(false);
        return;
    }
    
    setTransactions(prev => prev.map(tx => tx.id === selectedTransaction.id ? {...tx, ...editedTransactionData} : tx));

    const amountDifference = (editedTransactionData.amount ?? oldTransaction.amount) - oldTransaction.amount;
    if (amountDifference !== 0) {
      setBankAccounts(prev => prev.map(acc => {
        if(acc.id === oldTransaction.accountId) {
          let newBalance = acc.saldo;
          if (oldTransaction.type === 'receita') {
              newBalance += amountDifference;
          } else {
              newBalance -= amountDifference;
          }
          return {...acc, saldo: newBalance};
        }
        return acc;
      }))
    }

    setEditTransactionOpen(false);
    setSelectedTransaction(null);
  };

  const handleDeleteTransactionClick = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setDeleteTransactionAlertOpen(true);
  }

  const handleDeleteTransaction = () => {
    if (!selectedTransaction) return;

    if (selectedTransaction.sourceId?.startsWith('loan:')) {
        alert("Não é possível excluir transações de empréstimo diretamente. Estorne o pagamento na tela de Empréstimos.");
        setDeleteTransactionAlertOpen(false);
        return;
    }
    
    setTransactions(prev => prev.filter(tx => tx.id !== selectedTransaction.id));
    
    setBankAccounts(prev => prev.map(acc => {
      if(acc.id === selectedTransaction.accountId) {
        const newBalance = selectedTransaction.type === 'receita'
            ? acc.saldo - selectedTransaction.amount
            : acc.saldo + selectedTransaction.amount;
        return {...acc, saldo: newBalance};
      }
      return acc;
    }));


    setDeleteTransactionAlertOpen(false);
    setSelectedTransaction(null);
  }

  const handleAddCategory = (category: Omit<Category, 'id'>) => {
    const newCategory: Category = { id: `C${Date.now()}`, ...category };
    setCategories(prev => [...prev, newCategory]);
  }

  const handleDeleteCategory = (categoryId: string) => {
    setCategories(prev => prev.filter(c => c.id !== categoryId));
  }

  const toggleRow = (id: string) => {
    setExpandedRows(current =>
      current.includes(id) ? current.filter(rowId => rowId !== id) : [...current, id]
    );
    // Initialize filter state for the account if it doesn't exist
    if (!filters[id]) {
      setFilters(prev => ({
        ...prev,
        [id]: initialFilterState,
      }));
    }
  }

  const handleFilterChange = (accountId: string, key: keyof FilterState, value: any) => {
    setFilters(prev => ({
      ...prev,
      [accountId]: {
        ...prev[accountId],
        [key]: value,
      },
    }));
  };
  
  const clearFilters = (accountId: string) => {
    setFilters(prev => ({
      ...prev,
      [accountId]: initialFilterState,
    }));
  };


  return (
    <>
      <div className="flex flex-col gap-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold font-headline">Bancos</h1>
            <p className="text-muted-foreground">Controle Financeiro</p>
          </div>
          <div className="flex gap-2">
              <Button variant="outline" onClick={() => setManageCategoriesOpen(true)}>
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
                const accountFilter = filters[account.id] || initialFilterState;
                
                const accountTransactions = transactions
                  .filter(t => t.accountId === account.id)
                  .filter(t => 
                    t.description.toLowerCase().includes(accountFilter.searchTerm.toLowerCase())
                  )
                  .filter(t => 
                    accountFilter.type === 'todos' ? true : t.type === accountFilter.type
                  )
                  .filter(t => {
                    const { dateRange } = accountFilter;
                    if (!dateRange || (!dateRange.from && !dateRange.to)) {
                      return true;
                    }
                    const txDate = parseISO(t.date);
                    return isWithinInterval(txDate, {
                      start: dateRange.from || new Date(0),
                      end: dateRange.to || new Date(),
                    });
                  })
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
                            <div className="flex justify-between items-center mb-4">
                                <h4 className="font-bold">Transações Recentes</h4>
                                <div className="flex items-center gap-2">
                                    <Input 
                                        placeholder="Buscar por descrição..." 
                                        className="max-w-xs"
                                        value={accountFilter.searchTerm}
                                        onChange={(e) => handleFilterChange(account.id, 'searchTerm', e.target.value)}
                                    />
                                    <Select
                                        value={accountFilter.type}
                                        onValueChange={(value) => handleFilterChange(account.id, 'type', value)}
                                    >
                                        <SelectTrigger className="w-[180px]">
                                            <SelectValue placeholder="Filtrar por tipo" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="todos">Todos</SelectItem>
                                            <SelectItem value="receita">Receitas</SelectItem>
                                            <SelectItem value="despesa">Despesas</SelectItem>
                                        </SelectContent>
                                    </Select>
                                     <DateRangePicker
                                      date={accountFilter.dateRange}
                                      onDateChange={(date) => handleFilterChange(account.id, 'dateRange', date)}
                                    />
                                    <Button variant="ghost" onClick={() => clearFilters(account.id)}>
                                        <X className="mr-2 h-4 w-4" /> Limpar
                                    </Button>
                                </div>
                            </div>
                            {accountTransactions.length > 0 ? (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Data</TableHead>
                                            <TableHead>Descrição</TableHead>
                                            <TableHead>Categoria</TableHead>
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
                                                    {tx.category && <Badge variant="outline">{tx.category}</Badge>}
                                                </TableCell>
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
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600" onClick={() => handleDeleteTransactionClick(tx)}>
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                  </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            ) : (
                                <p className="text-sm text-muted-foreground text-center py-4">Nenhuma transação encontrada para esta conta com os filtros aplicados.</p>
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
        categories={categories || []}
      />

      <EditTransactionDialog
        isOpen={isEditTransactionOpen}
        onOpenChange={setEditTransactionOpen}
        onSubmit={handleEditTransaction}
        transaction={selectedTransaction}
        categories={categories || []}
      />
      
      <ManageCategoriesDialog
        isOpen={isManageCategoriesOpen}
        onOpenChange={setManageCategoriesOpen}
        categories={categories || []}
        onAddCategory={handleAddCategory}
        onDeleteCategory={handleDeleteCategory}
      />
      <AlertDialog open={isDeleteTransactionAlertOpen} onOpenChange={setDeleteTransactionAlertOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
                Esta ação não pode ser desfeita. Isso irá excluir permanentemente a transação e reverter o valor no saldo da conta.
            </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTransaction}>Confirmar</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </>
  )
}
