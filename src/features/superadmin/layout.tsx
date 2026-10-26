"use client";
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { jwtDecode } from 'jwt-decode';
import { Activity, ArrowLeft, Building2, ChartNoAxesCombined, LogOut } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import type { DecodedToken } from '@/types/auth';
import { Button } from '@/components/ui/button';

const links = [{ href: '/superadmin', label: 'Visão geral', Icon: ChartNoAxesCombined }, { href: '/superadmin/congregacoes', label: 'Congregações', Icon: Building2 }, { href: '/superadmin/saude', label: 'Saúde técnica', Icon: Activity }];
export function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth(), path = usePathname();
  let identity: DecodedToken | null = null;
  try { if (user?.token) identity = jwtDecode<DecodedToken>(user.token); } catch { /* Middleware and API enforce access. */ }
  if (!identity?.roles?.includes('super_admin')) return <p role="status" className="p-6 text-sm">Verificando acesso…</p>;
  return <div className="min-h-dvh bg-slate-50 text-slate-900">
    <aside className="fixed inset-y-0 left-0 z-20 hidden w-60 flex-col border-r bg-white px-4 py-6 lg:flex">
      <Link href="/superadmin" className="mb-9 flex items-center gap-3 px-2"><span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#7AAD58]"><Image src="/logo.png" width={40} height={40} alt="Território Digital" /></span><span className="text-sm font-semibold">Território Digital<span className="mt-1 block text-xs font-normal text-slate-500">Super admin</span></span></Link>
      <nav aria-label="Super admin" className="space-y-2">{links.map(({ href, label, Icon }) => <Link key={href} href={href} aria-current={path === href ? 'page' : undefined} className={`flex min-h-12 items-center gap-3 rounded-xl px-3 text-sm ${path === href ? 'bg-[#eaf3e4] font-semibold text-[#446e32]' : 'text-slate-600 hover:bg-slate-50'}`}><Icon size={19} aria-hidden />{label}</Link>)}</nav>
      <div className="mt-auto space-y-4 border-t pt-4"><Link href="/dashboard" className="flex min-h-11 items-center gap-2 px-2 text-sm text-slate-600"><ArrowLeft size={17} aria-hidden />Gestão da congregação</Link><div className="px-2 text-xs text-slate-500"><strong className="block text-sm font-medium text-slate-800">{identity.userName}</strong>{identity.tenantName || `Congregação ${identity.tenantId}`}</div><Button variant="ghost" className="min-h-11 w-full justify-start text-slate-600" onClick={logout}><LogOut size={17} />Sair</Button></div>
    </aside>
    <div className="lg:pl-60">
      <header className="border-b bg-white px-4 py-3 sm:px-6 lg:px-8"><div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2"><p className="text-sm font-semibold">Super admin <span className="ml-2 rounded-full bg-[#eaf3e4] px-2.5 py-1 text-xs font-medium text-[#446e32]">Visão global</span></p><div className="flex items-center gap-2 text-xs text-slate-500"><span className="hidden sm:inline">{identity.userName}</span><Link href="/dashboard" className="inline-flex min-h-11 items-center gap-1 rounded-lg px-2 lg:hidden"><ArrowLeft size={16} />Gestão</Link><Button variant="ghost" className="min-h-11 lg:hidden" onClick={logout}>Sair</Button></div></div><nav aria-label="Super admin mobile" className="mx-auto mt-2 grid max-w-xl grid-cols-3 gap-1 lg:hidden">{links.map(({ href, label, Icon }) => <Link key={href} href={href} aria-current={path === href ? 'page' : undefined} className={`flex min-h-12 flex-col items-center justify-center gap-1 rounded-lg text-[11px] ${path === href ? 'bg-[#eaf3e4] font-semibold text-[#446e32]' : 'text-slate-600'}`}><Icon size={18} aria-hidden />{label}</Link>)}</nav></header>
      <main className="mx-auto max-w-7xl space-y-5 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
    </div>
  </div>;
}
