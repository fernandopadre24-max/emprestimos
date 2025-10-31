"use client"

import { useEffect, useState } from "react"
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
import type { Customer } from "@/lib/types"

interface EditCustomerDialogProps {
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  onSubmit: (data: Partial<Customer>) => void
  customer: Customer | null
}

export function EditCustomerDialog({ isOpen, onOpenChange, onSubmit, customer }: EditCustomerDialogProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [cpf, setCpf] = useState("");
  const [address, setAddress] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [houseNumber, setHouseNumber] = useState("");
  const [city, setCity] = useState("");

  useEffect(() => {
    if (customer) {
      setName(customer.name);
      setEmail(customer.email);
      setCpf(customer.cpf);
      setAddress(customer.address);
      setPostalCode(customer.postalCode);
      setHouseNumber(customer.houseNumber);
      setCity(customer.city);
    }
  }, [customer]);

  const handleSubmit = () => {
    if (!customer) return;
    onSubmit({ name, email, cpf, address, postalCode, houseNumber, city });
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Editar Cliente</DialogTitle>
          <DialogDescription>
            Atualize as informações do cliente selecionado.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name-edit" className="text-right">
              Nome
            </Label>
            <Input id="name-edit" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="email-edit" className="text-right">
              Email
            </Label>
            <Input id="email-edit" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="cpf-edit" className="text-right">
              CPF
            </Label>
            <Input id="cpf-edit" value={cpf} onChange={(e) => setCpf(e.target.value)} className="col-span-3" />
          </div>
           <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="address-edit" className="text-right">
              Endereço
            </Label>
            <Input id="address-edit" value={address} onChange={(e) => setAddress(e.target.value)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-2 gap-4">
             <div className="grid grid-cols-4 items-center gap-4 col-span-2 sm:col-span-1">
                <Label htmlFor="houseNumber-edit" className="text-right sm:col-span-1">
                Nº
                </Label>
                <Input id="houseNumber-edit" value={houseNumber} onChange={(e) => setHouseNumber(e.target.value)} className="col-span-3 sm:col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4 col-span-2 sm:col-span-1">
                <Label htmlFor="postalCode-edit" className="text-right sm:col-span-1">
                CEP
                </Label>
                <Input id="postalCode-edit" value={postalCode} onChange={(e) => setPostalCode(e.target.value)} className="col-span-3 sm:col-span-3" />
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="city-edit" className="text-right">
              Cidade
            </Label>
            <Input id="city-edit" value={city} onChange={(e) => setCity(e.target.value)} className="col-span-3" />
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
