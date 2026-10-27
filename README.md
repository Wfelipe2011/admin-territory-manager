# Território Digital — Admin unificado

Administração e área de campo em `http://localhost:4800`.

- [Área de campo e designações](docs/field.md)
- [Área local do publicador, arquivos e PWA](docs/publicador.md)

`/publicador` também está disponível pelo login, sem conta administrativa. Seus
interessados e conversas ficam no aparelho. O uso offline exige o build de
produção (`npm run build`); `npm run dev` não instala o service worker.

Validação do módulo: `npm run typecheck`, `npm run build` e
`npm run test:publisher` (Chromium e WebKit; dependências em `docs/publicador.md`).

---

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Integrações com agentes

As páginas `/integracoes`, `/integracoes/privacidade`, `/integracoes/termos` e
`/integracoes/suporte` são públicas. `/gestao/integracoes` exige a sessão
administrativa e permite consultar e revogar as próprias conexões OAuth.

Configuração do MCP, permissões, pacotes e operação estão em
[`agents-mcp.md`](../territory-manager-v2/docs/agents-mcp.md).
Verificação de navegador: `npx playwright test -c playwright.integrations.config.ts`.
Para incluir a conexão real local, informe `AGENT_DEMO_FILE` com a fixture privada
gerada pelo seed da API. Os testes não devem utilizar credenciais de produção.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
