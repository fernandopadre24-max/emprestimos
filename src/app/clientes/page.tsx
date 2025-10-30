
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { Customer } from "@/lib/types"
import { format, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import { FilePenLine, Plus, Trash2 } from "lucide-react"
import { AddCustomerDialog } from "@/components/clientes/add-customer-dialog"
import { EditCustomerDialog } from "@/components/clientes/edit-customer-dialog"
import { customers as initialCustomers } from "@/lib/data"

export default function ClientesPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isAddDialogOpen, setAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  useEffect(() => {
    const storedCustomers = localStorage.getItem("customers");
    if (storedCustomers) {
      setCustomers(JSON.parse(storedCustomers));
    } else {
      setCustomers(initialCustomers);
      localStorage.setItem("customers", JSON.stringify(initialCustomers));
    }
  }, []);

  const updateAndStoreCustomers = (newCustomers: Customer[]) => {
    setCustomers(newCustomers);
    localStorage.setItem("customers", JSON.stringify(newCustomers));
  }

  const handleAddCustomer = (newCustomerData: Omit<Customer, 'id' | 'registrationDate' | 'loanStatus'>) => {
    const newCustomer: Customer = {
      id: (Math.random() + 1).toString(36).substring(7),
      registrationDate: new Date().toISOString(),
      loanStatus: 'Ativo',
      ...newCustomerData
    };
    updateAndStoreCustomers([...customers, newCustomer]);
    setAddDialogOpen(false);
  }

  const handleEditCustomerClick = (customer: Customer) => {
    setSelectedCustomer(customer);
    setEditDialogOpen(true);
  }
  
  const handleEditCustomer = (editedCustomerData: Partial<Customer>) => {
    if (!selectedCustomer) return;
    const updatedCustomers = customers.map(customer => 
      customer.id === selectedCustomer.id ? { ...customer, ...editedCustomerData } : customer
    );
    updateAndStoreCustomers(updatedCustomers);
    setEditDialogOpen(false);
  }

  const handleDeleteCustomer = (customerId: string) => {
    const updatedCustomers = customers.filter(customer => customer.id !== customerId);
    updateAndStoreCustomers(updatedCustomers);
  }


  return (
    <>
      <Card>
        <CardHeader className="flex flex-row justify-between items-start">
          <div>
            <CardTitle className="font-headline">Lista de Clientes</CardTitle>
            <CardDescription>Gerencie seus clientes e seus empréstimos.</CardDescription>
          </div>
          <Button onClick={() => setAddDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Adicionar Cliente
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead className="hidden sm:table-cell">Email</TableHead>
                <TableHead className="hidden sm:table-cell">CPF</TableHead>
                <TableHead className="hidden md:table-cell">Data de Cadastro</TableHead>
                <TableHead>Status do Empréstimo</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.map((customer: Customer) => {
                const date = parseISO(customer.registrationDate);
                return (
                <TableRow key={customer.id}>
                  <TableCell className="font-medium">{customer.name}</TableCell>
                  <TableCell className="hidden sm:table-cell">{customer.email}</TableCell>
                  <TableCell className="hidden sm:table-cell">{customer.cpf}</TableCell>
                  <TableCell className="hidden md:table-cell">{format(date, "dd/MM/yyyy", { locale: ptBR })}</TableCell>
                  <TableCell>
                    <Badge variant={customer.loanStatus === 'Ativo' ? 'secondary' : customer.loanStatus === 'Inadimplente' ? 'destructive' : 'default'} className={customer.loanStatus === 'Pago' ? "bg-accent text-accent-foreground" : ""}>
                      {customer.loanStatus}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditCustomerClick(customer)}>
                          <FilePenLine className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600" onClick={() => handleDeleteCustomer(customer.id)}>
                          <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )})}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <AddCustomerDialog 
        isOpen={isAddDialogOpen}
        onOpenChange={setAddDialogOpen}
        onSubmit={handleAddCustomer}
      />
      <EditCustomerDialog
        isOpen={isEditDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSubmit={handleEditCustomer}
        customer={selectedCustomer}
      />
    </>
  )
}
