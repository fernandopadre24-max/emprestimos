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
