"use client"

import { Eye, Trash2 } from "lucide-react"
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useState } from "react"

interface TerritoryChartProps {
  data: { name: string; value: number }[]
  colors: string[]
  start_date: string;
  end_date: string | null;
  title: string
}

export function TerritoryChart({
  data,
  colors,
  start_date,
  end_date,
  title = "Cartas",
}: TerritoryChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)

  const onPieEnter = (_: unknown, index: number) => setActiveIndex(index)
  const onPieLeave = () => setActiveIndex(null)

  return (
    <Card className="w-full max-w-sm px-0 md:px-2">
      <CardHeader className="flex flex-row items-center justify-between p-0 pt-2 px-2">
        <CardTitle className="text-lg font-medium">{title}</CardTitle>
        <Eye className="h-6 w-6 text-muted-foreground" style={{ fill: colors[0] || "#ccc", color: 'white' }} />
      </CardHeader>
      <CardContent className="p-2">
        <div className="flex items-center justify-between">
          <TooltipProvider>
            <Tooltip open={activeIndex !== null}>
              <TooltipTrigger asChild>
                <div className="h-36 w-1/2">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius={35}
                        outerRadius={70}
                        paddingAngle={2}
                        startAngle={90}
                        endAngle={-270}
                        dataKey="value"
                        onMouseEnter={onPieEnter}
                        onMouseLeave={onPieLeave}
                      >
                        {data.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={colors[index] || "#ccc"}
                            className="cursor-pointer"
                          />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </TooltipTrigger>
              {activeIndex !== null && (
                <TooltipContent style={{ backgroundColor: colors[0] || "#000" }}>
                  <p className="font-medium">
                    {data[activeIndex].name}: {data[activeIndex].value}
                  </p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
          <div className="flex flex-col w-1/2 text-md text-muted-foreground py-2 px-2 md:px-4">
            <div className="flex flex-col w-full mb-2">
              <span className="font-medium text-lg">Inicio</span>
              <span className="font-medium text-lg border px-3 py-1 rounded-md text-center" style={{ backgroundColor: colors[1] || "#ccc" }}>{start_date}</span>
            </div>
            <div className="flex flex-col w-full mb-2">
              <span className="font-medium text-lg">Fim</span>
              {end_date === null ? <span className="font-medium text-lg border px-3 py-1 rounded-md text-center" style={{ backgroundColor: colors[1] || "#ccc" }}>  /  /  </span> :
                <span className="font-medium text-lg border px-3 py-1 rounded-md text-center" style={{ backgroundColor: colors[1] || "#ccc" }}>{end_date}</span>}
            </div>
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between">
          <div className="flex gap-8">
            {data.map((item, index) => (
              <div key={item.name} className="flex items-center gap-2">
                <div
                  className="h-3 w-3 rounded-sm"
                  style={{ backgroundColor: colors[index] || "#ccc" }}
                />
                <span className="text-md text-muted-foreground">
                  {item.name}
                </span>
              </div>
            ))}
          </div>
          <Trash2 className="h-6 w-6 text-muted-foreground"
            style={{ fill: colors[0] || "#ccc", color: 'white' }}
          />
        </div>
      </CardContent>
    </Card>
  )
}
