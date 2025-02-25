import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Territory } from "../type";
import { AxiosAdapter } from "@/infra/AxiosAdapter";
const axiosV2 = new AxiosAdapter(undefined, "v2");

export const useTerritory = (territoryId: number) => {
    const [territory, setTerritory] = useState<Territory>({} as Territory);


    const fetchTerritory = useCallback(async () => {
        try {
            const response = await axiosV2.get<Territory>(`territories/${territoryId}/edit`);
            if (!response.data || response.status > 299) {
                throw new Error("Território não encontrado");
            }
            setTerritory(response.data);
        } catch (error) {
            toast.error("Erro ao buscar território");
            console.error(error);
        }
    }, [territoryId]);
    useEffect(() => {
        fetchTerritory();
    }, [fetchTerritory]);

    return {
        territory,
    }
}