
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { BankAccount, Installment } from "@/lib/types";
import { useState, useEffect } from "react";

interface CreditPaymentDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSubmit: (loanId: string, installmentId: string, accountId: string, paidAmount: number) => void;
  paymentDetails: { loanId: string; installment: Installment } | null;
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

  useEffect(() => {
    if (accounts.length > 0 && !selectedAccountId) {
      setSelectedAccountId(accounts[0].id);
    }
  }, [accounts, selectedAccountId]);

  const handleSubmit = () => {
    if (!paymentDetails || !selectedAccountId) return;
    onSubmit(
      paymentDetails.loanId,
      paymentDetails.installment.id,
      selectedAccountId,
      paymentDetails.installment.amount // Pass the amount to be paid
    );
  };

  const installmentValue = paymentDetails?.installment.amount.toLocaleString(
    "pt-BR",
    { style: "currency", currency: "BRL" }
  );

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Creditar Pagamento da Parcela</DialogTitle>
          <DialogDescription>
            Selecione a conta bancária para creditar o valor de{" "}
            <span className="font-bold text-foreground">
              {installmentValue}
            </span>
            .
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="bank-account" className="text-right">
              Conta
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
