
"use client";

import { useState, useEffect, useMemo } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import type { Customer, Loan, BankAccount } from "@/lib/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { useFirestore } from "@/firebase";
import { collection, query, getDocs } from "firebase/firestore";
import { addLoan } from "@/lib/loans";
import { addTransaction } from "@/lib/transactions";


const formSchema = z.object({
  customerId: z.string({ required_error: "Por favor, selecione um cliente." }),
  accountId: z.string({ required_error: "Por favor, selecione uma conta de débito." }),
  amount: z.coerce.number().min(1, "O valor deve ser maior que zero."),
  interestRate: z.coerce.number().min(0, "A taxa de juros não pode ser negativa."),
  term: z.coerce.number().int().min(1, "O prazo deve ser de pelo menos 1 mês."),
  startDate: z.date({ required_error: "A data de início é obrigatória." }),
  lateFeeRate: z.coerce.number().min(0, "A taxa de multa não pode ser negativa."),
});

interface Simulation {
  monthlyPayment: number;
  totalPayment: number;
  totalInterest: number;
}

export default function LoanForm() {
  const { toast } = useToast();
  const router = useRouter();
  const firestore = useFirestore();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (!firestore) return;
      setIsLoading(true);
      try {
        const customersQuery = query(collection(firestore, "customers"));
        const accountsQuery = query(collection(firestore, "bankAccounts"));
        const [customersSnapshot, accountsSnapshot] = await Promise.all([
          getDocs(customersQuery),
          getDocs(accountsQuery),
        ]);
        const customersData = customersSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as Customer[];
        const accountsData = accountsSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as BankAccount[];
        setCustomers(customersData);
        setBankAccounts(accountsData);
      } catch (error) {
        console.error("Error fetching form data:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [firestore]);

  const [simulation, setSimulation] = useState<Simulation | null>(null);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: 1000,
      interestRate: 5,
      term: 12,
      startDate: new Date(),
      lateFeeRate: 3,
    },
  });
  
  const selectedAccountId = form.watch("accountId");
  const availableBalance = useMemo(() => {
    if (!selectedAccountId || !bankAccounts) return 0;
    const selectedAccount = bankAccounts.find(acc => acc.id === selectedAccountId);
    return selectedAccount?.saldo || 0;
  }, [bankAccounts, selectedAccountId]);


  function calculateLoan() {
    const values = form.getValues();
    const principal = values.amount;
    const monthlyRate = values.interestRate / 100;
    const numberOfMonths = values.term;

    if (principal > 0 && monthlyRate >= 0 && numberOfMonths > 0) {
      const monthlyPayment = (principal * monthlyRate * Math.pow(1 + monthlyRate, numberOfMonths)) / (Math.pow(1 + monthlyRate, numberOfMonths) - 1);
      const totalPayment = monthlyPayment * numberOfMonths;
      const totalInterest = totalPayment - principal;

      if(isFinite(monthlyPayment)){
        setSimulation({
          monthlyPayment,
          totalPayment,
          totalInterest,
        });
      } else {
        setSimulation(null)
      }
    }
  }


  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (values.amount > availableBalance) {
        toast({
            variant: "destructive",
            title: "Saldo Insuficiente",
            description: `O valor do empréstimo (R$ ${values.amount.toFixed(2)}) excede o saldo disponível na conta selecionada (R$ ${availableBalance.toFixed(2)}).`,
        });
        return;
    }

    const customer = customers.find(c => c.id === values.customerId);
    
    if (!customer) {
        toast({
          variant: "destructive",
          title: "Erro ao criar empréstimo",
          description: "Cliente selecionado não foi encontrado.",
        });
        return;
    }
    
    const loanData: Omit<Loan, 'id' | 'installments' | 'loanCode'> = {
        customerId: values.customerId,
        amount: values.amount,
        interestRate: values.interestRate / 100, // Store as decimal
        term: values.term,
        startDate: values.startDate.toISOString(),
        status: 'Em dia',
        lateFeeRate: values.lateFeeRate / 100, // Store as decimal
    };

    try {
        const loanId = await addLoan(firestore, loanData);

        // Add a transaction for the loan disbursement
        addTransaction(firestore, values.accountId, {
            description: `Desembolso Empréstimo para ${customer.name}`,
            amount: values.amount,
            category: 'Despesa Empréstimo',
            sourceId: loanId, // Link transaction to the loan
        }, 'despesa');


        toast({
        title: "Solicitação Enviada!",
        description: "Sua solicitação de empréstimo foi enviada com sucesso.",
        className: "bg-accent text-accent-foreground"
        });
        
        form.reset();
        setSimulation(null);

        router.push("/emprestimos");

    } catch (error) {
        console.error("Failed to create loan:", error);
        toast({
            variant: "destructive",
            title: "Erro ao criar empréstimo",
            description: "Ocorreu um erro ao salvar o empréstimo. Tente novamente.",
        });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid md:grid-cols-2 gap-8">
        {isLoading ? (
            <div className="space-y-6">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-8 w-48 pt-4" />
                <Skeleton className="h-10 w-full" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                </div>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                </div>
                 <div className="flex flex-col sm:flex-row gap-4 pt-4">
                    <Skeleton className="h-10 w-36" />
                    <Skeleton className="h-10 w-40" />
                </div>
            </div>
        ) : (
        <div className="space-y-6">
          <h3 className="text-lg font-medium font-headline">Informações do Cliente e Conta</h3>
            <FormField
              control={form.control}
              name="customerId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cliente</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um cliente" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {customers.map(customer => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.name} ({customer.cpf})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="accountId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Conta para Débito</FormLabel>
                   <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma conta" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {bankAccounts.map(account => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.banco} ({account.conta}) - Saldo: {account.saldo.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                   <FormDescription>
                    O valor do empréstimo será debitado desta conta.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />


          <h3 className="text-lg font-medium font-headline pt-4">Detalhes do Empréstimo</h3>
           <FormField
              control={form.control}
              name="startDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Data de Início do Empréstimo</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "dd/MM/yyyy", { locale: ptBR })
                          ) : (
                            <span>Escolha uma data</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                        locale={ptBR}
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor (R$)</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="term"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prazo (meses)</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
             <FormField
              control={form.control}
              name="interestRate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Juros (% a.m.)</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="lateFeeRate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Multa por Atraso (% a.d.)</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
           <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Button type="button" variant="outline" onClick={calculateLoan} className="w-full sm:w-auto">
              Simular Empréstimo
            </Button>
            <Button type="submit" className="w-full sm:w-auto">Solicitar Empréstimo</Button>
          </div>
        </div>
        )}

        <Card className="bg-muted/30">
          <CardHeader>
            <CardTitle className="font-headline">Simulação</CardTitle>
            <CardDescription>
              Veja uma estimativa de como seu empréstimo ficará.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {simulation ? (
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Valor da Parcela Mensal</p>
                  <p className="text-2xl font-bold text-primary font-headline">
                    {simulation.monthlyPayment.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </p>
                </div>
                <Separator />
                <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Valor Total Pago</p>
                      <p className="text-lg font-semibold">
                        {simulation.totalPayment.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </p>
                    </div>
                     <div>
                      <p className="text-sm text-muted-foreground">Total de Juros</p>
                      <p className="text-lg font-semibold">
                        {simulation.totalInterest.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </p>
                    </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-48 text-muted-foreground">
                <p>Clique em "Simular Empréstimo" para ver os detalhes.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </form>
    </Form>
  );
}
