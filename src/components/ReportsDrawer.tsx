"use client";
import Link from "next/link";
import { Bell } from "lucide-react";
import { FaMoneyBillWave } from "react-icons/fa";
import { useRequests } from "@/features/requests/provider";

export function ReportsDrawer() {
  const { pending, connected } = useRequests();
  return (
    <>
      <Link
        href="/balanco"
        aria-label="Balanço"
        className="fixed right-16 top-0 z-50 flex min-h-10 min-w-10 items-center justify-center text-white"
      >
        <FaMoneyBillWave size={20} />
      </Link>
      <Link
        href="/gestao/solicitacoes"
        aria-label={`Solicitações, ${pending} pendentes`}
        title={
          connected ? "Solicitações atualizadas" : "Reconectando solicitações"
        }
        className="fixed right-2 top-0 z-50 flex min-h-10 min-w-12 items-center justify-center gap-1 text-white"
      >
        <Bell size={20} />
        <span className="text-xs">{pending}</span>
      </Link>
    </>
  );
}
