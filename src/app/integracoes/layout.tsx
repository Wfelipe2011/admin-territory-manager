import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import styles from "@/features/integrations/palette.module.css";

export const metadata: Metadata = { title: { default: "Integrações | Território Digital", template: "%s | Território Digital" }, description: "Integrações do Território Digital com agentes de IA: funcionamento, acesso, privacidade e suporte." };

const navigation = [{ href: "/integracoes", label: "Visão geral" }, { href: "/integracoes/privacidade", label: "Privacidade" }, { href: "/integracoes/termos", label: "Termos de uso" }, { href: "/integracoes/suporte", label: "Suporte" }];

export default function IntegrationPublicLayout({ children }: { children: React.ReactNode }) {
  return <div className={`${styles.palette} min-h-screen bg-background text-foreground`}>
    <a href="#conteudo-integracoes" className="sr-only focus:not-sr-only focus:block focus:p-3">Pular para o conteúdo</a>
    <header className="border-b border-border bg-secondary"><div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-5 py-5">
      <Link href="/integracoes" className="flex items-center gap-3 font-semibold"><Image src="/icons/icon-192.png" alt="" width={44} height={44} className="rounded-xl" /><span>Território Digital<br /><span className="text-sm font-normal text-muted-foreground">Integrações com agentes</span></span></Link>
      <nav aria-label="Informações da integração" className="flex flex-wrap gap-x-5 gap-y-2 text-sm">{navigation.map(item => <Link key={item.href} href={item.href} className="rounded text-muted-foreground underline-offset-4 hover:text-primary hover:underline focus-visible:outline-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4">{item.label}</Link>)}</nav>
    </div></header>
    <main id="conteudo-integracoes" className="mx-auto max-w-5xl px-5 py-10 sm:py-14">{children}</main>
    <footer className="border-t bg-card"><div className="mx-auto flex max-w-5xl flex-wrap justify-between gap-4 px-5 py-6 text-sm text-muted-foreground"><p>Desenvolvido por Wilson Felipe da Silva.</p><a href="https://td.territory-manager.com.br/" className="underline underline-offset-4">Conheça o Território Digital</a></div></footer>
  </div>;
}
