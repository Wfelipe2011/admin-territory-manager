/* eslint-disable @typescript-eslint/no-explicit-any */
import { LineChart } from "@/components/LineChart";
import { MetricChart } from "@/components/MetricChart";
import { AxiosAdapter } from "@/infra/AxiosAdapter";
import { Building2, Home as HomeIcon, Map, Store } from "lucide-react";
import { Metadata } from "next";
import { cookies } from "next/headers";

const config = {
  residential: { label: "Residencial", color: "#7AAD58" },
  commercial: { label: "Comercial", color: "#5B98AB" },
};

async function fetchData() {
  const cookieStore = cookies();
  const token = (await cookieStore).get('token')?.value;
  if (!token) {
    throw new Error('Token is missing');
  }

  const axios = new AxiosAdapter(token)

  const [territoryDetailsResponse, markedHousesResponse] = await Promise.all([
    axios.get<any>('dashboard/territory-details'),
    axios.get<any>('dashboard/marked-houses'),
  ]);

  return {
    territoryDetails: territoryDetailsResponse.data,
    markedHouses: markedHousesResponse.data,
  };
}

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Dashboard principal com informações do território",
};

const DashboardPage = async () => {
  const { territoryDetails, markedHouses } = await fetchData();
  return (
    <div className="md:p-8">
      <LineChart
        data={markedHouses}
        config={config}
        yAxisConfig={{
          dataKey: "residential",
          label: "Casas marcadas",
        }}
      />
      <div className="w-full flex flex-wrap gap-4 mt-4 md:flex-nowrap">
        <MetricChart
          title="Total de Casas"
          value={territoryDetails.total.toLocaleString()}
          Icon={<HomeIcon className="h-5 w-5 text-muted-foreground" />}
        />
        <MetricChart
          title="Território Residencial"
          value={territoryDetails.residential.toLocaleString()}
          Icon={<Map className="h-5 w-5 text-muted-foreground" />}
        />
        <MetricChart
          title="Território Comercial"
          value={territoryDetails.commercial.toLocaleString()}
          Icon={<Store className="h-5 w-5 text-muted-foreground" />}
        />
        <MetricChart
          title="Território Predial"
          value={territoryDetails.building.toLocaleString()}
          Icon={<Building2 className="h-5 w-5 text-muted-foreground" />}
        />
      </div>
    </div>
  );
};

export default DashboardPage;
