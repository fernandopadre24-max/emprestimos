
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
import { ChevronDown, FilePenLine, Plus, Trash2 } from "lucide-react"
import { AddCustomerDialog } from "@/components/clientes/add-customer-dialog"
import { EditCustomerDialog } from "@/components/clientes/edit-customer-dialog"
import { customers as initialCustomers } from "@/lib/data"
import { cn } from "@/lib/utils"

export default function ClientesPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isAddDialogOpen, setAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [expandedRows, setExpandedRows] = useState<string[]>([]);

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

  const toggleRow = (id: string) => {
    setExpandedRows(current =>
      current.includes(id) ? current.filter(rowId => rowId !== id) : [...current, id]
    );
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
                <TableHead className="w-12"></TableHead>
                <TableHead>Nome</TableHead>
                <TableHead className="hidden sm:table-cell">Email</TableHead>
                <TableHead className="hidden sm:table-cell">Cidade</TableHead>
                <TableHead className="hidden md:table-cell">Data de Cadastro</TableHead>
                <TableHead>Status do Empréstimo</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.map((customer: Customer) => {
                const isExpanded = expandedRows.includes(customer.id);
                const date = parseISO(customer.registrationDate);
                return (
                <React.Fragment key={customer.id}>
                  <TableRow className="cursor-pointer" onClick={() => toggleRow(customer.id)}>
                    <TableCell>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                          <ChevronDown className={cn("h-4 w-4 transition-transform", isExpanded && "rotate-180")} />
                      </Button>
                    </TableCell>
                    <TableCell className="font-medium">{customer.name}</TableCell>
                    <TableCell className="hidden sm:table-cell">{customer.email}</TableCell>
                    <TableCell className="hidden sm:table-cell">{customer.city}</TableCell>
                    <TableCell className="hidden md:table-cell">{format(date, "dd/MM/yyyy", { locale: ptBR })}</TableCell>
                    <TableCell>
                      <Badge variant={customer.loanStatus === 'Ativo' ? 'secondary' : customer.loanStatus === 'Inadimplente' ? 'destructive' : 'default'} className={customer.loanStatus === 'Pago' ? "bg-accent text-accent-foreground" : ""}>
                        {customer.loanStatus}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); handleEditCustomerClick(customer)}}>
                            <FilePenLine className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600" onClick={(e) => { e.stopPropagation(); handleDeleteCustomer(customer.id)}}>
                            <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  {isExpanded && (
                     <TableRow>
                        <TableCell colSpan={7}>
                          <div className="p-4 bg-muted/50 rounded-md grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <h4 className="font-bold mb-2">Detalhes do Cliente</h4>
                                <p><span className="font-semibold">Nome:</span> {customer.name}</p>
                                <p><span className="font-semibold">Email:</span> {customer.email}</p>
                                <p><span className="font-semibold">CPF:</span> {customer.cpf}</p>
                                <p><span className="font-semibold">Data Cadastro:</span> {format(date, "dd/MM/yyyy", { locale: ptBR })}</p>
                            </div>
                            <div>
                                <h4 className="font-bold mb-2">Endereço</h4>
                                <p><span className="font-semibold">Logradouro:</span> {customer.address}, {customer.houseNumber}</p>
                                <p><span className="font-semibold">CEP:</span> {customer.postalCode}</p>
                                <p><span className="font-semibold">Cidade:</span> {customer.city}</p>
                            </div>
                          </div>
                        </TableCell>
                     </TableRow>
                  )}
                </React.Fragment>
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
