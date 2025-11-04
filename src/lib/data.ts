import { Customer, Loan, ChartData, BankData, BankSummary, BankAccount, Transaction, Installment, Category } from '@/lib/types';
import { addMonths, formatISO } from 'date-fns';

// This file is now primarily for generating initial data structures or for utility functions.
// The mock data arrays have been removed as the app now connects to Firestore.

export const generateInstallments = (loan: Omit<Loan, 'installments' | 'id' | 'loanCode'> & {id?: string, loanCode?: string}): Installment[] => {
    const installments: Installment[] = [];
    const principal = loan.amount;
    const monthlyRate = loan.interestRate;
    const numberOfMonths = loan.term;
    const startDate = new Date(loan.startDate);
    const loanId = loan.id || `L${Date.now()}`;
    
    const monthlyPayment = monthlyRate > 0 
      ? (principal * monthlyRate * Math.pow(1 + monthlyRate, numberOfMonths)) / (Math.pow(1 + monthlyRate, numberOfMonths) - 1)
      : principal / numberOfMonths;
    
    for (let i = 1; i <= loan.term; i++) {
        const dueDate = addMonths(startDate, i);
        installments.push({
            id: `${loanId}-I${i}`,
            loanId: loanId,
            installmentNumber: i,
            amount: monthlyPayment,
            originalAmount: monthlyPayment,
            paidAmount: 0,
            dueDate: formatISO(dueDate),
            status: 'Pendente'
        });
    }
    return installments;
}
