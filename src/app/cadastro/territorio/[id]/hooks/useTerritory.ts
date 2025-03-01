import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Territory } from "../type";
import { AxiosAdapter } from "@/infra/AxiosAdapter";
import { useMode } from ".";
const axiosV2 = new AxiosAdapter("v2");

export const useTerritory = (territoryId: number) => {
  const [territory, setTerritory] = useState<Territory>({} as Territory);
  const { mode, setMode, options } = useMode();

  const fetchTerritory = useCallback(async () => {
    try {
      setMode(options.LOADING);
      const response = await axiosV2.get<Territory>(
        `territories/${territoryId}/edit`
      );
      if (!response.data || response.status > 299) {
        throw new Error("Território não encontrado");
      }
      setTerritory(response.data);
    } catch (error) {
      toast.error("Erro ao buscar território");
      console.error(error);
    } finally {
      setMode(options.SCREEN);
    }
  }, [territoryId, setMode, options]);
  useEffect(() => {
    fetchTerritory();
  }, [fetchTerritory]);

  const updateImageUrl = (imageUrl: string) => {
    setTerritory((prev) => ({ ...prev, imageUrl }));
  };

  return {
    territory,
    fetchTerritory,
    mode,
    updateImageUrl,
  };
};
