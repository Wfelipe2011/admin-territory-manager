import { LineChart } from "@/components/LineChart";
import { MetricChart } from "@/components/MetricChart";
import { Building2, Home as HomeIcon, Map, Store } from "lucide-react"

const data = [
  { date: "2024-01-01", residential: 10, commercial: 15 },
  { date: "2024-02-01", residential: 20, commercial: 10 },
  { date: "2024-03-01", residential: 30, commercial: 5 },
  { date: "2024-04-01", residential: 10, commercial: 15 },
  { date: "2024-05-01", residential: 20, commercial: 10 },
  { date: "2024-06-01", residential: 30, commercial: 15 },
  { date: "2024-07-01", residential: 10, commercial: 15 },
  { date: "2024-08-01", residential: 20, commercial: 5 },
  { date: "2024-09-01", residential: 30, commercial: 15 },
  { date: "2024-10-01", residential: 10, commercial: 5 },
  { date: "2024-11-01", residential: 20, commercial: 10 },
  { date: "2024-12-01", residential: 30, commercial: 5 },
]

const config = {
  residential: { label: "Residencial", color: "#7AAD58" },
  commercial: { label: "Comercial", color: "#5B98AB" },
}
export default function Home() {
  return (
    <div className="mt-10">
      <LineChart
        data={data}
        config={config}
        yAxisConfig={{
          dataKey: "residential",
          label: "Casas marcadas"
        }}
      />
      <div className="w-full flex gap-4 mt-4">
        <MetricChart
          title="Total de Casas"
          value={20000}
          Icon={<HomeIcon className="h-5 w-5 text-muted-foreground" />}
        />
        <MetricChart
          title="Território Residencial"
          value={23}
          Icon={<Map className="h-5 w-5 text-muted-foreground" />}
        />
        <MetricChart
          title="Território Comercial"
          value={15}
          Icon={<Store className="h-5 w-5 text-muted-foreground" />}
        />
        <MetricChart
          title="Território Predial"
          value={5}
          Icon={<Building2 className="h-5 w-5 text-muted-foreground" />}
        />
      </div>
    </div>
  );
}
