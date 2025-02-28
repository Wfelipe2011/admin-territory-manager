'use client'

import { Button } from "@/components/ui/button"
import { MouseEventHandler } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";

export function DialogTextConfirm({
  children,
  status,
  onStatusChange,
  onLeafClick,
  onRightClick,
}: {
  children: React.ReactNode,
  status: boolean,
  onStatusChange: (open: boolean) => void,
  onLeafClick: MouseEventHandler<HTMLButtonElement>,
  onRightClick: MouseEventHandler<HTMLButtonElement>,
}) {
  return (
    <Dialog
      open={status}
      onOpenChange={onStatusChange}
    >
      <DialogTitle></DialogTitle>
      <DialogContent className="w-auto p-5 px-9">
        <div className="flex flex-col items-center justify-center gap-4">
          {children}
          <div className="flex gap-4">
            <Button
              onClick={onLeafClick}
              className="bg-primary hover:bg-primary/90 text-white"
            >
              Confirmar
            </Button>
            <Button
              onClick={onRightClick}
              className="bg-[#E53E3E] hover:bg-[#E53E3E]/90 text-white"
            >
              Cancelar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
