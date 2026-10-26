# Área local do publicador e PWA

## Uso

No login, **Área do publicador** abre `/publicador` sem conta administrativa.
O primeiro acesso pede somente o nome. Existe um perfil por navegador/origem,
independente do cookie do administrador e da sessão de campo.

Na tela de ruas e casas da designação, **Registros → Registrar conversa** no rodapé pede a
rua e a casa. Depois permite cadastrar um interessado ou continuar a conversa com
alguém que já foi salvo nessa casa. O cadastro inicial do publicador preserva a
casa escolhida. Cada conversa tem data/hora corrigível e anotações; o próximo
retorno é opcional. Essas ações não marcam casas nem enviam solicitações ao Admin.

Ao salvar, apenas a casa escolhida e sua hierarquia mínima são guardadas. Não se
salvam as demais casas da quadra, mapa, rodada, permissões, link ou token.
No painel, território → quadra → rua → casa organiza os interessados. A busca
encontra nomes e endereços. Várias pessoas podem ser cadastradas na mesma casa.
Novos endereços entram pela designação ou por importação; novos interessados em
casas já salvas podem ser cadastrados sem internet e sem link.

No registro do interessado, **Como chegar** abre o Google Maps com rua, número,
cidade e UF da casa salva. Somente ao tocar nessa ação o endereço é enviado ao
serviço de mapas; nome, contato, complemento e conversas não integram o link.
O trajeto depende da disponibilidade do aplicativo de mapas e de sua conexão.

Na tela do interessado, as quatro ações ficam em uma grade de botões de 48 px,
com duas colunas. Cada conversa traz data e ações de edição/exclusão no cabeçalho.
No desktop, cadastro e ações ficam ao lado do histórico; no celular, são empilhados.

O menu **Registros** no rodapé de ruas e casas reúne **Meus registros**, que abre
a Área do publicador sem passar pelo login, e **Registrar conversa**, para iniciar
um registro no endereço escolhido. O acesso fica a dois toques da tela de ruas.
Casas com um interessado ativo salvo neste aparelho exibem um coração. Esse
indicador é pessoal e não é compartilhado pela API.

O interessado e suas conversas podem ser corrigidos ou excluídos com confirmação.
A exclusão do interessado inclui suas conversas. Permanecem IDs, vínculos e datas
para revisar exclusões em futuras importações; nome, contato e textos excluídos
são substituídos por identificadores genéricos. A casa permanece disponível para
outros interessados. Excluir aqui não remove cópias já enviadas a outras pessoas.

## Dados e arquivos

O IndexedDB `territorio-digital-publicador`, versão 1, mantém um documento
transacional na store `documents`, chave `main`. O esquema contém perfil,
endereços, interessados, conversas e revisão. Escritas leem e atualizam o documento
na mesma transação, inclusive entre abas. Uma revisão de importação fica presa à
versão que o usuário viu: alteração em outra aba exige uma nova revisão.

Nenhum conteúdo desse módulo é enviado à API ou salvo no servidor. UUIDs podem
aparecer no fragmento local da navegação, sem nomes, contatos ou textos. As telas
administrativas e o campo continuam usando seus fluxos HTTP já existentes.

**Meus dados** oferece exportação completa e importação de arquivos
`.tdpub.json`. O envelope possui `format: "territorio-digital-publicador"`,
`version: 1`, `kind: "backup" | "interested"`, `exportedAt`, `profile`,
`addresses`, `interested` e `conversations`. O compartilhamento individual não
inclui o perfil do remetente. Inclui endereço, cadastro, todas as conversas e
identificadores de exclusão relacionados. O arquivo é legível, sem senha.

A importação valida tamanho (até 10 MB), campos permitidos, versões, UUIDs,
datas e vínculos antes de escrever. Campos inesperados são rejeitados.
Apresenta quantidade de registros, interessados e decisões; não sobrescreve o
perfil local. O cadastro do destinatário é obrigatório, mesmo em aparelho vazio.
Registros idênticos não duplicam. Endereços da mesma origem, congregação e IDs
de estrutura são reutilizados; pessoas não são combinadas por nome ou endereço.
Diferenças no mesmo ID e exclusões recebidas exigem escolha explícita.
Uma exclusão de interessado inclui suas conversas locais. Toda a mesclagem é
aplicada em uma única transação, ou não é aplicada.

O compartilhamento nativo permite escolher WhatsApp ou outro aplicativo. Sem
suporte a arquivos, o download permite anexar manualmente. Cancelar o envio não
gera download nem remove a cópia local. Não é criado link público de interessado.

No Android compatível com PWA instalado, o aplicativo pode aparecer em
**Compartilhar com**. O service worker intercepta o POST para
`/publicador/receber` e guarda até cinco arquivos recebidos no cache local
`td-publisher-inbox-v1`; nunca encaminha esse POST ao servidor. A página mostra
**Arquivos recebidos**, permitindo revisar ou descartar cada arquivo. O cache é
independente das atualizações do aplicativo e é removido após importação/descarte.
No desktop compatível, `file_handlers`/`launchQueue` recebem arquivos abertos pelo
sistema e apresentam a mesma revisão. No iPhone e em navegadores sem essas APIs,
salve o arquivo recebido e selecione **Importar arquivo**. A abertura direta pelo
WhatsApp não é universal e depende das opções do sistema operacional.

## PWA e operação local

O manifesto instala **Território Digital**, entrada `/login`, modo independente,
ícones normais/maskable e ícone de tela inicial Apple. O rodapé do publicador abre
Meus dados com instalação/instruções, estado offline e atualização disponível.

O build executa `scripts/build-pwa.mjs` após `next build`, gerando `public/sw.js`
(ignorado pelo Git). O Dockerfile de produção já copia tanto `.next` como
`public`, incluindo o worker gerado. Não publicar os dois diretórios de builds
diferentes. Servir `sw.js` sem cache HTTP; os headers estão em `next.config.ts`.

O worker prepara documentos públicos completos de `/login` e `/publicador`,
imagens/ícones e chunks/fontes/CSS do build. Nenhum HTML administrativo,
resposta de API, RSC ou catálogo de campo é armazenado. Na área local, a
navegação usa fragmentos e não precisa de respostas adicionais do Next.js.
O indicador **Pronto para uso offline** aparece somente depois da ativação do
worker, que depende do sucesso do pré-cache completo. O perfil, painel, edição,
importação e exportação podem então ser usados sem conexão, mesmo após reabrir.
Sem preparação inicial online, não há como abrir um app que ainda não foi baixado.

Atualizações aguardam o usuário em **Meus dados → Atualização disponível**.
O recarregamento requer confirmação. IndexedDB e arquivos recebidos não são
apagados; caches anteriores de código são preservados para abas ainda abertas.
O navegador decide se concede `navigator.storage.persist()`. Backups continuam
necessários: limpar o site, usar outro perfil/navegador ou trocar de aparelho não
transfere dados automaticamente.

Usar a origem canônica. Em desenvolvimento, `localhost:3000` redireciona para
`localhost:4800` antes do cadastro; produção mantém o redirecionamento do domínio
legado para o Admin. IP, domínio, protocolo e porta diferentes têm armazenamentos
separados. O PWA exige HTTPS ou localhost. Não instalar pela URL HTTP do IP da LAN.

`npm run dev` mantém o IndexedDB e permite desenvolver as telas, mas não registra
o service worker, evitando cache de chunks transitórios do HMR. Para validar PWA:

```bash
npm run build
npm run test:publisher
```

A suíte abre um servidor de produção separado em `http://localhost:4815`, usa
apenas dados sintéticos e não escreve no banco da API. Para testar visualmente o
build, executar `npx next start -p 4815` depois do build. A porta de teste é outra
origem e não contém os registros de `localhost:4800`. Não executar dois processos
de build/dev no mesmo diretório `.next`.

Os projetos Playwright são `android-chromium` (Pixel 7) e `iphone-webkit`
(iPhone 13). Instalar WebKit com `npx playwright install webkit` e disponibilizar
as dependências Linux do navegador. A execução automatizada cobre os motores e
viewports; validar o menu nativo do WhatsApp/instalação em aparelhos físicos antes
de publicar. O envio nativo e o recebimento por arquivo são simulados nos testes;
o processamento local do share-target também é exercitado offline no Chromium.

Não há alterações de schema, worker Bun, DNS, proxy de produção ou deploy nesta
entrega. Marcações de campo continuam exigindo conexão e autorização da API.

## Verificação local — 26/10/2026

- `npm run typecheck` e `npm run build`: aprovados. O lint do build reporta
  somente três avisos anteriores em cadastro de ruas, parâmetros e usuários.
- Suíte do publicador em build de produção: **22 aprovados e 2 ignorados**.
  Os dois cenários ignorados no WebKit (reinício de perfil em disco e instalação
  de uma segunda versão do worker) são exercitados e aprovados no Chromium.
- Regressão de campo com `appearance.spec.ts` e `permissions.spec.ts`:
  **19 aprovados**, incluindo rodapé, três temas, sincronização, permissões e
  quadra com 174 casas. Nenhuma marcação foi feita nos dados reais restaurados.
- Layouts 360/390/430/1280 verificados sem overflow nos motores Chromium e
  WebKit, com capturas inspecionadas. Evidências da suíte local em
  `test-results/publisher/` e `playwright-report/publisher/` (ignorados pelo Git).
- WebKit foi executado com bibliotecas Linux adicionais extraídas em diretório
  temporário e disponibilizadas ao runtime do navegador, sem instalar pacotes
  no sistema. Em outro host, seguir os pré-requisitos normais do Playwright.
- Menus nativos do WhatsApp, instalação e associação de arquivos em aparelhos
  físicos continuam pendentes de homologação; os testes usam perfis mobile,
  simulação do compartilhamento e recebimento real pelo worker local offline.
