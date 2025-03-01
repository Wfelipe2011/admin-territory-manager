"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PlusCircle } from "lucide-react"

interface AddTerritoryButtonProps {
    territoryTypes: Array<{ value: string; label: string }>
    onAddTerritory: (data: { name: string; typeId: number }) => void
}

export function AddTerritoryButton({ onAddTerritory, territoryTypes }: AddTerritoryButtonProps) {
    const [open, setOpen] = useState(false)
    const [name, setName] = useState("")
    const [typeId, setTypeId] = useState<number | null>(null)

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()

        if (name && typeId) {
            onAddTerritory({ name, typeId })
            setOpen(false)
            resetForm()
        }
    }

    const resetForm = () => {
        setName("")
        setTypeId(null)
    }

    return (
        <>
            <Button onClick={() => setOpen(true)} className="bg-primary hover:bg-primary/90">
                <PlusCircle className="mr-2 h-4 w-4" />
                Adicionar
            </Button>

            <Dialog
                open={open}
                onOpenChange={(isOpen) => {
                    setOpen(isOpen)
                    if (!isOpen) resetForm()
                }}
            >
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Adicionar Território</DialogTitle>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Nome</Label>
                            <Input
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Digite o nome do território"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="type">Tipo</Label>
                            <Select
                                value={typeId?.toString() || ""}
                                onValueChange={(value) => setTypeId(Number.parseInt(value))}
                                required
                            >
                                <SelectTrigger id="type">
                                    <SelectValue placeholder="Selecione um tipo" />
                                </SelectTrigger>
                                <SelectContent>
                                    {territoryTypes.map((type) => (
                                        <SelectItem key={type.value} value={type.value}>
                                            {type.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <DialogFooter className="pt-4">
                            <DialogClose asChild>
                                <Button type="button" variant="outline">
                                    Cancelar
                                </Button>
                            </DialogClose>
                            <Button type="submit" className="bg-primary hover:bg-primary/90" disabled={!name || !typeId}>
                                Salvar
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    )
}

