"use client"

import { Search } from 'lucide-react'
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { ChangeEvent } from 'react'

export interface TerritoryFilterProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  selectedBlock: Array<{ value: string; label: string }>;
  tabs: Array<{ value: string; label: string }>;
  onTabChange: (value: string) => void;
  onSearch: (value: ChangeEvent<HTMLInputElement>) => void;
}

export function TerritoryFilter(props: TerritoryFilterProps) {
  const { ...rest } = props;
  return (
    <div className="p-4 max-w-4xl mx-auto" {...rest}>
      <h1 className="text-2xl font-semibold mb-6">{props.title}</h1>

      <div className="space-y-4">
        {/* Search bar */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Pesquisar"
            className="pl-10"
            onChange={props.onSearch}
          />
        </div>

        {/* Filters row */}
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex gap-4 items-center flex-1">
            {/* Property type tabs */}
            <Tabs defaultValue={props.tabs[0].value}>
              <TabsList>
                {props.tabs.map((tab) => (
                  <TabsTrigger key={tab.value} value={tab.value} onClick={() => props.onTabChange(tab.value)}>
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>

          {/* Add button */}
          <Button>ADICIONAR</Button>
        </div>
      </div>
    </div>
  )
}

