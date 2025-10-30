
"use client"

import { useState } from "react"
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
import type { NewBankAccount } from "@/lib/types"

interface AddAccountDialogProps {
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  onSubmit: (data: NewBankAccount) => void
}

export function AddAccountDialog({ isOpen, onOpenChange, onSubmit }: AddAccountDialogProps) {
  const [banco, setBanco] = useState("");
  const [agencia, setAgencia] = useState("");
  const [conta, setConta] = useState("");

  const handleSubmit = () => {
    onSubmit({ banco, agencia, conta });
    // Reset fields after submit
    setBanco("");
    setAgencia("");
    setConta("");
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Adicionar Nova Conta Bancária</DialogTitle>
          <DialogDescription>
            Preencha as informações da nova conta para adicioná-la ao seu painel.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="banco" className="text-right">
              Banco
            </Label>
            <Input id="banco" placeholder="Ex: Nubank" className="col-span-3" value={banco} onChange={(e) => setBanco(e.target.value)} />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="agencia" className="text-right">
              Agência
            </Label>
            <Input id="agencia" placeholder="0001" className="col-span-3" value={agencia} onChange={(e) => setAgencia(e.target.value)} />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="conta" className="text-right">
              Conta
            </Label>
            <Input id="conta" placeholder="123456-7" className="col-span-3" value={conta} onChange={(e) => setConta(e.target.value)} />
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
