'use client'

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search } from 'lucide-react'

import { ChangeEventHandler, useState } from 'react';
import { RoundMenu } from "./RoundMenu";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ReportModal } from "./report-modal";

export function SearchInterface({
  onSearchChange,
  onButtonClick,
  searchValue,
  buttonLabel = "Criar Novo"
}: {
  onSearchChange: ChangeEventHandler<HTMLInputElement>,
  onButtonClick: ({ name, theme }: { name: string; theme: string }) => Promise<void>,
  searchValue: string,
  buttonLabel?: string
}) {
  const [open, onOpenChange] = useState(false)
  return (
    <div className="w-full flex items-center justify-between gap-4">
      <div className="relative">
        <Input
          type="search"
          placeholder="Pesquise"
          value={searchValue}
          onSelect={onSearchChange}
          className="pl-10 bg-background border rounded-md"
        />
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      </div>
      <div className="flex items-center gap-4">
        <ReportModal />
        <Dialog
          open={open}
          onOpenChange={onOpenChange}
        >
          <DialogTrigger asChild>
            <Button
              className="bg-[#6BA84F] hover:bg-[#6BA84F]/90 text-white"
            >
              {buttonLabel}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <RoundMenu
              onButtonClick={async (e) => {
                await onButtonClick(e);
                onOpenChange(false);
              }}
            ></RoundMenu>
          </DialogContent>
        </Dialog>

      </div>
    </div>
  )
}
