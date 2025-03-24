"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"
import tinycolor from "tinycolor2"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// Interface para dados dinâmicos
interface DataItem {
  date: string
  [key: string]: string | number
}

interface LineChartProps {
  data: DataItem[]
  baseColor?: string // Cor base para gerar variantes
  yAxisConfig?: {
    label: string
  }
}

export function LineChart({ data, baseColor = "#3b82f6", yAxisConfig }: LineChartProps) {
  const [timeRange, setTimeRange] = React.useState("90d")

  // Extrair todas as chaves dinâmicas (exceto 'date')
  const dataKeys = React.useMemo(() => {
    const keys = new Set<string>()
    data.forEach((item) => {
      Object.keys(item).forEach((key) => {
        if (key !== "date") keys.add(key)
      })
    })
    return Array.from(keys)
  }, [data])

  // Gerar cores para cada chave
  const colorMap = React.useMemo(() => {
    const base = tinycolor(baseColor)
    const colors: Record<string, string> = {}

    dataKeys.forEach((key, index) => {
      // Gerar variantes de cor baseadas na cor principal
      const hue = base.toHsl().h
      const newHue = (hue + index * (360 / Math.max(dataKeys.length, 1))) % 360
      const color = tinycolor({ h: newHue, s: base.toHsl().s, l: base.toHsl().l }).toHexString()
      colors[key] = color
    })

    return colors
  }, [dataKeys, baseColor])

  // Gerar configuração dinâmica para o ChartContainer
  const config = React.useMemo(() => {
    const result: Record<string, { label: string; color: string }> = {}

    dataKeys.forEach((key) => {
      result[key] = {
        label: key,
        color: colorMap[key],
      }
    })

    return result
  }, [dataKeys, colorMap])

  const filteredData = data.filter((item) => {
    const date = new Date(item.date)
    const referenceDate = new Date()
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
          <CardDescription>Mostrando o total de casas marcadas nos últimos {getSubTitle()}</CardDescription>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[160px] rounded-lg sm:ml-auto" aria-label="Select a value">
            <SelectValue placeholder="Últimos 3 meses" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="12m" className="rounded-lg">
              Últimos 12 meses
            </SelectItem>
            <SelectItem value="90d" className="rounded-lg">
              Últimos 3 meses
            </SelectItem>
            <SelectItem value="30d" className="rounded-lg">
              Últimos 30 dias
            </SelectItem>
            <SelectItem value="7d" className="rounded-lg">
              Últimos 7 dias
            </SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer config={config} className="aspect-auto h-[250px] w-full">
          <AreaChart data={filteredData}>
            <defs>
              {dataKeys.map((key) => (
                <linearGradient key={`fill-${key}`} id={`fill-${key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={colorMap[key]} stopOpacity={0.8} />
                  <stop offset="95%" stopColor={colorMap[key]} stopOpacity={0.1} />
                </linearGradient>
              ))}
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
                date.setDate(date.getDate() + 1)
                return date.toLocaleDateString("pt-BR")
              }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              label={
                yAxisConfig?.label
                  ? {
                    value: yAxisConfig.label,
                    angle: -90,
                    position: "insideLeft",
                    dy: 40,
                  }
                  : undefined
              }
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleDateString("pt-BR", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })
                  }}
                  indicator="dot"
                />
              }
            />
            {dataKeys.map((key, index) => (
              <Area
                key={key}
                dataKey={key}
                type="natural"
                fill={`url(#fill-${key})`}
                stroke={colorMap[key]}
                stackId={`stack-${index}`}
              />
            ))}
            <ChartLegend content={<ChartLegendContent />} />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

