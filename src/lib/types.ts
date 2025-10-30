

export interface Customer {
  id: string;
  name: string;
  email: string;
  cpf: string;
  registrationDate: string;
  loanStatus: 'Ativo' | 'Pago' | 'Inadimplente';
}

export interface Loan {
  id: string;
  customerId: string;
  amount: number;
  interestRate: number;
  term: number; // in months
  startDate: string;
  status: 'Em dia' | 'Atrasado' | 'Pago';
}

export interface ChartData {
  month: string;
  emprestimos: number;
}

export interface BankData {
  totalBalance: number;
  totalWithdrawn: number;
  availableForLoans: number;
}

export interface BankSummary {
    receitas: number;
    despesas: number;
    balanco: number;
    saldoContas: number;
}

export interface BankAccount {
    id: string;
    banco: string;
    agencia: string;
    conta: string;
    saldo: number;
}

export interface Transaction {
    id: string;
    accountId: string;
    description: string;
    amount: number;
    date: string;
    type: 'receita' | 'despesa';
}
    
