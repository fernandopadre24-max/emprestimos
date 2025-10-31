

"use client"

import React, { useState, useMemo, useEffect } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { loans as initialLoans, customers as initialCustomers, bankAccounts as initialBankAccounts, transactions as initialTransactions, generateInstallments } from "@/lib/data"
import { format, parseISO, differenceInDays } from "date-fns"
import { ptBR } from "date-fns/locale"
import type { Loan, Customer, Installment, BankAccount, Transaction } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { ChevronDown, FilePenLine, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { CreditPaymentDialog } from "@/components/emprestimos/credit-payment-dialog"
import { EditLoanDialog } from "@/components/emprestimos/edit-loan-dialog"
import { Switch } from "@/components/ui/switch"

export default function EmprestimosPage() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const [expandedCustomerIds, setExpandedCustomerIds] = useState<string[]>([]);
  const [expandedLoanIds, setExpandedLoanIds] = useState<string[]>([]);

  const [isCreditDialogOpen, setCreditDialogOpen] = useState(false);
  const [isEditDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [paymentDetails, setPaymentDetails] = useState<{loanId: string, installment: Installment} | null>(null);


  useEffect(() => {
    const storedCustomers = localStorage.getItem("customers");
    const storedLoans = localStorage.getItem("loans");
    const storedBankAccounts = localStorage.getItem("bankAccounts");
    const storedTransactions = localStorage.getItem("transactions");

    const customersData = storedCustomers ? JSON.parse(storedCustomers) : initialCustomers;
    let loansData: Loan[] = storedLoans ? JSON.parse(storedLoans) : initialLoans;
    const bankAccountsData = storedBankAccounts ? JSON.parse(storedBankAccounts) : initialBankAccounts;
    const transactionsData = storedTransactions ? JSON.parse(storedTransactions) : [];


    // Ensure all loans have installments and installments have paidAmount
    loansData = loansData.map((loan: Loan) => {
      const installments = (loan.installments && loan.installments.length > 0)
        ? loan.installments.map(i => ({ 
            ...i, 
            paidAmount: i.paidAmount || 0, 
            originalAmount: i.originalAmount || i.amount 
          }))
        : generateInstallments(loan).map(i => ({ ...i, paidAmount: 0, originalAmount: i.amount }));

      return { ...loan, installments };
    });

    setCustomers(customersData);
    setLoans(loansData);
    setBankAccounts(bankAccountsData);
    setTransactions(transactionsData);

    if (!storedCustomers) localStorage.setItem("customers", JSON.stringify(customersData));
    if (!storedLoans) localStorage.setItem("loans", JSON.stringify(loansData));
    if (!storedBankAccounts) localStorage.setItem("bankAccounts", JSON.stringify(bankAccountsData));
    if (!storedTransactions) localStorage.setItem("transactions", JSON.stringify(transactionsData));
  }, []);

  const updateAndStoreLoans = (newLoans: Loan[]) => {
    setLoans(newLoans);
    localStorage.setItem("loans", JSON.stringify(newLoans));
  }
  
  const updateAndStoreCustomers = (newCustomers: Customer[]) => {
    setCustomers(newCustomers);
    localStorage.setItem("customers", JSON.stringify(newCustomers));
  }

  const updateAndStoreBankAccounts = (newAccounts: BankAccount[]) => {
    setBankAccounts(newAccounts);
    localStorage.setItem("bankAccounts", JSON.stringify(newAccounts));
  };
  
  const updateAndStoreTransactions = (newTransactions: Transaction[]) => {
    setTransactions(newTransactions);
    localStorage.setItem("transactions", JSON.stringify(newTransactions));
  }

  const calculateLateFee = (installment: Installment, loan: Loan): number => {
      const amountDue = (installment.originalAmount || installment.amount) - (installment.paidAmount || 0);
      if (installment.status === 'Paga' || amountDue <= 0) {
          return 0; 
      }
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const dueDate = parseISO(installment.dueDate);
  
      if (today > dueDate) {
          const daysOverdue = differenceInDays(today, dueDate);
          if (daysOverdue > 0) {
              const lateFeeRate = loan.lateFeeRate || 0;
              const lateFee = amountDue * lateFeeRate * daysOverdue;
              return amountDue + lateFee;
          }
      }
      return amountDue;
  };
  

  const customersWithLoans = useMemo(() => {
    if (!loans || !customers) return [];
    
    const customerLoanMap = loans.reduce((acc, loan) => {
      const customer = customers.find(c => c.id === loan.customerId);
      if (customer) {
        if (!acc[customer.id]) {
          acc[customer.id] = {
            ...customer,
            loans: []
          };
        }
        acc[customer.id].loans.push(loan);
      }
      return acc;
    }, {} as Record<string, Customer & { loans: Loan[] }>);

    return Object.values(customerLoanMap);
  }, [loans, customers]);

  const handleDeleteLoan = (loanId: string) => {
    const updatedLoans = loans.filter(loan => loan.id !== loanId);
    updateAndStoreLoans(updatedLoans);
  }

  const handleEditLoanClick = (loan: Loan) => {
    setSelectedLoan(loan);
    setEditDialogOpen(true);
  }

  const handleEditLoan = (editedLoanData: Partial<Loan>) => {
    if (!selectedLoan) return;

    const updatedLoans = loans.map(loan => {
      if (loan.id === selectedLoan.id) {
        const updatedLoanRaw = { ...loan, ...editedLoanData };
        // Recalculate installments if core data changed
        const newInstallments = generateInstallments(updatedLoanRaw);
        return { ...updatedLoanRaw, installments: newInstallments };
      }
      return loan;
    });

    updateAndStoreLoans(updatedLoans);
    setEditDialogOpen(false);
  };

  const handlePaymentToggle = (checked: boolean, loan: Loan, installment: Installment) => {
    if (checked) {
      // Open dialog to select account for payment
      const totalDue = calculateLateFee(installment, loan);
      const lateFee = totalDue - ((installment.originalAmount || installment.amount) - (installment.paidAmount || 0));
      const installmentWithFee = { ...installment, amount: totalDue, lateFee: lateFee > 0 ? lateFee : 0 };
      setPaymentDetails({ loanId: loan.id, installment: installmentWithFee });
      setCreditDialogOpen(true);
    } else {
      // Revert payment
      handleRevertPayment(loan.id, installment.id);
    }
  };
  
  const handleConfirmPayment = (loanId: string, installmentId: string, accountId: string, amountPaid: number, paymentType: string) => {
    const loan = loans.find(l => l.id === loanId);
    const customer = customers.find(c => c.id === loan?.customerId);
    if (!loan || !customer) return;

    const installment = loan.installments.find(i => i.id === installmentId);
    if (!installment) return;

    // Create Transaction
    const newTransaction: Transaction = {
        id: `T${(Math.random() + 1).toString(36).substring(7)}`,
        accountId: accountId,
        description: `Pgto. Parc. ${installment.installmentNumber}/${loan.term} - ${loan.loanCode} - ${customer.name}`,
        amount: amountPaid,
        date: new Date().toISOString(),
        type: 'receita',
        sourceId: `loan:${loanId}-installment:${installmentId}`,
    };
    updateAndStoreTransactions([...transactions, newTransaction]);
    
    // Update Bank Account
    const newBankAccounts = bankAccounts.map(acc => 
        acc.id === accountId ? {...acc, saldo: acc.saldo + amountPaid} : acc
    );
    updateAndStoreBankAccounts(newBankAccounts);

    // Update Loan Installment
    const newLoans = loans.map(l => {
        if (l.id === loanId) {
            const newInstallments = l.installments.map(i => {
                if (i.id === installmentId) {
                    const newPaidAmount = (i.paidAmount || 0) + amountPaid;
                    const originalAmount = i.originalAmount || i.amount;
                    const isFullyPaid = newPaidAmount >= originalAmount;

                    return { 
                        ...i, 
                        paidAmount: newPaidAmount,
                        status: isFullyPaid ? 'Paga' as const : 'Pendente' as const,
                    };
                }
                return i;
            });
            const allInstallmentsPaid = newInstallments.every(inst => inst.status === 'Paga');
            return { ...l, installments: newInstallments, status: allInstallmentsPaid ? 'Pago' : 'Em dia' };
        }
        return l;
    });
    updateAndStoreLoans(newLoans);

    // Update customer status
    const customerLoans = newLoans.filter(l => l.customerId === customer.id);
    if (customerLoans.every(l => l.status === 'Pago')) {
        updateAndStoreCustomers(customers.map(c => c.id === customer.id ? {...c, loanStatus: 'Pago'} : c));
    } else {
        updateAndStoreCustomers(customers.map(c => c.id === customer.id ? {...c, loanStatus: 'Ativo'} : c));
    }

    setCreditDialogOpen(false);
};

  
  const handleRevertPayment = (loanId: string, installmentId: string) => {
    // Find all transactions for this installment
    const transactionsToRevert = transactions.filter(t => t.sourceId === `loan:${loanId}-installment:${installmentId}`);
    
    if (transactionsToRevert.length > 0) {
      let totalRevertedAmount = 0;
      const accountReversions = new Map<string, number>();

      transactionsToRevert.forEach(t => {
        totalRevertedAmount += t.amount;
        accountReversions.set(t.accountId, (accountReversions.get(t.accountId) || 0) + t.amount);
      });

      // Revert bank account balances
      const newBankAccounts = bankAccounts.map(acc => {
        if (accountReversions.has(acc.id)) {
          return {...acc, saldo: acc.saldo - (accountReversions.get(acc.id) || 0)};
        }
        return acc;
      });
      updateAndStoreBankAccounts(newBankAccounts);

      // Remove transactions
      const transactionIdsToRevert = new Set(transactionsToRevert.map(t => t.id));
      const newTransactions = transactions.filter(t => !transactionIdsToRevert.has(t.id));
      updateAndStoreTransactions(newTransactions);
    }


    // Revert installment status and amount
    const newLoans = loans.map(l => {
      if (l.id === loanId) {
        const newInstallments = l.installments.map(i => {
          if (i.id === installmentId) {
            return { ...i, status: 'Pendente' as const, paidAmount: 0 };
          }
          return i;
        });
        
        return { ...l, installments: newInstallments, status: 'Em dia' }; // Reset loan status as well
      }
      return l;
    });
    updateAndStoreLoans(newLoans);
  };

  const toggleCustomer = (customerId: string) => {
    setExpandedCustomerIds(current =>
      current.includes(customerId)
        ? current.filter(id => id !== customerId)
        : [...current, customerId]
    );
  }

  const toggleLoan = (loanId: string) => {
    setExpandedLoanIds(current =>
      current.includes(loanId)
        ? current.filter(id => id !== loanId)
        : [...current, loanId]
    );
  }

  return (
    <>
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Todos os Empréstimos</CardTitle>
        <CardDescription>Visualize e gerencie todos os empréstimos concedidos, agrupados por cliente.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12"></TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>CPF</TableHead>
              <TableHead>Status Geral</TableHead>
              <TableHead className="text-right">Qtd. Empréstimos</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customersWithLoans.map(customer => {
              const isCustomerExpanded = expandedCustomerIds.includes(customer.id);
              return (
                <React.Fragment key={customer.id}>
                  <TableRow className="cursor-pointer" onClick={() => toggleCustomer(customer.id)}>
                    <TableCell>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <ChevronDown className={cn("h-4 w-4 transition-transform", isCustomerExpanded && "rotate-180")} />
                      </Button>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{customer.name}</div>
                      <div className="hidden text-sm text-muted-foreground md:inline">
                        {customer.email}
                      </div>
                    </TableCell>
                    <TableCell>{customer.cpf}</TableCell>
                    <TableCell>
                      <Badge variant={customer.loanStatus === 'Ativo' ? 'secondary' : customer.loanStatus === 'Inadimplente' ? 'destructive' : 'default'} className={customer.loanStatus === 'Pago' ? "bg-accent text-accent-foreground" : ""}>
                        {customer.loanStatus}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">{customer.loans.length}</TableCell>
                  </TableRow>
                  {isCustomerExpanded && (
                    <TableRow>
                      <TableCell colSpan={5}>
                        <div className="p-4 bg-muted/50 rounded-md">
                          <h4 className="font-bold mb-2 text-primary">Empréstimos de {customer.name}</h4>
                          {customer.loans.map(loan => {
                              const isLoanExpanded = expandedLoanIds.includes(loan.id);
                              const paidInstallments = loan.installments.filter(i => i.status === 'Paga').length;
                              const remainingInstallments = loan.term - paidInstallments;
                              return (
                                <React.Fragment key={loan.id}>
                                    <Table>
                                      <TableHeader>
                                         <TableRow>
                                            <TableHead className="w-12"></TableHead>
                                            <TableHead>Código</TableHead>
                                            <TableHead>Valor</TableHead>
                                            <TableHead>Prazo</TableHead>
                                            <TableHead>Parcelas Restantes</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Data</TableHead>
                                            <TableHead className="text-right">Ações</TableHead>
                                         </TableRow>
                                      </TableHeader>
                                      <TableBody>
                                        <TableRow onClick={() => toggleLoan(loan.id)} className="cursor-pointer">
                                            <TableCell>
                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                    <ChevronDown className={cn("h-4 w-4 transition-transform", isLoanExpanded && "rotate-180")} />
                                                </Button>
                                            </TableCell>
                                            <TableCell className="font-mono">{loan.loanCode}</TableCell>
                                            <TableCell>{loan.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</TableCell>
                                            <TableCell>{loan.term} meses</TableCell>
                                            <TableCell>{remainingInstallments}</TableCell>
                                            <TableCell>
                                                <Badge variant={loan.status === 'Pago' ? 'default' : loan.status === 'Atrasado' ? 'destructive' : 'secondary'} className={loan.status === 'Pago' ? 'bg-accent text-accent-foreground' : ''}>
                                                {loan.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>{format(parseISO(loan.startDate), "dd/MM/yyyy", { locale: ptBR })}</TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => {e.stopPropagation(); handleEditLoanClick(loan)}}>
                                                        <FilePenLine className="h-4 w-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600" onClick={(e) => {e.stopPropagation(); handleDeleteLoan(loan.id)}}>
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                      </TableBody>
                                    </Table>
                                    {isLoanExpanded && (
                                        <div className="p-4 bg-background rounded-md my-2">
                                            <h5 className="font-semibold mb-2">Parcelas</h5>
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>Nº</TableHead>
                                                        <TableHead>Vencimento</TableHead>
                                                        <TableHead>Status</TableHead>
                                                        <TableHead>Valor Devido</TableHead>
                                                        <TableHead className="text-right">Pagar</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {loan.installments.map(installment => {
                                                        if (!installment.dueDate) return null;
                                                        const today = new Date();
                                                        today.setHours(0,0,0,0);
                                                        const dueDate = parseISO(installment.dueDate);
                                                        const isOverdue = today > dueDate && installment.status === 'Pendente';
                                                        const finalAmountDue = calculateLateFee(installment, loan);
                                                        const displayStatus = installment.status === 'Pendente' && isOverdue ? 'Atrasada' : installment.status;

                                                        return (
                                                        <TableRow key={installment.id}>
                                                            <TableCell>{installment.installmentNumber}</TableCell>
                                                            <TableCell>{format(parseISO(installment.dueDate), "dd/MM/yyyy", { locale: ptBR })}</TableCell>
                                                            <TableCell>
                                                                <Badge variant={displayStatus === 'Paga' ? 'secondary' : displayStatus === 'Atrasada' ? 'destructive' : 'outline'} className={cn(displayStatus === 'Paga' && 'bg-green-200 text-green-800')}>
                                                                    {displayStatus}
                                                                </Badge>
                                                            </TableCell>
                                                            <TableCell>
                                                                {finalAmountDue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                                                {isOverdue && installment.status !== 'Paga' && <div className="text-xs text-red-500">Inclui multa por atraso</div>}
                                                            </TableCell>
                                                            <TableCell className="text-right">
                                                                <Switch
                                                                    checked={installment.status === 'Paga'}
                                                                    onCheckedChange={(checked) => handlePaymentToggle(checked, loan, installment)}
                                                                    aria-label={`Marcar parcela ${installment.installmentNumber} como paga`}
                                                                    disabled={installment.status === 'Paga'}
                                                                />
                                                            </TableCell>
                                                        </TableRow>
                                                    )})}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    )}
                                </React.Fragment>
                              )
                          })}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              )
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
      <CreditPaymentDialog 
        isOpen={isCreditDialogOpen}
        onOpenChange={setCreditDialogOpen}
        onSubmit={handleConfirmPayment}
        paymentDetails={paymentDetails}
        accounts={bankAccounts}
      />
      <EditLoanDialog
        isOpen={isEditDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSubmit={handleEditLoan}
        loan={selectedLoan}
      />
    </>
  )
}

    

    




    

    


