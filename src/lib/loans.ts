
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  runTransaction,
  Firestore,
  writeBatch,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import type { Loan } from './types';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { generateInstallments } from './data';

const LOANS_COLLECTION = 'loans';
const CUSTOMERS_COLLECTION = 'customers';

// Function to generate a unique loan code
async function generateLoanCode(firestore: Firestore): Promise<string> {
    const loansCollection = collection(firestore, LOANS_COLLECTION);
    const snapshot = await getDocs(loansCollection);
    const count = snapshot.size;
    const nextId = (count + 1).toString().padStart(3, '0');
    return `CS-${nextId}`;
}

export async function addLoan(firestore: Firestore, loanData: Omit<Loan, 'id' | 'installments' | 'loanCode'>) {
  try {
    const loanCode = await generateLoanCode(firestore);
    const newLoanRef = doc(collection(firestore, LOANS_COLLECTION));
    const installments = generateInstallments({ ...loanData, id: newLoanRef.id });

    const newLoan: Loan = {
      ...loanData,
      id: newLoanRef.id,
      loanCode,
      installments,
    };

    await addDoc(collection(firestore, LOANS_COLLECTION), newLoan);
    
    // Update customer status
    await updateCustomerLoanStatus(firestore, loanData.customerId);

  } catch (serverError) {
    const permissionError = new FirestorePermissionError({
      path: LOANS_COLLECTION,
      operation: 'create',
      requestResourceData: loanData,
    });
    errorEmitter.emit('permission-error', permissionError);
  }
}


export function updateLoan(
  firestore: Firestore,
  id: string,
  loanData: Partial<Omit<Loan, 'id'>>
) {
    const docRef = doc(firestore, LOANS_COLLECTION, id);
    
    let dataToUpdate = { ...loanData };

    // If financial details change, regenerate installments
    if (loanData.amount || loanData.interestRate || loanData.term || loanData.startDate) {
        runTransaction(firestore, async (transaction) => {
            const loanDoc = await transaction.get(docRef);
            if (!loanDoc.exists()) {
                throw "Loan does not exist!";
            }
            const existingLoan = loanDoc.data() as Loan;
            const updatedLoanDetails = { ...existingLoan, ...loanData };
            const newInstallments = generateInstallments(updatedLoanDetails);
            dataToUpdate.installments = newInstallments;
            transaction.update(docRef, dataToUpdate);
        }).catch(async (serverError) => {
            const permissionError = new FirestorePermissionError({
                path: docRef.path,
                operation: 'update',
                requestResourceData: dataToUpdate,
            });
            errorEmitter.emit('permission-error', permissionError);
        });
    } else {
         updateDoc(docRef, dataToUpdate).catch(async (serverError) => {
            const permissionError = new FirestorePermissionError({
            path: docRef.path,
            operation: 'update',
            requestResourceData: dataToUpdate,
            });
            errorEmitter.emit('permission-error', permissionError);
        });
    }
}

export function deleteLoan(firestore: Firestore, id: string) {
  const docRef = doc(firestore, LOANS_COLLECTION, id);
  deleteDoc(docRef).catch(async (serverError) => {
    const permissionError = new FirestorePermissionError({
      path: docRef.path,
      operation: 'delete',
    });
    errorEmitter.emit('permission-error', permissionError);
  });
}

export async function updateCustomerLoanStatus(firestore: Firestore, customerId: string) {
    const loansCollection = collection(firestore, LOANS_COLLECTION);
    const customerLoansQuery = query(loansCollection, where("customerId", "==", customerId));
    
    const querySnapshot = await getDocs(customerLoansQuery);
    const customerLoans = querySnapshot.docs.map(doc => doc.data() as Loan);

    let newStatus: 'Ativo' | 'Pago' | 'Inadimplente' = 'Pago';

    if (customerLoans.length > 0) {
        const hasActiveLoans = customerLoans.some(loan => loan.status !== 'Pago');
        const hasOverdueLoans = customerLoans.some(loan => loan.status === 'Atrasado');

        if (hasOverdueLoans) {
            newStatus = 'Inadimplente';
        } else if (hasActiveLoans) {
            newStatus = 'Ativo';
        } else {
            newStatus = 'Pago';
        }
    } else {
        // If no loans, could be considered 'Pago' or a new status like 'Sem empréstimos'
        // For now, we'll stick to the existing statuses. Let's assume no loans means they are clear.
        newStatus = 'Pago'; 
    }

    const customerRef = doc(firestore, CUSTOMERS_COLLECTION, customerId);
    await updateDoc(customerRef, { loanStatus: newStatus });
}

    