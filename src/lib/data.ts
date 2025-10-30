import { Customer, Loan, ChartData, BankData } from '@/lib/types';

export const customers: Customer[] = [
  { id: '1', name: 'João Silva', email: 'joao.silva@example.com', cpf: '123.456.789-01', registrationDate: '2023-01-15', loanStatus: 'Ativo' },
  { id: '2', name: 'Maria Oliveira', email: 'maria.o@example.com', cpf: '234.567.890-12', registrationDate: '2023-02-20', loanStatus: 'Pago' },
  { id: '3', name: 'Carlos Pereira', email: 'carlos.p@example.com', cpf: '345.678.901-23', registrationDate: '2023-03-10', loanStatus: 'Ativo' },
  { id: '4', name: 'Ana Costa', email: 'ana.costa@example.com', cpf: '456.789.012-34', registrationDate: '2023-04-05', loanStatus: 'Inadimplente' },
  { id: '5', name: 'Pedro Martins', email: 'pedro.m@example.com', cpf: '567.890.123-45', registrationDate: '2023-05-25', loanStatus: 'Ativo' },
];

export const loans: Loan[] = [
  { id: 'L1', customerId: '1', amount: 10000, interestRate: 0.05, term: 24, startDate: '2023-01-20', status: 'Em dia' },
  { id: 'L2', customerId: '2', amount: 5000, interestRate: 0.08, term: 12, startDate: '2023-02-25', status: 'Pago' },
  { id: 'L3', customerId: '3', amount: 15000, interestRate: 0.06, term: 36, startDate: '2023-03-15', status: 'Em dia' },
  { id: 'L4', customerId: '4', amount: 7500, interestRate: 0.1, term: 18, startDate: '2023-04-10', status: 'Atrasado' },
  { id: 'L5', customerId: '5', amount: 20000, interestRate: 0.04, term: 48, startDate: '2023-05-30', status: 'Em dia' },
  { id: 'L6', customerId: '1', amount: 2000, interestRate: 0.09, term: 6, startDate: '2024-06-10', status: 'Em dia' },
];

export const chartData: ChartData[] = [
    { month: "Janeiro", emprestimos: 186 },
    { month: "Fevereiro", emprestimos: 305 },
    { month: "Março", emprestimos: 237 },
    { month: "Abril", emprestimos: 173 },
    { month: "Maio", emprestimos: 209 },
    { month: "Junho", emprestimos: 250 },
];

export const bankData: BankData = {
  totalBalance: 500000,
  totalWithdrawn: 150000,
  availableForLoans: 350000,
};
