

export interface UserProfile {
  displayName?: string | null;
  photoURL?: string | null;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  cpf: string;
  address: string;
  postalCode: string;
  houseNumber: string;
  city: string;
  registrationDate: string;
  loanStatus: 'Ativo' | 'Pago' | 'Inadimplente';
}

export type NewCustomer = Omit<Customer, 'id' | 'registrationDate' | 'loanStatus'>;

export interface Installment {
  id: string;
  loanId: string;
  installmentNumber: number;
  amount: number;
  originalAmount: number;
  paidAmount: number;
  dueDate: string;
  status: 'Paga' | 'Pendente';
}

export interface Loan {
  id: string;
  loanCode: string;
  customerId: string;
  amount: number;
  interestRate: number;
  term: number; // in months
  lateFeeRate: number; // daily late fee percentage
  startDate: string;
  status: 'Em dia' | 'Atrasado' | 'Pago';
  installments: Installment[];
}

export interface ChartData {
  month: string;
  emprestimos: number;
}

export interface BankAccount {
    id: string;
    banco: string;
    agencia: string;
    conta: string;
    saldo: number;
}

export type NewBankAccount = Omit<BankAccount, 'id' | 'saldo'>;

export interface Transaction {
    id: string;
    accountId: string;
    description: string;
    amount: number;
    date: string;
    type: 'receita' | 'despesa';
    category?: string;
    sourceId?: string; // To link back to the source of the transaction, e.g., a specific loan installment
}

export interface Category {
  id: string;
  name: string;
  type: 'receita' | 'despesa';
}
    
