import { TerritoryChart } from "@/components/TerritoryChart";
import axios from "axios";

async function fetchData() {
  const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjlkY2IzYzk4LWMwZWQtNDExOS05YzllLWY5ZTgzODJkZDNlYiIsInVzZXJJZCI6MSwidXNlck5hbWUiOiJXaWxzb24gRmVsaXBlIiwicm9sZXMiOlsiYWRtaW4iXSwidGVuYW50SWQiOjIsImlhdCI6MTczMTU4NTM4OCwiZXhwIjoxNzMxNjcxNzg4fQ.mRyRouq-GmFJT-4uvWmX6QBEp1Y02ny44ZNGYYU1sfc';
  const response = await axios.get('https://api-hmg.territory-manager.com.br/V1/rounds/info', {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
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

const GestaoPage = async () => {
  const data = await fetchData();
  return (
    <div className="flex flex-wrap gap-6 p-8">
      {data.map((round) => (
        <TerritoryChart
          key={round.id}
          data={[
            { name: "Concluído", value: round.completed },
            { name: "A fazer", value: round.not_completed },
          ]}
          colors={[round.color_primary, round.color_secondary]}
          start_date={new Date(round.start_date).toLocaleDateString("pt-BR", {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
          })}
          end_date={round.end_date === null ? null : new Date(round.end_date).toLocaleDateString("pt-BR", {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
          })}
          title={round.name}
        />
      ))
      }
    </div>
  );
}

export default GestaoPage;