import { TerritoryChart } from "@/components/TerritoryChart";

const GestaoPage = () => {
  return (
    <div>
      <TerritoryChart
        data={[
          { name: "Concluído", value: 60 },
          { name: "A fazer", value: 40 },
        ]}
        colors={["#E29D4F", "#F7E9D9"]}
        date="15/08/2024"
        title="Cartas"
      />
      <br />
      <TerritoryChart
        data={[
          { name: "Concluído", value: 60 },
          { name: "A fazer", value: 40 },
        ]}
        colors={["#E29D4F", "#F7E9D9"]}
        date="15/08/2024"
        title="Residencial"
      />
    </div>
  );
}

export default GestaoPage;