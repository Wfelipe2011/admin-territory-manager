import Link from "next/link";
import type { Metadata } from "next";
export const metadata: Metadata = { title: "Suporte da integração" };

export default function IntegrationSupport() {
  return <article className="max-w-3xl space-y-7 leading-relaxed">
    <header className="space-y-3"><h1 className="text-3xl font-semibold">Suporte da integração</h1><p>Atendimento da integração do Território Digital, desenvolvida por Wilson Felipe da Silva.</p></header>
    <section className="space-y-4 rounded-2xl border bg-card p-6"><h2 className="text-xl font-semibold">Fale com o responsável</h2><p>Use o mesmo canal de contato divulgado no site do Território Digital para dúvidas sobre conexão, permissões, cadastro e privacidade.</p><a href="https://wa.me/5515981785706?text=Ol%C3%A1%2C%20preciso%20de%20suporte%20com%20a%20integra%C3%A7%C3%A3o%20MCP%20do%20Territ%C3%B3rio%20Digital." className="inline-block rounded-lg bg-primary px-5 py-3 font-medium text-primary-foreground hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary">Entrar em contato pelo WhatsApp</a><p className="text-sm text-muted-foreground">Ou acesse o <a href="https://td.territory-manager.com.br/" className="underline">site do Território Digital</a>.</p></section>
    <section className="space-y-3"><h2 className="text-xl font-semibold">Ao informar um problema</h2><p>Descreva o cliente utilizado, o horário aproximado, a operação desejada e a mensagem de erro. Compartilhe somente os dados necessários para identificar o problema, preferindo exemplos de demonstração.</p><p>Não envie senhas, tokens, chaves OAuth, arquivos de backup ou exportações completas do cadastro.</p></section>
    <section className="space-y-3"><h2 className="text-xl font-semibold">Precisa interromper o acesso?</h2><p>Acesse <Link href="/gestao/integracoes" className="underline">Integrações no Admin</Link> e revogue a conexão. Essa ação impede novas chamadas; se uma operação já foi concluída, confira o cadastro antes de repeti-la.</p></section>
  </article>;
}
