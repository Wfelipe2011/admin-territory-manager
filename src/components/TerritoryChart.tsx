"use client";

import { Share2, ShieldX, User } from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useEffect, useState } from "react";
import { Input } from "./ui/input";
import { Territories } from "@/app/territories/[round_number]/page";
import dayjs from "dayjs";

interface TerritoryChartProps {
  data: { name: string; value: number }[];
  colors: string[];
  territory: Territories;
  onShareClick: (overseer: string, expirationDate: string) => void;
  onRevokeClick: () => void;
}

export function TerritoryChart({ data, colors, territory, onShareClick, onRevokeClick }: TerritoryChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [overseer, setOverseer] = useState<string | null>(territory.overseer || null);
  const [expirationDate, setExpirationDate] = useState<string | null>(territory.signature?.expirationDate ? dayjs(territory.signature.expirationDate).format("YYYY-MM-DD") : null);

  const onPieEnter = (_: unknown, index: number) => setActiveIndex(index);
  const onPieLeave = () => setActiveIndex(null);

  const isShared = overseer !== null && expirationDate !== null;

  useEffect(() => {
    setOverseer(territory.overseer || null);
  }, [territory.overseer])

  useEffect(() => {
    setExpirationDate(territory.signature?.expirationDate ? dayjs(territory.signature.expirationDate).format("YYYY-MM-DD") : null);
  }, [territory.signature?.expirationDate])

  return (
    <Card className="w-full max-w-sm px-0 md:px-2">
      <CardHeader className="flex flex-row items-center justify-between p-0 pt-2 px-2">
        <CardTitle className="text-lg font-medium">{territory.name}</CardTitle>
        {isShared && (
          <Share2 className="h-5 w-5 cursor-pointer" style={{ stroke: colors[0] || "#ccc", color: "white" }} onClick={() => onShareClick(overseer, expirationDate)} />
        )}
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
                          <Cell key={`cell-${index}`} fill={colors[index] || "#ccc"} className="cursor-pointer" />
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
              <div className="relative">
                <User className="absolute right-[14px] top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input type="text" placeholder="Dirigente" value={overseer || ""} onChange={(e) => setOverseer(e.target.value)} className="pr-8 bg-background border rounded-md" />
              </div>
            </div>
            <div className="flex flex-col w-full mb-2">
              <div className="relative">
                <Input type="date" placeholder="Data de início" value={expirationDate || ""} onChange={(e) => setExpirationDate(e.target.value)} className="bg-background border rounded-md" />
              </div>
            </div>
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between">
          <div className="flex gap-8">
            {data.map((item, index) => (
              <div key={item.name} className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-sm" style={{ backgroundColor: colors[index] || "#ccc" }} />
                <span className="text-md text-muted-foreground">{item.name}</span>
              </div>
            ))}
          </div>
          {territory.signature?.key && (
            <ShieldX onClick={onRevokeClick} className="w-6 h-6 text-white fill-red-500 cursor-pointer" />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
