"use client"

import { CardFooter } from "@/components/ui/card"

import { useState, useEffect } from "react"
import { ArrowDown, ArrowUp, ChevronDown, ChevronUp, DollarSign, Info } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { DonationButton } from "@/components/ui/DonationButton"

interface Transaction {
  date: string
  time: string
  timezone: string
  currency: string
  total: number
  transactionId: string
  donor: string
}

interface FixedCosts {
  server: number
  registroBr: number
  backupDiario: number
  total: number
}

interface Balance {
  totalDonations: number
  fixedCosts: FixedCosts
  balance: number
}

interface BalanceData {
  balance: Balance
  transactions: Transaction[]
}


export default function BalancoPage() {
  const [balanceData, setBalanceData] = useState<BalanceData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showDetails, setShowDetails] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dateRange] = useState({
    startDate: format(new Date(new Date().getFullYear(), 0, 1), "yyyy-MM-dd"),
    endDate: format(new Date(), "yyyy-MM-dd"),
  })

  useEffect(() => {
    const fetchBalanceData = async () => {
      setIsLoading(true)
      try {
        const response = await fetch(
          `https://api-hmg.territory-manager.com.br/transactions/balance?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`,
        )

        if (!response.ok) {
          throw new Error(`Erro ao buscar dados: ${response.status}`)
        }

        const data = await response.json()
        setBalanceData(data)
        setError(null)
      } catch (err) {
        console.error("Erro ao buscar dados de balanço:", err)
        setError("Não foi possível carregar os dados financeiros. Tente novamente mais tarde.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchBalanceData()
  }, [dateRange])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary mb-2">Balanço Financeiro Anual</h1>
          <p className="text-muted-foreground mb-8">
            Transparência total sobre como as doações são utilizadas para manter o projeto.
          </p>
        </div>
        <DonationButton />
      </div>
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-[200px] w-full rounded-lg" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Skeleton className="h-[100px] rounded-lg" />
            <Skeleton className="h-[100px] rounded-lg" />
            <Skeleton className="h-[100px] rounded-lg" />
          </div>
        </div>
      ) : error ? (
        <Card className="bg-destructive/10 border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Erro ao carregar dados</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error}</p>
          </CardContent>
          <CardFooter>
            <Button variant="outline" onClick={() => window.location.reload()}>
              Tentar novamente
            </Button>
          </CardFooter>
        </Card>
      ) : balanceData ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <ArrowDown className="h-5 w-5 text-primary" />
                  Total de Doações
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{formatCurrency(balanceData.balance.totalDonations)}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <ArrowUp className="h-5 w-5 text-destructive" />
                  Custos Fixos
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Inclui servidor, registro.br e backup diário</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{formatCurrency(balanceData.balance.fixedCosts.total)}</p>
              </CardContent>
            </Card>

            <Card className={balanceData.balance.balance < 0 ? "border-destructive" : "border-primary"}>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <DollarSign
                    className={`h-5 w-5 ${balanceData.balance.balance < 0 ? "text-destructive" : "text-primary"}`}
                  />
                  Saldo Atual
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p
                  className={`text-3xl font-bold ${balanceData.balance.balance < 0 ? "text-destructive" : "text-primary"}`}
                >
                  {formatCurrency(balanceData.balance.balance)}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Detalhamento dos Custos Fixos</CardTitle>
              <CardDescription>Valores mensais para manutenção do projeto</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Servidor</span>
                  <span className="font-medium">{formatCurrency(balanceData.balance.fixedCosts.server)}</span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span>Registro.br</span>
                  <span className="font-medium">{formatCurrency(balanceData.balance.fixedCosts.registroBr)}</span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span>Backup Diário</span>
                  <span className="font-medium">{formatCurrency(balanceData.balance.fixedCosts.backupDiario)}</span>
                </div>
                <Separator />
                <div className="flex justify-between items-center font-bold">
                  <span>Total</span>
                  <span>{formatCurrency(balanceData.balance.fixedCosts.total)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="mb-4">
            <Button
              variant="outline"
              onClick={() => setShowDetails(!showDetails)}
              className="w-full flex items-center justify-center gap-2"
            >
              {showDetails ? "Ocultar Transações" : "Ver Todas as Transações"}
              {showDetails ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>

          {showDetails && (
            <Card>
              <CardHeader>
                <CardTitle>Histórico de Transações</CardTitle>
                <CardDescription>Todas as doações recebidas no período</CardDescription>
              </CardHeader>
              <CardContent>
                {balanceData.transactions.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">
                    Nenhuma transação encontrada no período selecionado.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4">Data</th>
                          <th className="text-left py-3 px-4">Doador</th>
                          <th className="text-right py-3 px-4">Valor</th>
                          <th className="text-right py-3 px-4">ID da Transação</th>
                        </tr>
                      </thead>
                      <tbody>
                        {balanceData.transactions.map((transaction) => (
                          <tr key={transaction.transactionId} className="border-b hover:bg-muted/50">
                            <td className="py-3 px-4">{formatDate(transaction.date)}</td>
                            <td className="py-3 px-4">{transaction.donor}</td>
                            <td className="py-3 px-4 text-right font-medium">{formatCurrency(transaction.total)}</td>
                            <td className="py-3 px-4 text-right text-muted-foreground text-xs">
                              {transaction.transactionId}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
          <p className="text-center text-sm text-muted-foreground mt-4">
            Os dados financeiros são atualizados mensalmente para garantir transparência.
          </p>
        </>
      ) : null}
    </div>
  )
}

