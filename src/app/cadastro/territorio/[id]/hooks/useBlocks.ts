import { useCallback, useEffect, useState } from "react";
import { Block } from "../type";
import { AxiosAdapter } from "@/infra/AxiosAdapter";
import { toast } from "react-hot-toast";
import { useMode } from ".";
const axiosV2 = new AxiosAdapter("v2");

export const useBlocks = (territoryId: number) => {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [selectedBlock, setSelectedBlock] = useState<string>();
  const { mode, setMode, options } = useMode();

  const fetchBlocks = useCallback(async () => {
    try {
      setMode(options.LOADING);
      const response = await axiosV2.get<Block[]>(
        `territories/${territoryId}/blocks`
      );
      if (!response.data || response.status > 299) {
        throw new Error("Quadras não encontradas");
      }
      const blocks = response.data.sort((a, b) => a.name.localeCompare(b.name));
      setBlocks(blocks);
      const selectedBlockExists = blocks.find(
        (block) => block.id === Number(selectedBlock)
      );
      if (!selectedBlockExists) {
        setSelectedBlock(blocks[0]?.id.toString());
      }
    } catch (error) {
      toast.error("Erro ao buscar quadras");
      console.error(error);
    } finally {
      setMode(options.SCREEN);
    }
  }, [territoryId, selectedBlock, setMode, options]);
  useEffect(() => {
    fetchBlocks();
  }, [fetchBlocks]);

  return {
    blocks,
    selectedBlock,
    setSelectedBlock,
    fetchBlocks,
    mode,
  };
};
