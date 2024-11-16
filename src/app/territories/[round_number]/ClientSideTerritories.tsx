"use client";
import { TerritoryChart } from "@/components/TerritoryChart";
import { Round, Territories, TerritoryType } from "./page";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Blocks, Building, Home, Hotel, Store } from "lucide-react";
import { RoundThemeUpdater } from "@/components/RoundThemeUpdater";

type ClientSideTerritoriesProps = {
    territories: Territories[];
    round: Round
    types: TerritoryType[]
};

export const ClientSideTerritories = ({ territories, round, types }: ClientSideTerritoriesProps) => {
    const TypesIcon: { [key: string]: JSX.Element } = {
        'Residencial': <Home className="w-4 h-4 mr-2" style={{ color: round.color_primary }} />,
        'Comercial': <Store className="w-4 h-4 mr-2" style={{ color: round.color_primary }} />,
        'Predial-Interno': <Hotel className="w-4 h-4 mr-2" style={{ color: round.color_primary }} />,
        'Predial-Externo': <Building className="w-4 h-4 mr-2" style={{ color: round.color_primary }} />
    }

    const territoriesFiltered = (typeId: number) => {
        console.log(typeId)
        return territories.filter((t) => t.typeId === typeId)
    }

    return (
        <div className="md:p-6">
            <RoundThemeUpdater round={round} />
            <div>
                <h1 className="text-xl font-bold pb-4" style={{ color: round.color_primary }}>{round.name}</h1>
            </div>
            <Tabs defaultValue={types[0].name} className="w-full">
                <TabsList>
                    {
                        types.map((type) => (
                            <TabsTrigger key={type.id} value={type.name}>
                                {TypesIcon[type.name] || <Blocks />}
                                {type.name}
                            </TabsTrigger>
                        ))
                    }
                </TabsList>
                {
                    types.map((type) => (
                        <TabsContent key={type.name} className="flex flex-wrap gap-4 items-center justify-center" value={type.name}>
                            {
                                territoriesFiltered(type.id).map((territory) => (
                                    <TerritoryChart
                                        key={territory.territoryId}
                                        data={[
                                            { name: "Concluído", value: territory.positiveCompleted.length },
                                            { name: "A fazer", value: territory.negativeCompleted },
                                        ]}
                                        colors={[round.color_primary, round.color_secondary]}
                                        title={territory.name}
                                    />
                                ))
                            }
                        </TabsContent>
                    ))
                }
            </Tabs>
        </div>
    );
};
