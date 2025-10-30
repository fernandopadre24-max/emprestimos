
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
import type { Loan } from "@/lib/types";
import { useState, useEffect } from "react";

interface EditLoanDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSubmit: (data: Partial<Loan>) => void;
  loan: Loan | null;
}

export function EditLoanDialog({
  isOpen,
  onOpenChange,
  onSubmit,
  loan,
}: EditLoanDialogProps) {
  const [amount, setAmount] = useState(0);
  const [interestRate, setInterestRate] = useState(0);
  const [term, setTerm] = useState(0);
  const [status, setStatus] = useState<"Em dia" | "Atrasado" | "Pago">("Em dia");

  useEffect(() => {
    if (loan) {
      setAmount(loan.amount);
      setInterestRate(loan.interestRate * 100); // convert to percentage for display
      setTerm(loan.term);
      setStatus(loan.status);
    }
  }, [loan]);

  const handleSubmit = () => {
    if (!loan) return;
    onSubmit({ 
        amount, 
        interestRate: interestRate / 100, // convert back to decimal
        term, 
        status 
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Empréstimo</DialogTitle>
          <DialogDescription>
            Atualize as informações do empréstimo. Alterar os valores irá recalcular as parcelas.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="amount" className="text-right">
              Valor (R$)
            </Label>
            <Input id="amount" type="number" value={amount} onChange={(e) => setAmount(parseFloat(e.target.value))} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="interestRate" className="text-right">
              Juros (% a.m.)
            </Label>
            <Input id="interestRate" type="number" value={interestRate} onChange={(e) => setInterestRate(parseFloat(e.target.value))} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="term" className="text-right">
              Prazo (meses)
            </Label>
            <Input id="term" type="number" value={term} onChange={(e) => setTerm(parseInt(e.target.value, 10))} className="col-span-3" />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="loan-status" className="text-right">
              Status
            </Label>
            <Select
              value={status}
              onValueChange={(value: "Em dia" | "Atrasado" | "Pago") =>
                setStatus(value)
              }
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Selecione um status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Em dia">Em dia</SelectItem>
                <SelectItem value="Atrasado">Atrasado</SelectItem>
                <SelectItem value="Pago">Pago</SelectItem>
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
          <Button type="submit" onClick={handleSubmit}>
            Salvar Alterações
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
