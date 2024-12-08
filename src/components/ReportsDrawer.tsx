"use client";

import { Bell, MapPin, Plus, RefreshCw, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { AxiosAdapter } from "@/infra/AxiosAdapter";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";
import { Textarea } from "./ui/textarea";
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "./ui/scroll-area";

type Reports = {
  id: number;
  number: string;
  dontVisit: boolean;
  blockId: number;
  addressId: number;
  territoryId: number;
  phone: string;
  legend: string;
  complement: string;
  order: string;
  observations: string;
  reportType: string;
  backupData: string;
  tenantId: number;
  territory: {
    name: string;
  };
  address: {
    name: string;
  };
  block: {
    name: string;
  };
  multitenancy: {
    name: string;
  };
};

let interval: NodeJS.Timeout;
const axios = new AxiosAdapter();
export function ReportsDrawer() {
  const [isBellActive, setIsBellActive] = useState(false);
  const [reports, setReports] = useState<Reports[]>([]);

  const requestReports = () => {
    console.log("Requesting reports");
    axios.get<Reports[]>("reports").then((response) => {
      if (response && response.data?.length) {
        setReports(response.data);
        setIsBellActive(true);
      } else {
        setReports([]);
        setIsBellActive(false);
      }
    });
  };

  const startRequestReports = useCallback(() => {
    requestReports()
    clearInterval(interval);
    interval = setInterval(() => requestReports(), 1000 * 10);
  }, []);

  const submitApprove = async (id: number) => {
    await axios.post(`reports/approve/${id}`, {});
    requestReports();
  };

  const submitCancel = async (id: number) => {
    await axios.post(`reports/cancel/${id}`, {});
    requestReports();
  };

  useEffect(() => {
    return () => {
      clearInterval(interval);
    };
  }, [startRequestReports]);

  return (
    <Sheet>
      {isBellActive && (
        <SheetTrigger className="absolute right-2 top-0 flex min-h-10 min-w-10 items-center justify-center z-50 text-white cursor-pointer">
          <Bell />
          <div className="absolute right-2 top-2 h-2 w-2 animate-ping rounded-full bg-red-500"></div>
        </SheetTrigger>
      )}
      <SheetContent className="p-2">
        <SheetHeader>
          <SheetTitle>Ocorrências</SheetTitle>
          <ScrollArea className="h-screen w-full pb-12">
            {reports.map((report) => {
              const address = `${report.address.name} ${report.number}`
              const streetViewUrl = `https://www.google.com/maps/place/${address.replace(/ /g, '+')}`
              return (
                <Card key={report.id} className="w-full max-w-sm mb-4">
                  <CardContent className="space-y-4 p-4">
                    <div className="space-y-2">
                      <h3 className="font-semibold text-lg">{report.territory.name}</h3>
                      <div className="text-sm text-muted-foreground">
                        {address} <Badge variant="secondary">{report.legend}</Badge>
                      </div>
                      <div className="flex justify-between items-end">
                        <Button
                          variant="outline"
                          size="sm"
                          className=""
                          onClick={() => window.open(streetViewUrl, '_blank')}
                        >
                          <MapPin className="mr-2 h-4 w-4" />
                          Ver no Street View
                        </Button>
                        <Button variant="outline" className="" size="sm">
                          {report.reportType === 'update' && <RefreshCw className="h-4 w-4" />}
                          {report.reportType === 'add' && <Plus className="h-4 w-4" />}
                          {report.reportType === 'remove' && <Trash2 className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                    <Separator />

                    <div className="flex flex-wrap gap-2">
                      <Textarea
                        placeholder="Observações"
                        className="min-h-[100px]"
                        value={report.observations}
                        disabled
                      />
                    </div>
                  </CardContent>
                  <CardFooter className="grid grid-cols-2 gap-2">
                    <Button onClick={() => submitCancel(report.id)} variant="destructive">Rejeitar</Button>
                    <Button onClick={() => submitApprove(report.id)} className="bg-primary">Aprovar</Button>
                  </CardFooter>
                </Card>
              );
            })}
          </ScrollArea>
        </SheetHeader>
      </SheetContent>
    </Sheet>
  );
}
