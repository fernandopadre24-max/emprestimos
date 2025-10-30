"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/componentsui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

import { generateFinancialReport } from "@/ai/flows/generate-financial-report";

const formSchema = z.object({
  dateRange: z.object({
    from: z.date({ required_error: "A data de início é obrigatória." }),
    to: z.date({ required_error: "A data de término é obrigatória." }),
  }),
  reportType: z.enum(["summary", "detailed"]),
});

export default function ReportForm() {
  const [report, setReport] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      reportType: "summary",
      dateRange: {
        from: new Date(2024, 0, 1),
        to: new Date(),
      }
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setReport(null);
    try {
      const result = await generateFinancialReport({
        startDate: format(values.dateRange.from, "yyyy-MM-dd"),
        endDate: format(values.dateRange.to, "yyyy-MM-dd"),
        reportType: values.reportType,
      });
      setReport(result.report);
    } catch (error) {
      console.error("Failed to generate report:", error);
      toast({
        variant: "destructive",
        title: "Erro ao Gerar Relatório",
        description: "Não foi possível gerar o relatório. Tente novamente mais tarde.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <FormField
            control={form.control}
            name="dateRange"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Período do Relatório</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !field.value.from && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {field.value?.from ? (
                          field.value.to ? (
                            <>
                              {format(field.value.from, "dd/MM/yyyy", { locale: ptBR })} -{" "}
                              {format(field.value.to, "dd/MM/yyyy", { locale: ptBR })}
                            </>
                          ) : (
                            format(field.value.from, "dd/MM/yyyy", { locale: ptBR })
                          )
                        ) : (
                          <span>Escolha um período</span>
                        )}
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      initialFocus
                      mode="range"
                      defaultMonth={field.value?.from}
                      selected={{ from: field.value.from, to: field.value.to }}
                      onSelect={(range) => field.onChange(range)}
                      numberOfMonths={2}
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="reportType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo de Relatório</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo de relatório" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="summary">Resumido</SelectItem>
                    <SelectItem value="detailed">Detalhado</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Gerar Relatório
          </Button>
        </form>
      </Form>

      <Card className="min-h-[300px]">
        <CardHeader>
          <CardTitle className="font-headline">Relatório Gerado</CardTitle>
          <CardDescription>O resultado da sua consulta aparecerá aqui.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="space-y-4">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          )}
          {report && (
            <pre className="whitespace-pre-wrap text-sm font-sans">{report}</pre>
          )}
          {!isLoading && !report && (
            <div className="flex items-center justify-center h-48 text-muted-foreground">
              <p>Aguardando geração do relatório...</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
