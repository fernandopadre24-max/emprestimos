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
import { loans as initialLoans, customers as initialCustomers } from "@/lib/data"
import { format, parseISO, differenceInMonths } from "date-fns"
import { ptBR } from "date-fns/locale"
import type { Loan, Customer } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Check, ChevronDown, FilePenLine, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"

export default function EmprestimosPage() {
  const [loans, setLoans] = useState<Loan[]>(initialLoans.map(loan => {
    const startDate = parseISO(loan.startDate);
    const today = new Date();
    const monthsPassed = differenceInMonths(today, startDate);
    const remainingInstallments = Math.max(0, loan.term - monthsPassed);
    return { ...loan, remainingInstallments };
  }));

  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const [expandedCustomerIds, setExpandedCustomerIds] = useState<string[]>([]);

  const customersWithLoans = useMemo(() => {
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
    setLoans(currentLoans => currentLoans.filter(loan => loan.id !== loanId));
  }

  const handleEditLoan = (loan: Loan) => {
    console.log("Editing loan:", loan);
    // Placeholder for edit functionality
  }

  const handlePayInstallment = (loanId: string) => {
    setLoans(currentLoans =>
      currentLoans.map(loan => {
        if (loan.id === loanId && loan.remainingInstallments && loan.remainingInstallments > 0) {
          const newRemainingInstallments = loan.remainingInstallments - 1;
          return {
            ...loan,
            remainingInstallments: newRemainingInstallments,
            status: newRemainingInstallments === 0 ? 'Pago' : loan.status,
          };
        }
        return loan;
      })
    );
  };


  const toggleCustomer = (customerId: string) => {
    setExpandedCustomerIds(current =>
      current.includes(customerId)
        ? current.filter(id => id !== customerId)
        : [...current, customerId]
    );
  }

  return (
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
              const isExpanded = expandedCustomerIds.includes(customer.id);
              return (
                <React.Fragment key={customer.id}>
                  <TableRow className="cursor-pointer" onClick={() => toggleCustomer(customer.id)}>
                    <TableCell>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <ChevronDown className={cn("h-4 w-4 transition-transform", isExpanded && "rotate-180")} />
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
                  {isExpanded && (
                    <TableRow>
                      <TableCell colSpan={5}>
                        <div className="p-4 bg-muted/50 rounded-md">
                          <h4 className="font-bold mb-2 text-primary">Empréstimos de {customer.name}</h4>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Valor</TableHead>
                                <TableHead>Prazo</TableHead>
                                <TableHead>Parcelas Restantes</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Data</TableHead>
                                <TableHead className="text-right">Ações</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {customer.loans.map(loan => (
                                <TableRow key={loan.id}>
                                  <TableCell>{loan.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</TableCell>
                                  <TableCell>{loan.term} meses</TableCell>
                                  <TableCell>{loan.remainingInstallments}</TableCell>
                                  <TableCell>
                                    <Badge variant={loan.status === 'Pago' ? 'default' : loan.status === 'Atrasado' ? 'destructive' : 'secondary'} className={loan.status === 'Pago' ? 'bg-accent text-accent-foreground' : ''}>
                                      {loan.status}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>{format(parseISO(loan.startDate), "dd/MM/yyyy", { locale: ptBR })}</TableCell>
                                  <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                      <Button variant="ghost" size="icon" className="h-8 w-8 text-green-600 hover:text-green-700" onClick={() => handlePayInstallment(loan.id)} disabled={loan.remainingInstallments === 0}>
                                        <Check className="h-4 w-4" />
                                      </Button>
                                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditLoan(loan)}>
                                        <FilePenLine className="h-4 w-4" />
                                      </Button>
                                      <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600" onClick={() => handleDeleteLoan(loan.id)}>
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
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
  )
}
