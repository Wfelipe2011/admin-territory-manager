"use client";

import React, { useEffect, useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { useParameters } from "../hooks/useParameters";
import { PARAMETER_MAPPING, ParameterKey } from "../types";

interface EditParameterDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    parameterKey: ParameterKey | null;
    currentValue: string;
    onSuccess?: () => void;
}

export function EditParameterDialog({
    open,
    onOpenChange,
    parameterKey,
    currentValue,
    onSuccess,
}: EditParameterDialogProps) {
    const { upsertParameter, isLoading } = useParameters();
    const [value, setValue] = useState(currentValue);

    useEffect(() => {
        setValue(currentValue);
    }, [currentValue, open]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!parameterKey || value.trim() === "") return;

        const success = await upsertParameter(parameterKey, value);
        if (success) {
            onOpenChange(false);
            if (onSuccess) onSuccess();
        }
    };

    const mapping = parameterKey ? PARAMETER_MAPPING[parameterKey] : null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Alterar {mapping?.label}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="grid w-full items-center gap-1.5">
                        <Label htmlFor="value">Valor ({mapping?.suffix})</Label>
                        <Input
                            id="value"
                            type="number"
                            placeholder="Digite o novo valor"
                            value={value}
                            onChange={(e) => setValue(e.target.value)}
                            disabled={isLoading}
                            required
                        />
                        {mapping && (
                            <p className="text-xs text-muted-foreground">
                                {mapping.description}
                            </p>
                        )}
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={isLoading || value.trim() === ""}>
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Salvando...
                                </>
                            ) : (
                                "Salvar Alteração"
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
