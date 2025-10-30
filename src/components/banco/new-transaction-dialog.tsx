
"use client"

import type { BankAccount, Transaction } from "@/lib/types"
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
import { cn } from "@/lib/utils"
import { useState } from "react"

interface NewTransactionDialogProps {
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  onSubmit: (data: Omit<Transaction, 'id' | 'accountId' | 'type' | 'date'>) => void
  transactionType: "receita" | "despesa"
  account: BankAccount | null
}

export function NewTransactionDialog({ isOpen, onOpenChange, onSubmit, transactionType, account }: NewTransactionDialogProps) {
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState(0);

  const isRevenue = transactionType === "receita";
  const title = isRevenue ? "Nova Receita" : "Nova Despesa";
  const dialogDescription = `Adicione uma nova ${isRevenue ? "receita" : "despesa"} para a conta ${account?.banco}.`

  const handleSubmit = () => {
    onSubmit({ description, amount });
    setDescription("");
    setAmount(0);
  }

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
            <Label htmlFor="description" className="text-right">
              Descrição
            </Label>
            <Input id="description" placeholder={`Ex: Salário`} className="col-span-3" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="amount" className="text-right">
              Valor
            </Label>
            <Input id="amount" type="number" placeholder="R$ 0,00" className="col-span-3" value={amount} onChange={(e) => setAmount(parseFloat(e.target.value))} />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button type="submit" onClick={handleSubmit}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

    