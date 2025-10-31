
"use client";

import { useState, useEffect } from "react";
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
import { generateInstallments } from "@/lib/data";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { useUser } from "@/firebase/auth/use-user"
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase"
import { collection, addDoc, doc, updateDoc, deleteDoc, getDocs } from "firebase/firestore"
import { errorEmitter } from "@/firebase/error-emitter"
import { FirestorePermissionError } from "@/firebase/errors"


const formSchema = z.object({
  customerId: z.string({ required_error: "Por favor, selecione um cliente." }),
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
  const { user } = useUser();
  const firestore = useFirestore();

  const customersQuery = useMemoFirebase(() => (firestore && user) ? collection(firestore, `users/${user.uid}/customers`) : null, [firestore, user]);
  const { data: customers } = useCollection<Customer>(customersQuery);

  const [simulation, setSimulation] = useState<Simulation | null>(null);
  const [availableBalance, setAvailableBalance] = useState<number>(0);

  useEffect(() => {
    if (!firestore || !user) return;
    const getBalance = async () => {
        const accountsCollection = collection(firestore, `users/${user.uid}/bankAccounts`);
        const accountsSnapshot = await getDocs(accountsCollection);
        const totalBalance = accountsSnapshot.docs.reduce((acc, doc) => acc + (doc.data() as BankAccount).saldo, 0);
        setAvailableBalance(totalBalance);
    };
    getBalance();
  }, [firestore, user]);

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
    if (!firestore || !user || !customers) return;

    if (values.amount > availableBalance) {
        toast({
            variant: "destructive",
            title: "Saldo Insuficiente",
            description: `O valor do empréstimo (R$ ${values.amount.toFixed(2)}) excede o saldo disponível em contas (R$ ${availableBalance.toFixed(2)}).`,
        });
        return;
    }


    const loansCollection = collection(firestore, `users/${user.uid}/loans`);
    const loansSnapshot = await getDocs(loansCollection);
    const nextLoanNumber = loansSnapshot.size + 1;
    const newLoanCode = `CS-${nextLoanNumber.toString().padStart(3, '0')}`;

    const customer = customers.find(c => c.id === values.customerId);
    
    if (!customer) {
        toast({
          variant: "destructive",
          title: "Erro ao criar empréstimo",
          description: "Cliente selecionado não foi encontrado.",
        });
        return;
    }
    
    const newLoanRaw: Omit<Loan, 'id' | 'installments'> = {
        loanCode: newLoanCode,
        customerId: customer.id,
        amount: values.amount,
        interestRate: values.interestRate / 100, // Store as decimal
        term: values.term,
        lateFeeRate: values.lateFeeRate / 100, // Store as decimal
        startDate: values.startDate.toISOString(),
        status: 'Em dia',
    };
    
    const loanDocRef = doc(loansCollection);
    const newLoan: Loan = {
      ...newLoanRaw,
      id: loanDocRef.id,
      installments: generateInstallments({ ...newLoanRaw, id: loanDocRef.id })
    }

    addDoc(loansCollection, newLoan)
        .catch(err => errorEmitter.emit('permission-error', new FirestorePermissionError({ path: loansCollection.path, operation: 'create', requestResourceData: newLoan })));


    toast({
      title: "Solicitação Enviada!",
      description: "Sua solicitação de empréstimo foi enviada com sucesso.",
      className: "bg-accent text-accent-foreground"
    });
    
    form.reset();
    setSimulation(null);

    router.push("/emprestimos");
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <h3 className="text-lg font-medium font-headline">Informações do Cliente</h3>
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
                      {(customers || []).map(customer => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.name} ({customer.cpf})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Selecione o cliente para o qual o empréstimo será concedido.
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
                        disabled={(date) =>
                          date > new Date() || date < new Date("1900-01-01")
                        }
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
