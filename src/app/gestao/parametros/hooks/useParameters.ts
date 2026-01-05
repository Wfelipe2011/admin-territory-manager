import { useState } from "react";
import { AxiosAdapter } from "@/infra/AxiosAdapter";
import toast from "react-hot-toast";
import { Parameter } from "../types";

export const useParameters = () => {
    const [isLoading, setIsLoading] = useState(false);
    const axios = new AxiosAdapter();

    const fetchParameters = async (): Promise<Parameter[]> => {
        setIsLoading(true);
        try {
            const response = await axios.get<Parameter[]>("parameters");
            if (response.status === 200 && response.data) {
                return response.data;
            }
            return [];
        } catch (error) {
            console.error("Error fetching parameters", error);
            return [];
        } finally {
            setIsLoading(false);
        }
    };

    const upsertParameter = async (key: string, value: string) => {
        setIsLoading(true);
        try {
            const response = await axios.post("parameters", { key, value });

            if (response.status === 201 || response.status === 200) {
                toast.success("Parâmetro atualizado com sucesso!");
                return true;
            } else {
                toast.error(response.message || "Erro ao atualizar parâmetro");
                return false;
            }
        } catch {
            toast.error("Erro ao conectar com o servidor");
            return false;
        } finally {
            setIsLoading(false);
        }
    };

    return {
        fetchParameters,
        upsertParameter,
        isLoading,
    };
};
