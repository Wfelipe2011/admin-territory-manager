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
  children?: React.ReactNode;
}

export function TerritoryFilter({
  title,
  selectedBlock,
  tabs,
  onTabChange,
  onSearch,
  children,
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
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>

          {/* Add button */}
          {/* <Button>ADICIONAR</Button> */}
          {children}
        </div>
      </div>
    </div>
  )
}

