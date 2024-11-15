import ClientSideGestao from "./ClientSideGestao";
import { AxiosAdapter } from "@/infra/AxiosAdapter";
import { cookies } from "next/headers";

async function fetchData(req: any) {
  const cookieStore = cookies();
  const token = (await cookieStore).get('token')?.value;

  if (!token) {
    throw new Error('Token is missing');
  }
  
  const axios = new AxiosAdapter(token)
  const response = await axios.get('rounds/info');
  return response.data as Round[];
}

type Round = {
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
}

const GestaoPage = async ({ req }: { req: Request }) => {
  const data = await fetchData(req);

  return <ClientSideGestao rounds={data} />;
}

export default GestaoPage;