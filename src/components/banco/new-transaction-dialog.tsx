
"use client"

import type { BankAccount, Transaction, Category } from "@/lib/types"
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
import { useState, useEffect } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface NewTransactionDialogProps {
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  onSubmit: (data: Omit<Transaction, 'id' | 'accountId' | 'type' | 'date'>) => void
  transactionType: "receita" | "despesa"
  account: BankAccount | null
  categories: Category[]
}

export function NewTransactionDialog({ isOpen, onOpenChange, onSubmit, transactionType, account, categories }: NewTransactionDialogProps) {
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState<number | '' >('');
  const [category, setCategory] = useState<string | undefined>(undefined);

  const isRevenue = transactionType === "receita";
  const title = isRevenue ? "Nova Receita" : "Nova Despesa";
  const dialogDescription = `Adicione uma nova ${isRevenue ? "receita" : "despesa"} para a conta ${account?.banco}.`
  
  const availableCategories = categories.filter(c => c.type === transactionType);

  useEffect(() => {
    if (!isOpen) {
      setDescription("");
      setAmount('');
      setCategory(undefined);
    }
  }, [isOpen]);

  const handleSubmit = () => {
    if (typeof amount !== 'number' || amount <= 0 || !description) return;
    onSubmit({ description, amount, category });
    onOpenChange(false);
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
            <Input id="amount" type="number" placeholder="R$ 0,00" className="col-span-3" value={amount} onChange={(e) => setAmount(e.target.value === '' ? '' : parseFloat(e.target.value))} />
          </div>
           <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="category" className="text-right">
              Categoria
            </Label>
            <Select onValueChange={setCategory} value={category}>
                <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                    {availableCategories.map(cat => (
                        <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
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
