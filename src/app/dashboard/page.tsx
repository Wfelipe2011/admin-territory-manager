"use client";

import { LineChart } from "@/components/LineChart";
import { MetricChart } from "@/components/MetricChart";
import { MODE, RootModeScreen } from "@/components/RootModeScreen";
import { AxiosAdapter } from "@/infra/AxiosAdapter";
import { Building2, Home as HomeIcon, Map, Store } from "lucide-react";
import { useEffect, useState } from "react";

const config = {
  residential: { label: "Residencial", color: "#7AAD58" },
  commercial: { label: "Comercial", color: "#5B98AB" },
};

interface TerritoryDetails {
  total: number;
  residential: number;
  commercial: number;
  building: number;
}

interface MarkedHouses {
  date: string;
  residential: number;
  commercial: number;
}

const DashboardPage = () => {
  const [territoryDetails, setTerritoryDetails] = useState<TerritoryDetails>({
    total: 0,
    residential: 0,
    commercial: 0,
    building: 0,
  });
  const [markedHouses, setMarkedHouses] = useState<MarkedHouses[]>([{
    date: "",
    residential: 0,
    commercial: 0,
  }]);
  const [mode, setMode] = useState<MODE>(MODE.LOADING);

  async function fetchData() {
    const axios = new AxiosAdapter()

    const [territoryDetailsResponse, markedHousesResponse] = await Promise.all([
      axios.get<TerritoryDetails>('dashboard/territory-details'),
      axios.get<MarkedHouses[]>('dashboard/marked-houses'),
    ]);

    return {
      territoryDetails: territoryDetailsResponse.data!,
      markedHouses: markedHousesResponse.data!,
    };
  }

  useEffect(() => {
    fetchData().then((data) => {
      setTerritoryDetails(data.territoryDetails);
      setMarkedHouses(data.markedHouses);
      setMode(MODE.SCREEN)
    });
  }, []);

  return (
    <RootModeScreen mode={mode}>
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
            value={territoryDetails.total}
            Icon={<HomeIcon className="h-5 w-5 text-muted-foreground" />}
          />
          <MetricChart
            title="Território Residencial"
            value={territoryDetails.residential}
            Icon={<Map className="h-5 w-5 text-muted-foreground" />}
          />
          <MetricChart
            title="Território Comercial"
            value={territoryDetails.commercial}
            Icon={<Store className="h-5 w-5 text-muted-foreground" />}
          />
          <MetricChart
            title="Território Predial"
            value={territoryDetails.building}
            Icon={<Building2 className="h-5 w-5 text-muted-foreground" />}
          />
        </div>
      </div>
    </RootModeScreen>
  );
};

export default DashboardPage;
