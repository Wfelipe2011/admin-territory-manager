"use client";

import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Territory } from "./type";
import { Button } from "@/components/ui/button";
import { DialogHeader } from "@/components/ui/dialog";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { MapIcon } from "lucide-react";

interface ClientSideTerritoryProps {
  territories: Territory[];
  pagination: {
    limit: number;
    page: number;
    total: number;
  };
}
export function ClientSideTerritory({
  territories,
  pagination,
}: ClientSideTerritoryProps) {
  console.log(territories);
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[100px]">Check</TableHead>
          <TableHead>Territorio</TableHead>
          <TableHead>Mapa</TableHead>
          <TableHead className="text-right">Tipo</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {territories.map((territory) => {
          return (
            <TableRow key={territory.id}>
              <TableCell>{territory.id}</TableCell>
              <TableCell>{territory.name}</TableCell>
              <TableCell>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      <MapIcon />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Mapa {territory.name}</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                      <img
                        src={territory.imageUrl}
                        alt={territory.name}
                        className=" max-h-[70vh]"
                      />
                    </div>
                  </DialogContent>
                </Dialog>
              </TableCell>
              <TableCell className="text-right">
                {territory.type.name}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
