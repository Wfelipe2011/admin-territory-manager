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

  const territoriesFiltered = (typeId: number) => {
    return territoriesState.filter((t) => t.typeId === typeId);
  };

  const shareSubmit = async (territoryId: number, overseer: string, expirationDate: string) => {
    const { data, status } = await axios.post<any, { signature: string }>(`territories/${territoryId}/signature`, {
      overseer,
      expirationTime: expirationDate,
      round: round.round_number,
    });

    if (!data?.signature || status > 299) {
      toast.error("Erro ao compartilhar o território");
      return;
    }

    const territory = territoriesState.find((t) => t.territoryId === territoryId);
    if (!territory) {
      toast.error("Território não encontrado");
      return;
    }

    const queryRound = new URLSearchParams({ round: String(round.round_number) });
    const query = new URLSearchParams({ p: `territorio/${territoryId}?${queryRound.toString()}`, s: data.signature });
    const toShare = {
      title: `*DESIGNAÇÃO DE TERRITÓRIO*`,
      url: `https://qa.territory-manager.com.br/home?${query.toString()}`,
      text: `*DESIGNAÇÃO DE TERRITÓRIO*\n\nPrezado irmão *_${overseer}_*\nsegue o link para o território *${territory?.name}* que você irá trabalhar até ${dayjs(expirationDate).format(
        "DD/MM/YYYY"
      )} \n\n\r`,
    };
    await navigatorShare(toShare);
    setTerritoriesState((prev) => prev.map((t) => (t.territoryId === territoryId ? { ...t, signature: { expirationDate, key: data.signature }, overseer } : t)));
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
                expirationDate: null,
                key: null,
              },
              overseer: null,
            }
          : t
      )
    );

    toast.success("Designação revogada com sucesso");
    window.location.reload();
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
        {types.map((type) => (
          <TabsContent key={type.name} className="flex flex-wrap gap-4 items-center justify-center" value={type.name}>
            {territoriesFiltered(type.id).map((territory) => (
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
        ))}
      </Tabs>
    </div>
  );
};
