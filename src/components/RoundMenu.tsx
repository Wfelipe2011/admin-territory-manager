'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function RoundMenu({
  onButtonClick
}: {
  onButtonClick: ({ name, theme }: { name: string; theme: string }) => void,
}) {
  const [name, setName] = useState("")
  const [roundType, setRoundType] = useState<'default' | 'letters' | 'campaign'>("default")

  const colorTheme = {
    'default': "#7AAD58",
    'letters': "#E29D4F",
    'campaign': '#5B98AB'
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
            onSelect={(e) => setName(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="game-type">Tipo de rodada</Label>
          <Select value={roundType} onValueChange={(value: string) => setRoundType(value as 'default' | 'letters' | 'campaign')}>
            <SelectTrigger id="game-type">
              <SelectValue placeholder="Selecione o tipo da rodada" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">Padrão</SelectItem>
              {/* <SelectItem value="letters">Cartas</SelectItem> */}
              <SelectItem value="campaign">Campanha</SelectItem>
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
        onClick={() => onButtonClick({ name: name, theme: roundType })}
      >
        Iniciar rodada
      </Button>
    </>

  )
}