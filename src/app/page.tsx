import { LineChart } from "@/components/ui/LineChart";

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
    </div>
  );
}
