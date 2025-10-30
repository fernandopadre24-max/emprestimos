
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
import { loans as initialLoans, customers as initialCustomers, bankAccounts as initialBankAccounts } from "@/lib/data"
import { format, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"
import type { Loan, Customer, Installment, BankAccount, Transaction } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Check, ChevronDown, FilePenLine, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { CreditPaymentDialog } from "@/components/emprestimos/credit-payment-dialog"

export default function EmprestimosPage() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [expandedCustomerIds, setExpandedCustomerIds] = useState<string[]>([]);
  const [expandedLoanIds, setExpandedLoanIds] = useState<string[]>([]);

  const [isCreditDialogOpen, setCreditDialogOpen] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState<{loanId: string, installment: Installment} | null>(null);


  useEffect(() => {
    const storedCustomers = localStorage.getItem("customers");
    const storedLoans = localStorage.getItem("loans");
    const storedBankAccounts = localStorage.getItem("bankAccounts");

    const customersData = storedCustomers ? JSON.parse(storedCustomers) : initialCustomers;
    const loansData = storedLoans ? JSON.parse(storedLoans) : initialLoans;
    const bankAccountsData = storedBankAccounts ? JSON.parse(storedBankAccounts) : initialBankAccounts;


    setCustomers(customersData);
    setLoans(loansData);
    setBankAccounts(bankAccountsData);

    if (!storedCustomers) localStorage.setItem("customers", JSON.stringify(customersData));
    if (!storedLoans) localStorage.setItem("loans", JSON.stringify(loansData));
    if (!storedBankAccounts) localStorage.setItem("bankAccounts", JSON.stringify(bankAccountsData));
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
    const storedTransactions = localStorage.getItem("transactions") || "[]";
    const transactions = JSON.parse(storedTransactions);
    localStorage.setItem("transactions", JSON.stringify([...transactions, ...newTransactions]));
  }


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

  const handleEditLoan = (loan: Loan) => {
    console.log("Editing loan:", loan);
  }

  const handlePayInstallmentClick = (loanId: string, installment: Installment) => {
    setPaymentDetails({ loanId, installment });
    setCreditDialogOpen(true);
  };
  

  const handleConfirmPayment = (loanId: string, installmentId: string, accountId: string) => {
    const newLoans = loans.map(loan => {
      if (loan.id === loanId) {
        let paidInstallment: Installment | undefined;
        const newInstallments = loan.installments.map(installment => {
          if (installment.id === installmentId) {
            paidInstallment = { ...installment, status: 'Paga' as const };
            return paidInstallment;
          }
          return installment;
        });

        if (paidInstallment) {
          const newTransaction: Transaction = {
            id: `T${(Math.random() + 1).toString(36).substring(7)}`,
            accountId: accountId,
            description: `Pagamento Parcela ${paidInstallment.installmentNumber} - Empréstimo ${loan.id}`,
            amount: paidInstallment.amount,
            date: new Date().toISOString(),
            type: 'receita',
          };
          updateAndStoreTransactions([newTransaction]);

          const newBankAccounts = bankAccounts.map(acc => 
            acc.id === accountId ? {...acc, saldo: acc.saldo + paidInstallment!.amount} : acc
          );
          updateAndStoreBankAccounts(newBankAccounts);
        }

        const allPaid = newInstallments.every(inst => inst.status === 'Paga');
        
        return {
          ...loan,
          installments: newInstallments,
          status: allPaid ? 'Pago' : loan.status,
        };
      }
      return loan;
    });
    updateAndStoreLoans(newLoans);

    // Update customer loan status if all their loans are paid
    const customerId = newLoans.find(l => l.id === loanId)?.customerId;
    if(customerId) {
        const customerLoans = newLoans.filter(l => l.customerId === customerId);
        const allCustomerLoansPaid = customerLoans.every(l => l.status === 'Pago');
        if (allCustomerLoansPaid) {
            const newCustomers = customers.map(c => 
                c.id === customerId ? {...c, loanStatus: 'Pago'} : c
            );
            updateAndStoreCustomers(newCustomers);
        }
    }
    setCreditDialogOpen(false);
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
                                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => {e.stopPropagation(); handleEditLoan(loan)}}>
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
                                                        <TableHead>Valor</TableHead>
                                                        <TableHead>Status</TableHead>
                                                        <TableHead className="text-right">Ação</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {loan.installments.map(installment => (
                                                        <TableRow key={installment.id}>
                                                            <TableCell>{installment.installmentNumber}</TableCell>
                                                            <TableCell>{installment.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</TableCell>
                                                            <TableCell>
                                                                <Badge variant={installment.status === 'Paga' ? 'secondary' : 'outline'} className={installment.status === 'Paga' ? 'bg-green-200 text-green-800' : ''}>
                                                                    {installment.status}
                                                                </Badge>
                                                            </TableCell>
                                                            <TableCell className="text-right">
                                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-green-600 hover:text-green-700" onClick={() => handlePayInstallmentClick(loan.id, installment)} disabled={installment.status === 'Paga'}>
                                                                    <Check className="h-4 w-4" />
                                                                </Button>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
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
    </>
  )
}

    