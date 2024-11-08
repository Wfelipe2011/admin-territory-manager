"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

// Modifiquei a interface para incluir as configurações do eixo Y
interface LineChartProps {
  data: Array<{ date: string; residential: number, commercial: number }>
  config: {
    residential: { label: string; color: string }
    commercial: { label: string; color: string }
  }
  yAxisConfig: {
    dataKey: string
    label: string
  }
}

export function LineChart({ data, config, yAxisConfig }: LineChartProps) {
  const [timeRange, setTimeRange] = React.useState("90d")

  const filteredData = data.filter((item) => {
    const date = new Date(item.date)
    const referenceDate = new Date("2024-06-30")
    let daysToSubtract = 90
    if (timeRange === "30d") {
      daysToSubtract = 30
    } else if (timeRange === "7d") {
      daysToSubtract = 7
    } else if (timeRange === "12m") {
      daysToSubtract = 365
    }
    const startDate = new Date(referenceDate)
    startDate.setDate(startDate.getDate() - daysToSubtract)
    return date >= startDate
  })

  const getSubTitle = () => {
    if (timeRange === "30d") {
      return "30 dias"
    } else if (timeRange === "7d") {
      return "7 dias"
    } else if (timeRange === "12m") {
      return "12 meses"
    }
    return "3 meses"
  }

  return (
    <Card>
      <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
        <div className="grid flex-1 gap-1 text-center sm:text-left">
          <CardTitle>Residências Marcadas</CardTitle>
          <CardDescription>
            Mostrando o total de casas marcadas nos últimos {getSubTitle()}
          </CardDescription>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[160px] rounded-lg sm:ml-auto" aria-label="Select a value">
            <SelectValue placeholder="Últimos 3 meses" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="12m" className="rounded-lg">Últimos 12 meses</SelectItem>
            <SelectItem value="90d" className="rounded-lg">Últimos 3 meses</SelectItem>
            <SelectItem value="30d" className="rounded-lg">Últimos 30 dias</SelectItem>
            <SelectItem value="7d" className="rounded-lg">Últimos 7 dias</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer config={config} className="aspect-auto h-[250px] w-full">
          <AreaChart data={filteredData}>
            <defs>
              <linearGradient id="fillResidential" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={config.residential.color} stopOpacity={0.8} />
                <stop offset="95%" stopColor={config.residential.color} stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="fillCommercial" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={config.commercial.color} stopOpacity={0.8} />
                <stop offset="95%" stopColor={config.commercial.color} stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value)
                return date.toLocaleDateString("pt-BR", {
                  month: "short",
                })
              }}
            />
            <YAxis
              dataKey={yAxisConfig.dataKey}
              label={{ value: yAxisConfig.label, angle: -90, position: 'insideLeft', dy: 40 }}
              tickLine={false}
              axisLine={false}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleDateString("pt-BR", {
                      month: "short",
                    })
                  }}
                  indicator="dot"
                />
              }
            />
            <Area
              dataKey="residential"
              type="natural"
              fill="url(#fillResidential)"
              stroke={config.residential.color}
              stackId="a"
            />
            <Area
              dataKey="commercial"
              type="natural"
              fill="url(#fillCommercial)"
              stroke={config.commercial.color}
              stackId="b"
            />
            <ChartLegend content={<ChartLegendContent />} />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
