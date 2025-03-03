"use client";

import { LineChart } from "@/components/LineChart";
import { MetricChart } from "@/components/MetricChart";
import { MODE, RootModeScreen } from "@/components/RootModeScreen";
import { TypeIcon } from "@/components/ui/TypeIcon";
import { AxiosAdapter } from "@/infra/AxiosAdapter";
import { useEffect, useState } from "react";

interface TerritoryDetails {
  total: number;
  [key: string]: number;
}

interface MarkedHouses {
  date: string;
  [key: string]: string | number;
}

const DashboardPage = () => {
  const [territoryDetails, setTerritoryDetails] = useState<TerritoryDetails>({ total: 0 });
  const [markedHouses, setMarkedHouses] = useState<MarkedHouses[]>([]);
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
        <LineChart data={markedHouses} baseColor="#7AAD58" yAxisConfig={{ label: "Quantidade" }} />
        <div className="w-full flex flex-wrap gap-4 mt-4 md:flex-nowrap">
          {Object.keys(territoryDetails).map((key) => {
            if (key === "total") return null;
            return (
              <MetricChart
                key={key}
                title={`Território ${key}`}
                value={territoryDetails[key]}
                Icon={<TypeIcon type={key} className="h-5 w-5 text-muted-foreground" />}
              />
            );
          })}
        </div>
      </div>
    </RootModeScreen>
  );
};

export default DashboardPage;
