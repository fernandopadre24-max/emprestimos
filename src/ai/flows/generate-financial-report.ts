'use server';

/**
 * @fileOverview Generates a financial report summarizing loan distributions, payment tracking, and profitability metrics.
 *
 * - generateFinancialReport - A function that generates the financial report.
 * - GenerateFinancialReportInput - The input type for the generateFinancialReport function.
 * - GenerateFinancialReportOutput - The return type for the generateFinancialReport function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateFinancialReportInputSchema = z.object({
  startDate: z.string().describe('The start date for the report (YYYY-MM-DD).'),
  endDate: z.string().describe('The end date for the report (YYYY-MM-DD).'),
  reportType: z
    .enum(['summary', 'detailed'])
    .describe('The type of report to generate.'),
});
export type GenerateFinancialReportInput = z.infer<
  typeof GenerateFinancialReportInputSchema
>;

const GenerateFinancialReportOutputSchema = z.object({
  report: z.string().describe('The generated financial report.'),
});
export type GenerateFinancialReportOutput = z.infer<
  typeof GenerateFinancialReportOutputSchema
>;

export async function generateFinancialReport(
  input: GenerateFinancialReportInput
): Promise<GenerateFinancialReportOutput> {
  return generateFinancialReportFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateFinancialReportPrompt',
  input: {schema: GenerateFinancialReportInputSchema},
  output: {schema: GenerateFinancialReportOutputSchema},
  prompt: `Você é um especialista financeiro sênior, especializado em análise de portfólios de empréstimos. Prepare um relatório financeiro baseado nos seguintes critérios:

  Data de início: {{{startDate}}}
  Data de término: {{{endDate}}}
  Tipo de relatório: {{{reportType}}}

  Inclua os seguintes dados e métricas no relatório:

  - Distribuição de empréstimos: um resumo da quantidade total de empréstimos distribuídos durante o período especificado.
  - Rastreamento de pagamentos: um resumo dos pagamentos recebidos durante o período especificado.
  - Métricas de lucratividade: um cálculo da lucratividade geral do portfólio de empréstimos durante o período especificado.

  Formate o relatório de forma clara e concisa, usando títulos e marcadores para facilitar a leitura. Use português do Brasil para o relatório.
  `,
});

const generateFinancialReportFlow = ai.defineFlow(
  {
    name: 'generateFinancialReportFlow',
    inputSchema: GenerateFinancialReportInputSchema,
    outputSchema: GenerateFinancialReportOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
