
"use client"

import React, { useState, useMemo } from "react"
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
import { format, parseISO, differenceInDays } from "date-fns"
import { ptBR } from "date-fns/locale"
import type { Loan, Customer, Installment, BankAccount } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { ChevronDown, FilePenLine, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { CreditPaymentDialog } from "@/components/emprestimos/credit-payment-dialog"
import { EditLoanDialog } from "@/components/emprestimos/edit-loan-dialog"
import { Switch } from "@/components/ui/switch"
import { Skeleton } from "@/components/ui/skeleton"
import { useCollection, useFirestore } from "@/firebase"
import { collection, query, runTransaction } from "firebase/firestore"
import { deleteLoan, updateLoan } from "@/lib/loans"
import { addTransaction, deleteTransactionsBySource } from "@/lib/transactions"
import { useToast } from "@/hooks/use-toast"


export default function EmprestimosPage() {
  const firestore = useFirestore();
  const { toast } = useToast();

  const { data: loans, isLoading: isLoadingLoans } = useCollection<Loan>(query(collection(firestore, "loans")));
  const { data: customers, isLoading: isLoadingCustomers } = useCollection<Customer>(query(collection(firestore, "customers")));
  const { data: bankAccounts, isLoading: isLoadingAccounts } = useCollection<BankAccount>(query(collection(firestore, "bankAccounts")));

  const isLoading = isLoadingLoans || isLoadingCustomers || isLoadingAccounts;

  const [expandedCustomerIds, setExpandedCustomerIds] = useState<string[]>([]);
  const [expandedLoanIds, setExpandedLoanIds] = useState<string[]>([]);

  const [isCreditDialogOpen, setCreditDialogOpen] = useState(false);
  const [isEditDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [paymentDetails, setPaymentDetails] = useState<{loanId: string, installment: Installment & { lateFee?: number }} | null>(null);


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
            const dailyLateFeeRate = loan.lateFeeRate || 0;
            const lateFee = amountDue * dailyLateFeeRate * daysOverdue;
            return amountDue + lateFee;
        }
    }
    return amountDue;
  };
  

  const customersWithLoans = useMemo(() => {
    if (!loans || !customers) return [];
    
    const customerLoanMap = (loans || []).reduce((acc, loan) => {
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

    return Object.values(customerLoanMap).sort((a,b) => a.name.localeCompare(b.name));
  }, [loans, customers]);

  const handleDeleteLoan = async (loan: Loan) => {
    // Before deleting the loan, revert any disbursement transaction associated with it.
    await deleteTransactionsBySource(firestore, loan.id);
    deleteLoan(firestore, loan.id);
    toast({ title: "Empréstimo Excluído", description: `O empréstimo ${loan.loanCode} foi excluído.` });
  }

  const handleEditLoanClick = (loan: Loan) => {
    setSelectedLoan(loan);
    setEditDialogOpen(true);
  }

  const handleEditLoan = (editedLoanData: Partial<Loan>) => {
    if (!selectedLoan) return;
    updateLoan(firestore, selectedLoan.id, editedLoanData);
    setEditDialogOpen(false);
  };

  const handlePaymentToggle = (checked: boolean, loan: Loan, installment: Installment) => {
    if (checked) {
      const totalDue = calculateLateFee(installment, loan);
      const lateFee = totalDue - ((installment.originalAmount || installment.amount) - (installment.paidAmount || 0));
      const installmentWithFee = { ...installment, amount: totalDue, lateFee: lateFee > 0 ? lateFee : 0 };
      setPaymentDetails({ loanId: loan.id, installment: installmentWithFee });
      setCreditDialogOpen(true);
    } else {
      handleRevertPayment(loan, installment);
    }
  };
  
  const handleConfirmPayment = async (loanId: string, installmentId: string, accountId: string, amountPaid: number) => {
    await runTransaction(firestore, async (transaction) => {
        const loanRef = collection(firestore, 'loans');
        const loanDoc = (await getDocs(query(loanRef, where('id', '==', loanId)))).docs[0];
        if (!loanDoc) throw new Error("Loan not found");

        const currentLoan = loanDoc.data() as Loan;
        const newInstallments = currentLoan.installments.map(inst => {
            if (inst.id === installmentId) {
                const newPaidAmount = (inst.paidAmount || 0) + amountPaid;
                const originalAmount = inst.originalAmount || inst.amount;
                const isFullyPaid = newPaidAmount >= originalAmount;
                return { ...inst, paidAmount: newPaidAmount, status: isFullyPaid ? 'Paga' as const : 'Pendente' as const };
            }
            return inst;
        });

        const allInstallmentsPaid = newInstallments.every(inst => inst.status === 'Paga');
        const newLoanStatus = allInstallmentsPaid ? 'Pago' : currentLoan.status;
        
        transaction.update(loanDoc.ref, { installments: newInstallments, status: newLoanStatus });

         // Add transaction to bank account
        const customer = customers?.find(c => c.id === currentLoan.customerId);
        addTransaction(firestore, accountId, {
            description: `Pagamento Parcela ${newInstallments.find(i=>i.id===installmentId)?.installmentNumber} - ${customer?.name}`,
            amount: amountPaid,
            category: 'Receita Empréstimo',
            sourceId: installmentId,
        }, 'receita');
    });

    setCreditDialogOpen(false);
    toast({ title: "Pagamento Confirmado", description: "O pagamento da parcela foi registrado com sucesso.", className: "bg-accent text-accent-foreground" });
  };
  
  const handleRevertPayment = async (loan: Loan, installment: Installment) => {
     await runTransaction(firestore, async (transaction) => {
        const loanRef = collection(firestore, 'loans');
        const loanDoc = (await getDocs(query(loanRef, where('id', '==', loan.id)))).docs[0];
        if (!loanDoc) throw new Error("Loan not found");

        const newInstallments = loan.installments.map(inst => {
            if (inst.id === installment.id) {
            return { ...inst, status: 'Pendente' as const, paidAmount: 0 };
            }
            return inst;
        });
        
        const wasPaid = loan.status === 'Pago';
        const newLoanStatus = wasPaid ? 'Em dia' : loan.status;

        transaction.update(loanDoc.ref, { installments: newInstallments, status: newLoanStatus });
     });
    
    // Also revert the transaction from the bank account
    await deleteTransactionsBySource(firestore, installment.id);

    toast({ title: "Pagamento Revertido", description: "O pagamento da parcela foi revertido." });
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
             {isLoading && Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell className="w-12"><Skeleton className="h-8 w-8 rounded" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-4 w-8" /></TableCell>
                </TableRow>
              ))}
              {!isLoading && customersWithLoans.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">Nenhum empréstimo encontrado.</TableCell>
                </TableRow>
              )}
            {!isLoading && customersWithLoans.map(customer => {
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
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600" onClick={(e) => {e.stopPropagation(); handleDeleteLoan(loan)}}>
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

    