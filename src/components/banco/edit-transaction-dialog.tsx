
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
import type { Transaction, Category } from "@/lib/types"
import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface EditTransactionDialogProps {
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  onSubmit: (data: Partial<Transaction>) => void
  transaction: Transaction | null
  categories: Category[]
}

export function EditTransactionDialog({ isOpen, onOpenChange, onSubmit, transaction, categories }: EditTransactionDialogProps) {
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState(0);
  const [category, setCategory] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (transaction) {
      setDescription(transaction.description);
      setAmount(transaction.amount);
      setCategory(transaction.category);
    }
  }, [transaction]);

  const handleSubmit = () => {
    if (!transaction) return;
    onSubmit({ description, amount, category });
  }
  
  const isRevenue = transaction?.type === "receita";
  const title = "Editar Transação";
  const dialogDescription = `Atualize os dados da transação.`;
  
  const availableCategories = categories.filter(c => c.type === transaction?.type);

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
           <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="category-edit" className="text-right">
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
          <Button type="submit" onClick={handleSubmit}>Salvar Alterações</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
