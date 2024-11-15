'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function RoundMenu({
  onButtonClick
}: {
  onButtonClick: ({ name, type }: { name: string; type: string }) => void,
}) {
  const [name, setName] = useState("")
  const [roundType, setRoundType] = useState<'padrao' | 'cartas' | 'campanha'>("padrao")

  const colorTheme = {
    'padrao': "#7AAD58",
    'cartas': "#E29D4F",
    'campanha': '#5B98AB'
  }

  return (
    <>
      <h2 className="text-2xl font-medium text-center">Iniciar nova rodada</h2>
      <div className="space-y-4">
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
          <Label htmlFor="game-type">Tipo de rodada</Label>
          <Select value={roundType} onValueChange={(value: string) => setRoundType(value as 'padrao' | 'cartas' | 'campanha')}>
            <SelectTrigger id="game-type">
              <SelectValue placeholder="Selecione o tipo da rodada" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="padrao">Padrão</SelectItem>
              <SelectItem value="cartas">Cartas</SelectItem>
              <SelectItem value="campanha">Campanha</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button
        className="w-full mt-4 text-white"
        variant="secondary"
        style={
          {
            backgroundColor: colorTheme[roundType] || "#000"
          }
        }
        disabled={!name || !roundType}
        onClick={() => onButtonClick({ name: name, type: roundType })}
      >
        Iniciar rodada
      </Button>
    </>

  )
}