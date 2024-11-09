import { LineChart } from "@/components/LineChart";
import { MetricChart } from "@/components/MetricChart";
import { Building2, Home as HomeIcon, Map, Store } from "lucide-react";
import axios from 'axios';
import { Metadata } from "next";

const config = {
  residential: { label: "Residencial", color: "#7AAD58" },
  commercial: { label: "Comercial", color: "#5B98AB" },
};

async function fetchData() {
  const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjBmMDczYWM2LTM0ZTItNDRkZS04ZDA3LWEwN2I3MThjZmUyZCIsInVzZXJJZCI6MSwidXNlck5hbWUiOiJXaWxzb24gRmVsaXBlIiwicm9sZXMiOlsiYWRtaW4iXSwidGVuYW50SWQiOjIsImlhdCI6MTczMTE4MzM2NiwiZXhwIjoxNzMxMjY5NzY2fQ.1w0ZignKnT9mnJDDKV_jY-GD_DlBZwoIH-cRZeUUGN4';
 
  const [territoryDetailsResponse, markedHousesResponse] = await Promise.all([
    axios.get('https://api-hmg.territory-manager.com.br/V1/dashboard/territory-details', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    }),
    axios.get('https://api-hmg.territory-manager.com.br/V1/dashboard/marked-houses', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    }),
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
    <div className="mt-10">
      <LineChart
        data={markedHouses}
        config={config}
        yAxisConfig={{
          dataKey: "residential",
          label: "Casas marcadas",
        }}
      />
      <div className="w-full flex gap-4 mt-4">
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
  );
};

export default DashboardPage;
