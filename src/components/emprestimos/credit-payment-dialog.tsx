
"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { BankAccount, Installment } from "@/lib/types";
import { useState, useEffect } from "react";

interface CreditPaymentDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSubmit: (loanId: string, installmentId: string, accountId: string, paidAmount: number, paymentType: string) => void;
  paymentDetails: { loanId: string; installment: Installment & { lateFee?: number } } | null;
  accounts: BankAccount[];
}

export function CreditPaymentDialog({
  isOpen,
  onOpenChange,
  onSubmit,
  paymentDetails,
  accounts,
}: CreditPaymentDialogProps) {
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [paymentType, setPaymentType] = useState<"total" | "partial" | "interest">("total");
  const [partialAmount, setPartialAmount] = useState<number>(0);

  useEffect(() => {
    if (accounts.length > 0 && !selectedAccountId) {
      setSelectedAccountId(accounts[0].id);
    }
    if (paymentDetails) {
        setPaymentType("total");
        setPartialAmount(0);
    }
  }, [accounts, selectedAccountId, paymentDetails]);

  const handleSubmit = () => {
    if (!paymentDetails || !selectedAccountId) return;
    
    let amountToPay = 0;
    if (paymentType === 'total') {
        amountToPay = paymentDetails.installment.amount;
    } else if (paymentType === 'partial') {
        amountToPay = partialAmount;
    } else if (paymentType === 'interest') {
        amountToPay = paymentDetails.installment.lateFee || 0;
    }

    if (amountToPay <= 0) return; // Prevent paying zero or negative

    onSubmit(
      paymentDetails.loanId,
      paymentDetails.installment.id,
      selectedAccountId,
      amountToPay,
      paymentType
    );
  };

  const totalAmountDue = paymentDetails?.installment.amount || 0;
  const lateFee = paymentDetails?.installment.lateFee || 0;
  
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar Pagamento de Parcela</DialogTitle>
          <DialogDescription>
            Selecione a forma de pagamento e a conta para creditar o valor.
            <br/>
            Valor total devido: <span className="font-bold text-foreground">{totalAmountDue.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span>
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="payment-type" className="text-right">
              Opção
            </Label>
            <RadioGroup 
                defaultValue="total" 
                className="col-span-3 grid grid-cols-1 gap-4"
                value={paymentType}
                onValueChange={(value: "total" | "partial" | "interest") => setPaymentType(value)}
            >
                <div className="flex items-center space-x-2">
                    <RadioGroupItem value="total" id="total" />
                    <Label htmlFor="total">Pagar valor total ({totalAmountDue.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })})</Label>
                </div>
                {lateFee > 0 && (
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="interest" id="interest" />
                        <Label htmlFor="interest">Pagar apenas multa/juros ({lateFee.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })})</Label>
                    </div>
                )}
                <div className="flex items-center space-x-2">
                    <RadioGroupItem value="partial" id="partial" />
                    <Label htmlFor="partial">Pagar valor parcial</Label>
                </div>
            </RadioGroup>
          </div>

          {paymentType === "partial" && (
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="partial-amount" className="text-right">
                Valor
                </Label>
                <Input
                id="partial-amount"
                type="number"
                className="col-span-3"
                value={partialAmount}
                onChange={(e) => setPartialAmount(parseFloat(e.target.value))}
                />
            </div>
          )}

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="bank-account" className="text-right">
              Creditar
            </Label>
            <Select
              value={selectedAccountId}
              onValueChange={setSelectedAccountId}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Selecione uma conta" />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.banco} - ({account.conta})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            onClick={handleSubmit}
            disabled={!selectedAccountId}
          >
            Confirmar Pagamento
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

    