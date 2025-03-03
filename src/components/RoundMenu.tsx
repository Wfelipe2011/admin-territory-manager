"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ColorSelector } from "./ui/ColorSelector"
import { CreateRoundDto } from "@/types/CreateRoundDto"

const COLOR_THEMES = [
  { primary: "#7AAD58", secondary: "#CBE6BA" },
  { primary: "#5B98AB", secondary: "#EAF2F4" },
  { primary: "#E29D4F", secondary: "#F7E9D9" },
  { primary: "#b382d2", secondary: "#d5bae6" },
  { primary: "#d2b382", secondary: "#e6d5ba" },
]

interface RoundMenuProps {
  territoryTypes: Array<{ id: number, name: string }>
  onButtonClick: (data: CreateRoundDto) => void
}

export function RoundMenu({ onButtonClick, territoryTypes }: RoundMenuProps) {
  const [name, setName] = useState("")
  const [theme, setTheme] = useState<"default" | "campaign">("default")
  const [selectedColorIndex, setSelectedColorIndex] = useState(0)
  const [selectedTypeId, setSelectedTypeId] = useState<number>(territoryTypes[0].id)

  const handleSubmit = () => {
    if (!name || !selectedTypeId) return

    const selectedColor = COLOR_THEMES[selectedColorIndex]

    onButtonClick({
      name,
      theme,
      typeId: selectedTypeId,
      colorPrimary: selectedColor.primary,
      colorSecondary: selectedColor.secondary,
    })
  }

  const isFormValid = name && selectedTypeId

  return (
    <>
      <h2 className="text-2xl font-medium text-center">Iniciar nova rodada</h2>
      <div className="space-y-6 mt-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nome da rodada</Label>
          <Input
            id="name"
            placeholder="Digite o nome da rodada"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="territory-type">Tipo de rodada</Label>
          <Select value={selectedTypeId.toString()} onValueChange={(value) => setSelectedTypeId(Number(value))}>
            <SelectTrigger id="territory-type">
              <SelectValue placeholder="Selecione o tipo da rodada" />
            </SelectTrigger>
            <SelectContent>
              {territoryTypes.map((type) => (
                <SelectItem key={type.id} value={type.id.toString()}>
                  {type.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Tema de cor</Label>
          <ColorSelector options={COLOR_THEMES} selectedIndex={selectedColorIndex} onSelect={setSelectedColorIndex} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="theme">Modo</Label>
          <Select value={theme} onValueChange={(value: "default" | "campaign") => setTheme(value)}>
            <SelectTrigger id="theme">
              <SelectValue placeholder="Selecione o modo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">Normal</SelectItem>
              <SelectItem value="campaign">Campanha</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button
        className="w-full mt-6 text-white"
        style={{
          backgroundColor: COLOR_THEMES[selectedColorIndex].primary,
        }}
        disabled={!isFormValid}
        onClick={handleSubmit}
      >
        Iniciar rodada
      </Button>
    </>
  )
}