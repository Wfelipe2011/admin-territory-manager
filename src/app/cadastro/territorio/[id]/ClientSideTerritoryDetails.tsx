'use client'

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { AxiosAdapter } from "@/infra/AxiosAdapter";
import { toast } from "react-hot-toast";
import { Territory } from "./type";
import { Input } from "@/components/ui/input";

const axios = new AxiosAdapter(undefined, "v1");
export function ClientSideTerritoryDetails() {
    const [territory, setTerritory] = useState<Territory>({} as Territory);
    const { id } = useParams();

    const fetchTerritory = useCallback(async () => {
        try {
            const response = await axios.get<Territory>(`territories/${id}?round=1`);

            if (!response.data || response.status > 299) {
                throw new Error("Território não encontrado");
            }
            setTerritory(response.data);
        } catch (error) {
            toast.error("Erro ao buscar território");
        }
    }, [id]);
    useEffect(() => {
        fetchTerritory();
    }, [fetchTerritory]);

    const updateTerritoryName = (value: string) => {
        setTerritory((prev) => ({ ...prev, territoryName: value }));
    }

    return (
        <div className="flex flex-col gap-4">
            <h1 className="text-3xl font-bold text-slate-700">Editar Território:</h1>
            <Input type="text" placeholder="Nome do território" value={territory?.territoryName} onChange={(e) => updateTerritoryName(e.target.value)} />

        </div>
    );
}
