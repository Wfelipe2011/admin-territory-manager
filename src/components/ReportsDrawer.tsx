"use client";

import { Bell } from "lucide-react";
import { useEffect, useState } from "react";

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AxiosAdapter } from "@/infra/AxiosAdapter";
import { Button } from "./ui/button";

enum ReportType {
  add = "add",
  remove = "remove",
  update = "update",
}

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

  const startRequestReports = () => {
    clearInterval(interval);
    interval = setInterval(() => requestReports, 1000 * 30);
  };

  const reportsTextType = (type: string) => {
    switch (type) {
      case ReportType.add:
        return "Adicionar";
      case ReportType.remove:
        return "Remover";
      case ReportType.update:
        return "Atualizar";
      default:
        return "Desconhecido";
    }
  };

  const submitApprove = async (id: number) => {
    await axios.post(`reports/approve/${id}`, {});
    requestReports();
  };

  const submitCancel = async (id: number) => {
    await axios.post(`reports/cancel/${id}`, {});
    requestReports();
  };

  useEffect(() => {
    startRequestReports();
    return () => {
      clearInterval(interval);
    };
  }, []);

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
          <SheetTitle>Reports</SheetTitle>
          {reports.map((report) => {
            return (
              <Card key={report.id}>
                <CardHeader>
                  <CardTitle>{report.territory.name}</CardTitle>
                  <CardDescription>
                    {report.address.name} {report.number}
                  </CardDescription>
                  <CardDescription>{report.observations}</CardDescription>
                  <CardDescription>{report.legend}</CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center">
                  <CardDescription>{reportsTextType(report.reportType)}</CardDescription>
                </CardContent>
                <CardFooter className="flex justify-center gap-4">
                  <Button onClick={() => submitApprove(report.id)}>Aprovar</Button>
                  <Button variant={"destructive"} onClick={() => submitCancel(report.id)}>
                    Rejeitar
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </SheetHeader>
      </SheetContent>
    </Sheet>
  );
}
