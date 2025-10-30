
"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { Transaction } from "@/lib/types"
import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

interface EditTransactionDialogProps {
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  onSubmit: (data: Partial<Transaction>) => void
  transaction: Transaction | null
}

export function EditTransactionDialog({ isOpen, onOpenChange, onSubmit, transaction }: EditTransactionDialogProps) {
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState(0);

  useEffect(() => {
    if (transaction) {
      setDescription(transaction.description);
      setAmount(transaction.amount);
    }
  }, [transaction]);

  const handleSubmit = () => {
    if (!transaction) return;
    onSubmit({ description, amount });
  }
  
  const isRevenue = transaction?.type === "receita";
  const title = "Editar Transação";
  const dialogDescription = `Atualize os dados da transação.`;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className={cn(isRevenue ? "text-green-600" : "text-red-600")}>{title}</DialogTitle>
          <DialogDescription>
            {dialogDescription}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description-edit" className="text-right">
              Descrição
            </Label>
            <Input id="description-edit" value={description} onChange={(e) => setDescription(e.target.value)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="amount-edit" className="text-right">
              Valor
            </Label>
            <Input id="amount-edit" type="number" value={amount} onChange={(e) => setAmount(parseFloat(e.target.value))} className="col-span-3" />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button type="submit" onClick={handleSubmit}>Salvar Alterações</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
