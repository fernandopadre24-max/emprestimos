
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
import type { Customer } from "@/lib/types"
import { format, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import { ChevronDown, FilePenLine, Plus, Trash2 } from "lucide-react"
import { AddCustomerDialog } from "@/components/clientes/add-customer-dialog"
import { EditCustomerDialog } from "@/components/clientes/edit-customer-dialog"
import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"
import { useFirestore } from "@/firebase"
import { collection, query, getDocs } from "firebase/firestore"
import { addCustomer, deleteCustomer, updateCustomer } from "@/lib/customers"

export default function ClientesPage() {
  const firestore = useFirestore();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (!firestore) return;
      setIsLoading(true);
      try {
        const customersQuery = query(collection(firestore, "customers"));
        const snapshot = await getDocs(customersQuery);
        const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as Customer[];
        setCustomers(data);
      } catch (error) {
        console.error("Error fetching customers:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [firestore]);


  const [isAddDialogOpen, setAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [expandedRows, setExpandedRows] = useState<string[]>([]);


  const handleAddCustomer = async (newCustomerData: Omit<Customer, 'id' | 'registrationDate' | 'loanStatus'>) => {
    const newCustomer: Omit<Customer, 'id'> = {
      ...newCustomerData,
      registrationDate: new Date().toISOString(),
      loanStatus: 'Ativo',
    };
    addCustomer(firestore, newCustomer);
    setAddDialogOpen(false);
  }

  const handleEditCustomerClick = (customer: Customer) => {
    setSelectedCustomer(customer);
    setEditDialogOpen(true);
  }
  
  const handleEditCustomer = async (editedCustomerData: Partial<Customer>) => {
    if (!selectedCustomer) return;
    updateCustomer(firestore, selectedCustomer.id, editedCustomerData);
    setEditDialogOpen(false);
  }

  const handleDeleteCustomer = (customerId: string) => {
    deleteCustomer(firestore, customerId);
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
              {isLoading && Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell className="w-12"><Skeleton className="h-8 w-8 rounded" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell className="hidden sm:table-cell"><Skeleton className="h-4 w-48" /></TableCell>
                  <TableCell className="hidden sm:table-cell"><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                  <TableCell className="text-right"><div className="flex justify-end gap-2"><Skeleton className="h-8 w-8" /><Skeleton className="h-8 w-8" /></div></TableCell>
                </TableRow>
              ))}
              {!isLoading && customers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">Nenhum cliente cadastrado.</TableCell>
                </TableRow>
              )}
              {!isLoading && customers.map((customer: Customer) => {
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
