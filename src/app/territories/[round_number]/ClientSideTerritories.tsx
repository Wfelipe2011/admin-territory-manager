/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { TerritoryChart } from "@/components/TerritoryChart";
import { Round, Territories, TerritoryType } from "./page";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Blocks, Building, Home, Hotel, Store } from "lucide-react";
import { RoundThemeUpdater } from "@/components/RoundThemeUpdater";
import { AxiosAdapter } from "@/infra/AxiosAdapter";
import toast from "react-hot-toast";
import { navigatorShare } from "@/lib/share";
import dayjs from "dayjs";
import { useState } from "react";

type ClientSideTerritoriesProps = {
  territories: Territories[];
  round: Round;
  types: TerritoryType[];
};
const axios = new AxiosAdapter();
export const ClientSideTerritories = ({ territories, round, types }: ClientSideTerritoriesProps) => {
  const [territoriesState, setTerritoriesState] = useState(territories);

  const TypesIcon: { [key: string]: JSX.Element } = {
    Residencial: <Home className="w-4 h-4 mr-2" style={{ color: round.color_primary }} />,
    Comercial: <Store className="w-4 h-4 mr-2" style={{ color: round.color_primary }} />,
    "Predial-Interno": <Hotel className="w-4 h-4 mr-2" style={{ color: round.color_primary }} />,
    "Predial-Externo": <Building className="w-4 h-4 mr-2" style={{ color: round.color_primary }} />,
  };

  const generateSignature = async (territoryId: number, overseer: string, expirationDate: string) => {
    try {
      const { data, status } = await axios.post<any, { signature: string }>(`territories/${territoryId}/signature`, {
        overseer,
        expirationTime: expirationDate,
        round: round.round_number,
      });

      if (!data?.signature || status > 299) {
        throw new Error("Erro ao gerar a assinatura");
      }

      return data.signature;
    } catch (error) {
      toast.error("Erro ao compartilhar o território");
      throw error;
    }
  };

  const shareTerritory = async (territoryId: number, overseer: string, expirationDate: string, signature: string) => {
    const territory = territoriesState.find((t) => t.territoryId === territoryId);
    if (!territory) {
      toast.error("Território não encontrado");
      return;
    }

    const queryRound = new URLSearchParams({ round: String(round.round_number) });
    const query = new URLSearchParams({ p: `territorio/${territoryId}?${queryRound.toString()}`, s: signature });
    const toShare = {
      title: `*DESIGNAÇÃO DE TERRITÓRIO*`,
      url: `https://qa.territory-manager.com.br/home?${query.toString()}`,
      text: `*DESIGNAÇÃO DE TERRITÓRIO*\n\nPrezado irmão *_${overseer}_*\nsegue o link para o território *${territory.name}* que você irá trabalhar até ${dayjs(expirationDate).format(
        "DD/MM/YYYY"
      )} \n\n\r`,
    };

    await navigatorShare(toShare);

    setTerritoriesState((prev) =>
      prev.map((t) =>
        t.territoryId === territoryId ? { ...t, signature: { expirationDate, key: signature }, overseer } : t
      )
    );
  };

  const shareSubmit = async (territoryId: number, overseer: string, expirationDate: string) => {
    const territory = territoriesState.find((t) => t.territoryId === territoryId);

    if (!territory) {
      toast.error("Território não encontrado");
      return;
    }

    const existingSignature = territory.signature?.key;
    const signature = existingSignature
      ? existingSignature // Se já existe, reutiliza a assinatura
      : await generateSignature(territoryId, overseer, expirationDate); // Caso contrário, gera uma nova.

    try {
      await shareTerritory(territoryId, overseer, expirationDate, signature);
    } catch (error) {
      console.error(error);
    }
  };

  const onRevokeClick = async (territoryId: number) => {
    const territory = territoriesState.find((t) => t.territoryId === territoryId);
    if (!territory) {
      toast.error("Território não encontrado");
      return;
    }
    const data = await axios.delete(`territories/${territoryId}/signature`);
    if (data.status > 299) {
      toast.error("Erro ao revogar a designação");
      return;
    }

    setTerritoriesState((prev) =>
      prev.map((t) =>
        t.territoryId === territoryId
          ? {
            ...t,
            signature: {
              expirationDate: "",
              key: "",
            },
            overseer: "",
          }
          : t
      )
    );
  };

  return (
    <div className="p-2 md:p-6">
      <RoundThemeUpdater round={round} />
      <div>
        <h1 className="text-xl font-bold py-4" style={{ color: round.color_primary }}>
          {round.name}
        </h1>
      </div>
      <Tabs defaultValue={types[0].name}>
        <TabsList className="flex flex-wrap justify-center gap-2 md:inline-flex h-full">
          {types.map((type) => (
            <TabsTrigger id={String(type.id)} key={type.id} value={type.name}>
              {TypesIcon[type.name] || <Blocks />}
              {type.name}
            </TabsTrigger>
          ))}
        </TabsList>
        {types.map((type) => {
          return (
            <TabsContent key={type.name} className="flex flex-wrap gap-4 items-center justify-center" value={type.name}>
              {territoriesState.filter((t) => t.typeId === type.id).map((territory) => (
                <TerritoryChart
                  key={`${type.name}-${territory.territoryId}`}
                  data={[
                    { name: "Concluído", value: territory.positiveCompleted.length },
                    { name: "A fazer", value: territory.negativeCompleted },
                  ]}
                  colors={[round.color_primary, round.color_secondary]}
                  territory={territory}
                  onShareClick={(overseer, expirationDate) => shareSubmit(territory.territoryId, overseer, expirationDate)}
                  onRevokeClick={() => onRevokeClick(territory.territoryId)}
                />
              ))}
            </TabsContent>
          )
        })}
      </Tabs>
    </div>
  );
};
