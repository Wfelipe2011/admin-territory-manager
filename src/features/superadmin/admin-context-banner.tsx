"use client";
import Link from 'next/link';
import { jwtDecode } from 'jwt-decode';
import { useAuth } from '@/context/AuthContext';
import type { DecodedToken } from '@/types/auth';

export function AdminContextBanner() {
  const { user } = useAuth();
  let identity: DecodedToken | null = null;
  try { if (user) identity = jwtDecode<DecodedToken>(user.token); } catch { /* No identity until login. */ }
  if (!identity?.roles?.includes('super_admin')) return null;
  return <div className="mx-2 mb-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-900"><span>Gestão de <strong>{identity.tenantName || `Congregação ${identity.tenantId}`}</strong></span><Link href="/superadmin" className="inline-flex min-h-11 items-center font-medium underline">Voltar à visão global</Link></div>;
}
