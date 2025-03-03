"use client"

import { Search } from 'lucide-react'
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ChangeEvent } from 'react'
import { AddTerritoryButton } from '@/app/cadastro/territorio/AddTerritoryButton'
import { TypeIcon } from './ui/TypeIcon'

export interface TerritoryFilterProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  tabs: Array<{ value: string; label: string }>;
  onTabChange: (value: string) => void;
  onAddTerritory: (data: { name: string; typeId: number }) => void;
  onSearch: (value: ChangeEvent<HTMLInputElement>) => void;
}

export function TerritoryFilter({
  title,
  tabs,
  onTabChange,
  onAddTerritory,
  onSearch,
  ...rest
}: TerritoryFilterProps) {
  return (
    <div className="p-4 max-w-4xl mx-auto" {...rest}>
      <h1 className="text-2xl font-semibold mb-6">{title}</h1>

      <div className="space-y-4">
        {/* Search bar */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Pesquisar"
            className="pl-10"
            onChange={onSearch}
          />
        </div>

        {/* Filters row */}
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex gap-4 items-center flex-1">
            {/* Property type tabs */}
            <Tabs defaultValue={tabs[0].value}>
              <TabsList>
                {tabs.map((tab) => (
                  <TabsTrigger key={tab.value} value={tab.value} onClick={() => onTabChange(tab.value)}>
                    <TypeIcon type={tab.label} className="w-4 h-4 mr-2 stroke-primary" />
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>

          <AddTerritoryButton
            territoryTypes={tabs}
            onAddTerritory={onAddTerritory}
          />
        </div>
      </div>
    </div>
  )
}

