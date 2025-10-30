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
import { customers } from "@/lib/data"
import type { Customer } from "@/lib/types"

export default function ClientesPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Lista de Clientes</CardTitle>
        <CardDescription>Gerencie seus clientes e seus empréstimos.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead className="hidden sm:table-cell">Email</TableHead>
              <TableHead className="hidden sm:table-cell">CPF</TableHead>
              <TableHead className="hidden md:table-cell">Data de Cadastro</TableHead>
              <TableHead className="text-right">Status do Empréstimo</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers.map((customer: Customer) => (
              <TableRow key={customer.id}>
                <TableCell className="font-medium">{customer.name}</TableCell>
                <TableCell className="hidden sm:table-cell">{customer.email}</TableCell>
                <TableCell className="hidden sm:table-cell">{customer.cpf}</TableCell>
                <TableCell className="hidden md:table-cell">{new Date(customer.registrationDate).toLocaleDateString('pt-BR')}</TableCell>
                <TableCell className="text-right">
                  <Badge variant={customer.loanStatus === 'Ativo' ? 'secondary' : customer.loanStatus === 'Inadimplente' ? 'destructive' : 'default'} className={customer.loanStatus === 'Pago' ? "bg-accent text-accent-foreground" : ""}>
                    {customer.loanStatus}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
