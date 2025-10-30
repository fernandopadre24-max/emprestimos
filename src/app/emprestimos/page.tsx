"use client"

import React, { useState } from "react"
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
import { loans as initialLoans, customers } from "@/lib/data"
import { format, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"
import type { Loan } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { FilePenLine, Trash2 } from "lucide-react"

export default function EmprestimosPage() {
  const [loans, setLoans] = useState<Loan[]>(initialLoans);

  const handleDeleteLoan = (loanId: string) => {
    setLoans(currentLoans => currentLoans.filter(loan => loan.id !== loanId));
  }

  // Placeholder for edit functionality
  const handleEditLoan = (loan: Loan) => {
    console.log("Editing loan:", loan);
    // Here you would typically open a dialog/modal for editing
  }


  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Todos os Empréstimos</CardTitle>
        <CardDescription>Visualize e gerencie todos os empréstimos concedidos.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cliente</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead className="hidden md:table-cell">Prazo</TableHead>
              <TableHead className="hidden md:table-cell">Taxa de Juros</TableHead>
              <TableHead className="hidden sm:table-cell">Data de Início</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loans.map(loan => {
              const customer = customers.find(c => c.id === loan.customerId);
              const date = parseISO(loan.startDate);
              return (
                <TableRow key={loan.id}>
                  <TableCell>
                    <div className="font-medium">{customer?.name}</div>
                    <div className="hidden text-sm text-muted-foreground md:inline">
                      {customer?.email}
                    </div>
                  </TableCell>
                  <TableCell>{loan.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</TableCell>
                  <TableCell className="hidden md:table-cell">{loan.term} meses</TableCell>
                  <TableCell className="hidden md:table-cell">{(loan.interestRate * 100).toFixed(2)}% a.m.</TableCell>
                  <TableCell className="hidden sm:table-cell">{format(date, "dd/MM/yyyy", { locale: ptBR })}</TableCell>
                  <TableCell>
                    <Badge variant={loan.status === 'Pago' ? 'default' : loan.status === 'Atrasado' ? 'destructive' : 'secondary'} className={loan.status === 'Pago' ? 'bg-accent text-accent-foreground' : ''}>
                      {loan.status}
                    </Badge>
                  </TableCell>
                   <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditLoan(loan)}>
                            <FilePenLine className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600" onClick={() => handleDeleteLoan(loan.id)}>
                            <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
