'use client'

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search } from 'lucide-react'

import { ChangeEventHandler } from 'react';
import { RoundMenu } from "./RoundMenu";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog"

export function SearchInterface({
  onSearchChange, // Evento para mudança no input
  searchValue,    // Valor do input
  buttonLabel = "Criar Novo" // Label padrão do botão
}: {
  onSearchChange: ChangeEventHandler<HTMLInputElement>,
  searchValue: string,
  buttonLabel?: string
}) {
  return (
      <div className="w-full flex items-center justify-between gap-4 pt-6 ">
        <div className="relative">
          <Input
            type="search"
            placeholder="Pesquise"
            value={searchValue} // Passando valor do input
            onChange={onSearchChange} // Chamando evento no pai
            className="pl-10 bg-background border rounded-md"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button
              className="bg-[#6BA84F] hover:bg-[#6BA84F]/90 text-white"
            >
              {buttonLabel}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <RoundMenu></RoundMenu>
          </DialogContent>
        </Dialog>
      </div>
  )
}
