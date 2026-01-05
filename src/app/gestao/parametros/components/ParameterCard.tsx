"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Settings2 } from "lucide-react";
import { PARAMETER_MAPPING, ParameterKey } from "../types";

interface ParameterCardProps {
    parameterKey: ParameterKey;
    value: string;
    onEdit: (key: ParameterKey, value: string) => void;
}

export function ParameterCard({ parameterKey, value, onEdit }: ParameterCardProps) {
    const mapping = PARAMETER_MAPPING[parameterKey];

    return (
        <Card className="flex flex-col justify-between">
            <CardHeader>
                <CardTitle className="text-lg">{mapping.label}</CardTitle>
                <CardDescription>{mapping.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-primary">{value}</span>
                    <span className="text-sm text-muted-foreground">{mapping.suffix}</span>
                </div>
                <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => onEdit(parameterKey, value)}
                >
                    <Settings2 className="mr-2 h-4 w-4" />
                    Alterar Valor
                </Button>
            </CardContent>
        </Card>
    );
}
