
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
  getCountFromServer,
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
    const snapshot = await getCountFromServer(loansCollection);
    const count = snapshot.data().count;
    const nextId = (count + 1).toString().padStart(3, '0');
    return `CS-${nextId}`;
}

export async function addLoan(firestore: Firestore, loanData: Omit<Loan, 'id' | 'installments' | 'loanCode'>) {
  const coll = collection(firestore, LOANS_COLLECTION);
  try {
    const loanCode = await generateLoanCode(firestore);
    const newLoanRef = doc(coll);
    const loanWithId = { ...loanData, id: newLoanRef.id, loanCode };
    const installments = generateInstallments(loanWithId);

    const newLoan: Loan = {
      ...loanWithId,
      installments,
    };
    
    // Using setDoc with the generated ref ensures the ID is what we expect
    await runTransaction(firestore, async (transaction) => {
        transaction.set(newLoanRef, newLoan);
    });

    // Update customer status after successful loan creation
    await updateCustomerLoanStatus(firestore, loanData.customerId);

  } catch (serverError) {
    const permissionError = new FirestorePermissionError({
      path: coll.path,
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
            const updatedLoanDetails = { ...existingLoan, ...loanData, id: existingLoan.id, loanCode: existingLoan.loanCode };
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
    
    try {
        const querySnapshot = await getDocs(customerLoansQuery);
        const customerLoans = querySnapshot.docs.map(doc => doc.data() as Loan);

        let newStatus: 'Ativo' | 'Pago' | 'Inadimplente' = 'Pago';

        if (customerLoans.length > 0) {
            const hasOverdueLoans = customerLoans.some(loan => loan.status === 'Atrasado');
            const hasActiveLoans = customerLoans.some(loan => loan.status === 'Em dia');

            if (hasOverdueLoans) {
                newStatus = 'Inadimplente';
            } else if (hasActiveLoans) {
                newStatus = 'Ativo';
            } else {
                newStatus = 'Pago';
            }
        } else {
             // If a customer has no loans, they are considered 'Active' but without debt.
             // Or we can use a different status. For now, 'Ativo' seems fine.
             // If we set to 'Pago', it might be confusing.
             // Let's reset to 'Ativo' as they are an active customer without pending loans.
            newStatus = 'Ativo'; 
        }

        const customerRef = doc(firestore, CUSTOMERS_COLLECTION, customerId);
        await updateDoc(customerRef, { loanStatus: newStatus });
    } catch(e) {
        console.error("Could not update customer loan status", e);
        // Not throwing permission error here as it's a background process
    }
}
