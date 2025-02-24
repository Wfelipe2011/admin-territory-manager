"use client"

import { useState } from "react"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { AxiosAdapter } from "@/infra/AxiosAdapter";

const axios = new AxiosAdapter();

export function ReportModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [startDate, setStartDate] = useState<Date>()
  const [endDate, setEndDate] = useState<Date>()
  const [isLoading, setIsLoading] = useState(false)
  const [startDateOpen, setStartDateOpen] = useState(false)
  const [endDateOpen, setEndDateOpen] = useState(false)

  const handleGenerateReport = async () => {
    if (!startDate || !endDate) return

    try {
      setIsLoading(true)
      const dateFrom = format(startDate, "yyyy-MM-dd")
      const dateTo = format(endDate, "yyyy-MM-dd")

      const response = await axios.get<string>(`records?dateFrom=${dateFrom}&dateTo=${dateTo}`)
      const data = response.data
      console.log(data)
      if (!data) {
        console.error("Erro ao gerar relatório: dados não encontrados")
        return
      }

      // Create blob with UTF-8 encoding
      const blob = new Blob([new Uint8Array([0xef, 0xbb, 0xbf]), data], {
        type: "text/csv;charset=utf-8",
      })

      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "registros.csv"
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      setIsOpen(false)
    } catch (error) {
      console.error("Erro ao gerar relatório:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog modal open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Relatórios</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]" onClick={(e) => e.stopPropagation()}>
        <DialogHeader>
          <DialogTitle>Gerar Relatório</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Popover modal open={startDateOpen} onOpenChange={setStartDateOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn("w-full justify-start text-left font-normal", !startDate && "text-muted-foreground")}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, "PPP", { locale: ptBR }) : <span>Data de início</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="center">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={(date) => {
                    setStartDate(date)
                  }}
                  locale={ptBR}
                  initialFocus
                  className="sticky rounded-md border z-[100]"
                />
                <div className="p-3 border-t">
                  <Button className="w-full" onClick={() => setStartDateOpen(false)}>
                    Confirmar
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
          <div className="grid gap-2">
            <Popover modal open={endDateOpen} onOpenChange={setEndDateOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn("w-full justify-start text-left font-normal", !endDate && "text-muted-foreground")}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate ? format(endDate, "PPP", { locale: ptBR }) : <span>Data final</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 z-50" align="center">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={(date) => {
                    setEndDate(date)
                  }}
                  locale={ptBR}
                  initialFocus
                  className="rounded-md border"
                />
                <div className="p-3 border-t">
                  <Button className="w-full" onClick={() => setEndDateOpen(false)}>
                    Confirmar
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
        <Button
          onClick={handleGenerateReport}
          disabled={!startDate || !endDate || isLoading}
          className="w-full bg-[#BFE1BF] text-black hover:bg-[#A8D5A8]"
        >
          {isLoading ? "Gerando..." : "Criar relatório"}
        </Button>
      </DialogContent>
    </Dialog>
  )
}

