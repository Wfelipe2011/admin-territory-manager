/* eslint-disable @typescript-eslint/no-explicit-any */
import { AxiosAdapter } from "@/infra/AxiosAdapter";
import { cookies } from "next/headers";
import { ClientSideTerritory } from "./ClientSideTerritory";
import { Territory } from "./type";

type HttpResponse = {
  data: Territory[];
  limit: number;
  page: number;
  total: number;
};

interface SearchParams {
  page?: string;
  limit?: string;
  sort?: string;
}
async function fetchTerritories({
  page = "1",
  limit = "10",
  sort = "-id",
}: SearchParams): Promise<HttpResponse> {
  const cookieStore = cookies();
  const token = (await cookieStore).get("token")?.value;
  if (!token) {
    throw new Error("Token is missing");
  }

  const axios = new AxiosAdapter(token, "v2");
  const searchParams = new URLSearchParams({
    page,
    limit,
    sort,
  });
  const query = searchParams.toString();
  console.log(query);
  const { data, status, message } = await axios.get<HttpResponse>(
    `territories?${query}`
  );
  if (status > 299) {
    throw new Error(message);
  }
  if (!data) {
    throw new Error("Data is missing");
  }
  return data;
}

async function fetchTerritoryTypes() {
  const cookieStore = cookies();
  const token = (await cookieStore).get("token")?.value;
  if (!token) {
    throw new Error("Token is missing");
  }

  const axios = new AxiosAdapter(token, "v1");
  const { data, status, message } = await axios.get<any>("territories/types");
  if (status > 299) {
    throw new Error(message);
  }
  if (!data) {
    throw new Error("Data is missing");
  }
  return data;
}

async function ListTerritory(ctx: any) {
  const { searchParams } = await ctx;
  const { data: territories, ...pagination } = await fetchTerritories(
    searchParams
  );
  const territoryTypes = await fetchTerritoryTypes();

  return (
    <div className="w-full m-auto md:max-w-[70vw] h-full p-4">
      <div className="flex w-full h-10 border border-red-500">
        <h1>header aqui</h1>
      </div>
      <ClientSideTerritory
        territories={territories}
        pagination={pagination}
        territoryTypes={territoryTypes}
      />
    </div>
  );
}

export default ListTerritory;
