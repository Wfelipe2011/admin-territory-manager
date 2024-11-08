"use client"

import { Card, CardContent } from "@/components/ui/card"
import { ReactNode } from "react";

interface MetricChartProps {
    title: string;
    value: number;
    Icon: ReactNode
}

export function MetricChart({ title, value, Icon }: MetricChartProps) {
    return (
        <Card className="bg-background/60 w-full">
            <CardContent className="p-6">
                <div className="w-full flex gap-4 justify-between">
                    <span className="text-lg font-medium">{title}</span>
                    {Icon}
                </div>
                <div className="mt-3">
                    <span className="text-2xl font-bold">{value.toLocaleString()}</span>
                </div>
            </CardContent>
        </Card>
    )
}