/* eslint-disable @typescript-eslint/no-explicit-any */
import { AxiosAdapter } from "@/infra/AxiosAdapter";
import { cookies } from "next/headers";
import { ClientSideTerritories } from "./ClientSideTerritories";

async function fetchData(roundNumber: number) {
  const cookieStore = cookies();
  const token = (await cookieStore).get('token')?.value;

  if (!token) {
    throw new Error('Token is missing');
  }

  const axios = new AxiosAdapter(token);
  const query = new URLSearchParams({ round: roundNumber.toString() });

  const [territoriesResponse, roundResponse, typesResponse] = await Promise.all([
    axios.get(`territories?${query}`),
    axios.get(`rounds/info/${roundNumber}`),
    axios.get(`territories/types`)
  ]);

  const territories = territoriesResponse.data as Territories[];
  const round = roundResponse.data as Round;
  const types = typesResponse.data as TerritoryType[];

  return { territories, round, types };
}


export type TerritoryType = {
  id: number;
  name: string;
  tenantId: number;
}

export type Territories = {
  territoryId: number;
  typeId: number;
  name: string;
  overseer: string | null;
  signature: {
    expirationDate: string | null;
    key: string | null;
  };
  hasRounds: boolean;
  negativeCompleted: number;
  positiveCompleted: {
    date: string;
    period: string;
  }[];
}

export type Round = {
  id: number;
  round_number: number;
  name: string;
  theme: string;
  tenant_id: number;
  color_primary: string;
  color_secondary: string;
  start_date: string;
  end_date: string | null;
  completed: number;
  not_completed: number;
};

const TerritoriesPage = async (ctx: any) => {
  const { round_number } = await ctx.params;
  const { territories, round, types } = await fetchData(Number(round_number));

  return (
    <ClientSideTerritories
      territories={territories}
      round={round}
      types={types}
    />
  )
}

export default TerritoriesPage;