
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
  CreditCard,
  Trash2,
  FilePenLine,
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
import { Skeleton } from "@/components/ui/skeleton"
import { useCollection, useFirestore } from "@/firebase"
import { addTransaction, deleteTransaction, updateTransaction } from "@/lib/transactions"
import { addBankAccount, deleteBankAccount, updateBankAccount } from "@/lib/bank"
import { addCategory, deleteCategory } from "@/lib/categories"
import { collection, query } from "firebase/firestore"

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

function AccountTransactions({ accountId, categories }: { accountId: string, categories: Category[] }) {
  const firestore = useFirestore();
  const transactionsQuery = useMemo(() => {
    if (!firestore || !accountId) return null;
    return query(collection(firestore, `bankAccounts/${accountId}/transactions`));
  }, [firestore, accountId]);
  const { data: transactions, isLoading } = useCollection<Transaction>(transactionsQuery);

  const [filters, setFilters] = useState<FilterState>(initialFilterState);
  const [isEditTransactionOpen, setEditTransactionOpen] = useState(false);
  const [isDeleteTransactionAlertOpen, setDeleteTransactionAlertOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  const handleFilterChange = (key: keyof FilterState, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const clearFilters = () => {
    setFilters(initialFilterState);
  };

  const filteredTransactions = useMemo(() => {
    return (transactions || [])
      .filter(t => t.description.toLowerCase().includes(filters.searchTerm.toLowerCase()))
      .filter(t => filters.type === 'todos' ? true : t.type === filters.type)
      .filter(t => {
        const { dateRange } = filters;
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
  }, [transactions, filters]);

  const handleEditTransactionClick = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setEditTransactionOpen(true);
  };

  const handleEditTransaction = (editedTransactionData: Partial<Transaction>) => {
    if (!selectedTransaction) return;
    updateTransaction(firestore, accountId, selectedTransaction.id, editedTransactionData);
    setEditTransactionOpen(false);
  };

  const handleDeleteTransactionClick = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setDeleteTransactionAlertOpen(true);
  };

  const handleDeleteTransaction = () => {
    if (!selectedTransaction) return;
    deleteTransaction(firestore, accountId, selectedTransaction.id, selectedTransaction.amount, selectedTransaction.type);
    setDeleteTransactionAlertOpen(false);
  };

  return (
    <div className="p-4 bg-muted/50 rounded-md">
      <div className="flex justify-between items-center mb-4">
        <h4 className="font-bold">Transações Recentes</h4>
        <div className="flex items-center gap-2">
          <Input
            placeholder="Buscar por descrição..."
            className="max-w-xs"
            value={filters.searchTerm}
            onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
          />
          <Select
            value={filters.type}
            onValueChange={(value) => handleFilterChange('type', value)}
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
            date={filters.dateRange}
            onDateChange={(date) => handleFilterChange('dateRange', date)}
          />
          <Button variant="ghost" onClick={clearFilters}>
            <X className="mr-2 h-4 w-4" /> Limpar
          </Button>
        </div>
      </div>
      {isLoading ? (
        <Skeleton className="h-40 w-full" />
      ) : filteredTransactions.length > 0 ? (
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
            {filteredTransactions.map((tx: Transaction) => (
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
                  {tx.amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
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

      <EditTransactionDialog
        isOpen={isEditTransactionOpen}
        onOpenChange={setEditTransactionOpen}
        onSubmit={handleEditTransaction}
        transaction={selectedTransaction}
        categories={categories}
      />

      <AlertDialog open={isDeleteTransactionAlertOpen} onOpenChange={setDeleteTransactionAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso irá excluir permanentemente a transação e o saldo da conta será ajustado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTransaction}>Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default function BancoPage() {
  const firestore = useFirestore();
  const { data: bankAccounts, isLoading: isLoadingAccounts } = useCollection<BankAccount>(query(collection(firestore, "bankAccounts")));
  const { data: categories, isLoading: isLoadingCategories } = useCollection<Category>(query(collection(firestore, "categories")));
  const isLoading = isLoadingAccounts || isLoadingCategories;

  const totalBalance = useMemo(() => {
    return (bankAccounts || []).reduce((acc, account) => acc + account.saldo, 0);
  }, [bankAccounts]);


  const [isAddAccountOpen, setAddAccountOpen] = useState(false);
  const [isEditAccountOpen, setEditAccountOpen] = useState(false);
  const [isTransactionOpen, setTransactionOpen] = useState(false);
  const [isManageCategoriesOpen, setManageCategoriesOpen] = useState(false);


  const [transactionType, setTransactionType] = useState<"receita" | "despesa">("receita");
  const [selectedAccount, setSelectedAccount] = useState<BankAccount | null>(null);
  const [expandedRows, setExpandedRows] = useState<string[]>([]);

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
    addBankAccount(firestore, newAccountData);
    setAddAccountOpen(false);
  }

  const handleEditAccount = (editedAccountData: Partial<BankAccount>) => {
    if (!selectedAccount) return;
    updateBankAccount(firestore, selectedAccount.id, editedAccountData);
    setEditAccountOpen(false);
  }
  
  const handleDeleteAccount = (accountId: string) => {
    deleteBankAccount(firestore, accountId);
  }

  const handleNewTransaction = (transactionData: Omit<Transaction, 'id' | 'accountId' | 'type' | 'date'>) => {
    if (!selectedAccount) return;
    addTransaction(firestore, selectedAccount.id, transactionData, transactionType);
    setTransactionOpen(false);
  }

  const handleAddCategory = (category: Omit<Category, 'id'>) => {
    addCategory(firestore, category);
  }
  const handleDeleteCategory = (categoryId: string) => {
    deleteCategory(firestore, categoryId);
  }

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

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Saldo Total em Contas
            </CardTitle>
            <CreditCard className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-3/4" /> :
            <div className="text-2xl font-bold font-headline text-primary">
              {totalBalance.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </div>
            }
            <p className="text-xs text-muted-foreground">Soma dos saldos bancários disponíveis</p>
          </CardContent>
        </Card>

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
              {isLoading && Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell className="w-12"><Skeleton className="h-8 w-8 rounded" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell className="text-right"><div className="flex justify-end gap-2"><Skeleton className="h-8 w-8" /><Skeleton className="h-8 w-8" /></div></TableCell>
                </TableRow>
              ))}
              {!isLoading && (bankAccounts || []).length === 0 && (
                <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">Nenhuma conta cadastrada.</TableCell>
                </TableRow>
              )}
              {!isLoading && (bankAccounts || []).map((account: BankAccount) => {
                const isExpanded = expandedRows.includes(account.id);
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
                        {account.saldo.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-green-500 hover:text-green-600" onClick={() => handleTransaction(account, 'receita')}>
                            <ArrowUpCircle className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600" onClick={() => handleTransaction(account, 'despesa')}>
                            <ArrowDownCircle className="h-4 w-4" />
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
                          <AccountTransactions accountId={account.id} categories={categories || []} />
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                )
              })}
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
      
      <ManageCategoriesDialog
        isOpen={isManageCategoriesOpen}
        onOpenChange={setManageCategoriesOpen}
        categories={categories || []}
        onAddCategory={handleAddCategory}
        onDeleteCategory={handleDeleteCategory}
      />
    </>
  )
}

    