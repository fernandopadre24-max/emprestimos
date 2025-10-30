
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
import type { BankAccount } from "@/lib/types"
import { useEffect, useState } from "react"

interface EditAccountDialogProps {
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  onSubmit: () => void
  account: BankAccount | null
}

export function EditAccountDialog({ isOpen, onOpenChange, onSubmit, account }: EditAccountDialogProps) {
  const [banco, setBanco] = useState("");
  const [agencia, setAgencia] = useState("");
  const [conta, setConta] = useState("");

  useEffect(() => {
    if (account) {
      setBanco(account.banco);
      setAgencia(account.agencia);
      setConta(account.conta);
    }
  }, [account]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Conta Bancária</DialogTitle>
          <DialogDescription>
            Atualize as informações da conta selecionada.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="banco-edit" className="text-right">
              Banco
            </Label>
            <Input id="banco-edit" value={banco} onChange={(e) => setBanco(e.target.value)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="agencia-edit" className="text-right">
              Agência
            </Label>
            <Input id="agencia-edit" value={agencia} onChange={(e) => setAgencia(e.target.value)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="conta-edit" className="text-right">
              Conta
            </Label>
            <Input id="conta-edit" value={conta} onChange={(e) => setConta(e.target.value)} className="col-span-3" />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button type="submit" onClick={onSubmit}>Salvar Alterações</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
