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
import type { NewCustomer } from "@/lib/types"

interface AddCustomerDialogProps {
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  onSubmit: (data: NewCustomer) => void
}

export function AddCustomerDialog({ isOpen, onOpenChange, onSubmit }: AddCustomerDialogProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [cpf, setCpf] = useState("");
  const [address, setAddress] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [houseNumber, setHouseNumber] = useState("");
  const [city, setCity] = useState("");


  const handleSubmit = () => {
    if (!name || !email || !cpf) return;
    onSubmit({ name, email, cpf, address, postalCode, houseNumber, city });
    setName("");
    setEmail("");
    setCpf("");
    setAddress("");
    setPostalCode("");
    setHouseNumber("");
    setCity("");
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Adicionar Novo Cliente</DialogTitle>
          <DialogDescription>
            Preencha os dados do novo cliente.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Nome
            </Label>
            <Input id="name" placeholder="João da Silva" className="col-span-3" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="email" className="text-right">
              Email
            </Label>
            <Input id="email" type="email" placeholder="joao@example.com" className="col-span-3" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="cpf" className="text-right">
              CPF
            </Label>
            <Input id="cpf" placeholder="123.456.789-00" className="col-span-3" value={cpf} onChange={(e) => setCpf(e.target.value)} />
          </div>
           <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="address" className="text-right">
              Endereço
            </Label>
            <Input id="address" placeholder="Rua das Flores" className="col-span-3" value={address} onChange={(e) => setAddress(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
             <div className="grid grid-cols-4 items-center gap-4 col-span-2 sm:col-span-1">
                <Label htmlFor="houseNumber" className="text-right sm:col-span-1">
                Nº
                </Label>
                <Input id="houseNumber" placeholder="123" className="col-span-3 sm:col-span-3" value={houseNumber} onChange={(e) => setHouseNumber(e.target.value)} />
            </div>
            <div className="grid grid-cols-4 items-center gap-4 col-span-2 sm:col-span-1">
                <Label htmlFor="postalCode" className="text-right sm:col-span-1">
                CEP
                </Label>
                <Input id="postalCode" placeholder="12345-678" className="col-span-3 sm:col-span-3" value={postalCode} onChange={(e) => setPostalCode(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="city" className="text-right">
              Cidade
            </Label>
            <Input id="city" placeholder="São Paulo" className="col-span-3" value={city} onChange={(e) => setCity(e.target.value)} />
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
