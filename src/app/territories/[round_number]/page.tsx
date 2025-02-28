"use client";

import { TerritoryChart } from "@/components/TerritoryChart";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Blocks, Building, Home, Hotel, Store } from "lucide-react";
import { RoundThemeUpdater } from "@/components/RoundThemeUpdater";
import { AxiosAdapter } from "@/infra/AxiosAdapter";
import toast from "react-hot-toast";
import { navigatorShare } from "@/lib/share";
import dayjs from "dayjs";
import { use, useCallback, useEffect, useState } from "react";
import { MODE, RootModeScreen } from "@/components/RootModeScreen";
import { Territories, Round, TerritoryType } from "@/types/territories";

const axios = new AxiosAdapter();

const ClientTerritories = ({ params }: { params: Promise<{ round_number: string }> }) => {
  const { round_number } = use(params);
  const [mode, setMode] = useState<MODE>(MODE.LOADING);
  const [territoriesState, setTerritoriesState] = useState<Territories[]>([]);
  const [round, setRound] = useState<Round>({ id: 0, round_number: 0, name: "", theme: "", tenant_id: 0, color_primary: "", color_secondary: "", start_date: "", end_date: null, completed: 0, not_completed: 0 });
  const [types, setTypes] = useState<TerritoryType[]>([]);

  const TypesIcon: { [key: string]: JSX.Element } = {
    Residencial: <Home className="w-4 h-4 mr-2" style={{ color: round?.color_primary }} />,
    Comercial: <Store className="w-4 h-4 mr-2" style={{ color: round?.color_primary }} />,
    "Predial-Interno": <Hotel className="w-4 h-4 mr-2" style={{ color: round?.color_primary }} />,
    "Predial-Externo": <Building className="w-4 h-4 mr-2" style={{ color: round?.color_primary }} />,
  };

  const generateSignature = async (territoryId: number, overseer: string, expirationDate: string) => {
    try {
      const { data, status } = await axios.post<{ overseer: string, expirationTime: string, round: string }, { signature: string }>(`territories/${territoryId}/signature`, {
        overseer,
        expirationTime: expirationDate,
        round: round_number,
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

    const queryRound = new URLSearchParams({ round: round_number });
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

  const fetchData = useCallback(async () => {
    const query = new URLSearchParams({ round: round_number.toString() });

    const [territoriesResponse, roundResponse, typesResponse] = await Promise.all([
      axios.get(`territories?${query}`),
      axios.get(`rounds/info/${round_number}`),
      axios.get(`territories/types`)
    ]);

    const territories = territoriesResponse.data as Territories[];
    const round = roundResponse.data as Round;
    const types = typesResponse.data as TerritoryType[];
    return { territories, round, types };
  }, [round_number]);

  useEffect(() => {
    fetchData().then(({ territories, round, types }) => {
      setTerritoriesState(territories);
      setRound(round);
      setTypes(types);
      setMode(MODE.SCREEN);
    });
  }, [fetchData]);

  return (
    <RootModeScreen mode={mode}>
      <div className="p-2 md:p-6">
        <RoundThemeUpdater round={round!} />
        <div>
          <h1 className="text-xl font-bold py-4" style={{ color: round!.color_primary }}>
            {round!.name}
          </h1>
        </div>
        <Tabs defaultValue={types[0]?.name}>
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
                    colors={[round!.color_primary, round!.color_secondary]}
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
    </RootModeScreen>
  );
};

export default ClientTerritories;