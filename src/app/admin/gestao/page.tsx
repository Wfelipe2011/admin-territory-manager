import axios from "axios";
import ClientSideGestao from "./ClientSideGestao";

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

  return <ClientSideGestao rounds={data} />;
}

export default GestaoPage;