"use client";

import { useEffect, useState } from "react";
import { PageTitle } from "@/components/ui/PageTitle";
import { MODE, RootModeScreen } from "@/components/RootModeScreen";
import { useAuth } from "@/context/AuthContext";
import { jwtDecode } from "jwt-decode";
import { DecodedToken } from "@/types/auth";
import { useParameters } from "./hooks/useParameters";
import { Parameter, ParameterKey } from "./types";
import { ParameterCard } from "./components/ParameterCard";
import { EditParameterDialog } from "./components/EditParameterDialog";

export default function ParametrosPage() {
    const [mode, setMode] = useState(MODE.LOADING);
    const [parameters, setParameters] = useState<Parameter[]>([]);
    const [isAdmin, setIsAdmin] = useState(false);
    const [editingParam, setEditingParam] = useState<{ key: ParameterKey; value: string } | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const { user } = useAuth();
    const { fetchParameters } = useParameters();

    useEffect(() => {
        if (user?.token) {
            try {
                const decoded = jwtDecode<DecodedToken>(user.token);
                if (decoded.roles.includes("admin")) {
                    setIsAdmin(true);
                    loadParameters();
                } else {
                    setMode(MODE.SCREEN);
                }
            } catch (error) {
                console.error("Error decoding token", error);
                setMode(MODE.SCREEN);
            }
        } else {
            setMode(MODE.SCREEN);
        }
    }, [user]);

    const loadParameters = async () => {
        setMode(MODE.LOADING);
        try {
            const data = await fetchParameters();
            setParameters(data);
        } catch (error) {
            console.error("Error fetching parameters", error);
        } finally {
            setMode(MODE.SCREEN);
        }
    };

    const handleEdit = (key: ParameterKey, value: string) => {
        setEditingParam({ key, value });
        setIsDialogOpen(true);
    };

    if (!isAdmin && mode === MODE.SCREEN) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
                <h1 className="text-2xl font-bold text-destructive">Acesso Negado</h1>
                <p className="text-muted-foreground">Você não tem permissão para acessar esta página.</p>
            </div>
        );
    }

    // Helper to get parameter value or default
    const getParamValue = (key: string) => {
        return parameters.find(p => p.key === key)?.value || "0";
    };

    return (
        <RootModeScreen mode={mode}>
            <div className="p-6 space-y-6">
                <PageTitle title="Configurações do Sistema" />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <ParameterCard
                        parameterKey="SIGNATURE_EXPIRATION_HOURS"
                        value={getParamValue("SIGNATURE_EXPIRATION_HOURS")}
                        onEdit={handleEdit}
                    />
                    <ParameterCard
                        parameterKey="ROUND_START_DATE_MONTHS"
                        value={getParamValue("ROUND_START_DATE_MONTHS")}
                        onEdit={handleEdit}
                    />
                </div>

                <EditParameterDialog
                    open={isDialogOpen}
                    onOpenChange={setIsDialogOpen}
                    parameterKey={editingParam?.key || null}
                    currentValue={editingParam?.value || ""}
                    onSuccess={loadParameters}
                />
            </div>
        </RootModeScreen>
    );
}
