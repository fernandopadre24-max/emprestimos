
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
import { generateInstallments } from "@/lib/data"
import { format, parseISO, differenceInDays } from "date-fns"
import { ptBR } from "date-fns/locale"
import type { Loan, Customer, Installment, BankAccount, Transaction } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { ChevronDown, FilePenLine, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { CreditPaymentDialog } from "@/components/emprestimos/credit-payment-dialog"
import { EditLoanDialog } from "@/components/emprestimos/edit-loan-dialog"
import { Switch } from "@/components/ui/switch"
import { useUser } from "@/firebase/auth/use-user"
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase"
import { collection, doc, updateDoc, deleteDoc, runTransaction, addDoc } from "firebase/firestore"
import { errorEmitter } from "@/firebase/error-emitter"
import { FirestorePermissionError } from "@/firebase/errors"

export default function EmprestimosPage() {
  const { user } = useUser();
  const firestore = useFirestore();

  const loansQuery = useMemoFirebase(() => (firestore && user) ? collection(firestore, `users/${user.uid}/loans`) : null, [firestore, user]);
  const customersQuery = useMemoFirebase(() => (firestore && user) ? collection(firestore, `users/${user.uid}/customers`) : null, [firestore, user]);
  const bankAccountsQuery = useMemoFirebase(() => (firestore && user) ? collection(firestore, `users/${user.uid}/bankAccounts`) : null, [firestore, user]);
  const transactionsQuery = useMemoFirebase(() => (firestore && user) ? collection(firestore, `users/${user.uid}/transactions`) : null, [firestore, user]);
  
  const { data: loans, loading: loadingLoans } = useCollection<Loan>(loansQuery);
  const { data: customers, loading: loadingCustomers } = useCollection<Customer>(customersQuery);
  const { data: bankAccounts, loading: loadingBankAccounts } = useCollection<BankAccount>(bankAccountsQuery);
  const { data: transactions, loading: loadingTransactions } = useCollection<Transaction>(transactionsQuery);

  const [expandedCustomerIds, setExpandedCustomerIds] = useState<string[]>([]);
  const [expandedLoanIds, setExpandedLoanIds] = useState<string[]>([]);

  const [isCreditDialogOpen, setCreditDialogOpen] = useState(false);
  const [isEditDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [paymentDetails, setPaymentDetails] = useState<{loanId: string, installment: Installment} | null>(null);

  const loansWithData = useMemo(() => {
    return (loans || []).map((loan: Loan) => {
      const installments = (loan.installments && loan.installments.length > 0)
        ? loan.installments.map(i => ({ 
            ...i, 
            paidAmount: i.paidAmount || 0, 
            originalAmount: i.originalAmount || i.amount 
          }))
        : generateInstallments(loan).map(i => ({ ...i, paidAmount: 0, originalAmount: i.amount }));

      return { ...loan, installments };
    });
  }, [loans])


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
    if (!loansWithData || !customers) return [];
    
    const customerLoanMap = loansWithData.reduce((acc, loan) => {
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
  }, [loansWithData, customers]);

  const handleDeleteLoan = (loanId: string) => {
    if (!firestore || !user) return;
    const docRef = doc(firestore, `users/${user.uid}/loans`, loanId);
    deleteDoc(docRef)
        .catch(err => errorEmitter.emit('permission-error', new FirestorePermissionError({ path: docRef.path, operation: 'delete' })));
  }

  const handleEditLoanClick = (loan: Loan) => {
    setSelectedLoan(loan);
    setEditDialogOpen(true);
  }

  const handleEditLoan = (editedLoanData: Partial<Loan>) => {
    if (!selectedLoan || !firestore || !user) return;

    const docRef = doc(firestore, `users/${user.uid}/loans`, selectedLoan.id);
    const updatedLoanRaw = { ...selectedLoan, ...editedLoanData };
    const newInstallments = generateInstallments(updatedLoanRaw);
    const finalData = { ...editedLoanData, installments: newInstallments };
    
    updateDoc(docRef, finalData)
        .catch(err => errorEmitter.emit('permission-error', new FirestorePermissionError({ path: docRef.path, operation: 'update', requestResourceData: finalData })));

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
    if (!firestore || !user || !loans || !customers) return;
    
    const loan = loans.find(l => l.id === loanId);
    const customer = customers.find(c => c.id === loan?.customerId);
    if (!loan || !customer) return;

    const installment = loan.installments.find(i => i.id === installmentId);
    if (!installment) return;
    
    runTransaction(firestore, async (transaction) => {
        // Create Transaction
        const newTransactionData: Omit<Transaction, 'id'> = {
            accountId: accountId,
            description: `Pgto. Parc. ${installment.installmentNumber}/${loan.term} - ${loan.loanCode} - ${customer.name}`,
            amount: amountPaid,
            date: new Date().toISOString(),
            type: 'receita',
            sourceId: `loan:${loanId}-installment:${installmentId}`,
        };
        const newTransactionRef = doc(collection(firestore, `users/${user.uid}/transactions`));
        transaction.set(newTransactionRef, newTransactionData);

        // Update Bank Account
        const accountRef = doc(firestore, `users/${user.uid}/bankAccounts`, accountId);
        const accountDoc = await transaction.get(accountRef);
        if (!accountDoc.exists()) throw "Bank account not found";
        const newBalance = accountDoc.data().saldo + amountPaid;
        transaction.update(accountRef, { saldo: newBalance });

        // Update Loan Installment
        const loanRef = doc(firestore, `users/${user.uid}/loans`, loanId);
        const newInstallments = loan.installments.map(i => {
            if (i.id === installmentId) {
                const newPaidAmount = (i.paidAmount || 0) + amountPaid;
                const isFullyPaid = newPaidAmount >= i.originalAmount;
                return { ...i, paidAmount: newPaidAmount, status: isFullyPaid ? 'Paga' as const : 'Pendente' as const };
            }
            return i;
        });

        const allInstallmentsPaid = newInstallments.every(inst => inst.status === 'Paga');
        const newLoanStatus = allInstallmentsPaid ? 'Pago' : 'Em dia';
        transaction.update(loanRef, { installments: newInstallments, status: newLoanStatus });

        // Update customer status
        const customerRef = doc(firestore, `users/${user.uid}/customers`, customer.id);
        const allCustomerLoans = loans.filter(l => l.customerId === customer.id);
        if (allCustomerLoans.every(l => l.id === loanId ? newLoanStatus === 'Pago' : l.status === 'Pago')) {
            transaction.update(customerRef, { loanStatus: 'Pago' });
        } else {
            transaction.update(customerRef, { loanStatus: 'Ativo' });
        }
    }).catch(err => console.error("Payment failed", err));

    setCreditDialogOpen(false);
  };
  
  const handleRevertPayment = (loanId: string, installmentId: string) => {
    if (!firestore || !user || !transactions) return;

    runTransaction(firestore, async (transaction) => {
        const transactionToRevertQuery = (transactions || []).filter(t => t.sourceId === `loan:${loanId}-installment:${installmentId}`);
        
        for (const transToRevert of transactionToRevertQuery) {
            // Revert bank account balances
            const accountRef = doc(firestore, `users/${user.uid}/bankAccounts`, transToRevert.accountId);
            const accountDoc = await transaction.get(accountRef);
            if (!accountDoc.exists()) throw "Bank account not found";
            const newBalance = accountDoc.data().saldo - transToRevert.amount;
            transaction.update(accountRef, { saldo: newBalance });

            // Remove transaction
            const transactionRef = doc(firestore, `users/${user.uid}/transactions`, transToRevert.id);
            transaction.delete(transactionRef);
        }

        // Revert installment status and amount
        const loanRef = doc(firestore, `users/${user.uid}/loans`, loanId);
        const loanDoc = await transaction.get(loanRef);
        if (!loanDoc.exists()) throw "Loan not found";
        const loanData = loanDoc.data() as Loan;
        
        const newInstallments = loanData.installments.map(i => {
          if (i.id === installmentId) {
            return { ...i, status: 'Pendente' as const, paidAmount: 0 };
          }
          return i;
        });
        
        transaction.update(loanRef, { installments: newInstallments, status: 'Em dia' });
    }).catch(err => console.error("Revert payment failed", err));
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
                                                                {finalAmountDue > 0 ? finalAmountDue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : "-"}
                                                                {isOverdue && installment.status !== 'Paga' && <div className="text-xs text-red-500">Inclui multa por atraso</div>}
                                                            </TableCell>
                                                            <TableCell className="text-right">
                                                                <Switch
                                                                    checked={installment.status === 'Paga'}
                                                                    onCheckedChange={(checked) => handlePaymentToggle(checked, loan, installment)}
                                                                    aria-label={`Marcar parcela ${installment.installmentNumber} como paga`}
                                                                    disabled={finalAmountDue <= 0}
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
        accounts={bankAccounts || []}
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
