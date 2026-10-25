# Frontend unificado

Administração e área mobile usam este único projeto Next.js. A área de campo
utiliza os componentes Tailwind/Radix existentes, sem Bootstrap, Material Tailwind,
Recoil, Swiper ou Socket.IO.

- `/acesso/[code]`: valida o link e entra automaticamente, sem senha ou botão de entrada; erros permitem tentar novamente.
- `/campo/[code]`: território do dirigente ou quadra do publicador.
- `/campo/[code]/quadra/[id]`: ruas expansíveis com casas, marcações e solicitações na mesma tela. Todas começam recolhidas; abrir uma rua fecha a anterior.
- `/campo/[code]/quadra/[id]/rua/[id]`: compatibilidade; mostra a mesma tela com a rua indicada expandida.
- `/home?s=UUID&p=...`: compatibilidade com links antigos; `p` é ignorado.

`NEXT_PUBLIC_API_URL` continua sendo a URL completa da API.
`NEXT_PUBLIC_APP_URL` agora é a URL canônica deste Admin, por exemplo
`http://localhost:4800` ou `https://admin.territory-manager.com.br`.

O acesso mobile é guardado em `sessionStorage`, por código. Ele não escreve nem
substitui o cookie administrativo `token`. O cliente HTTP de campo usa `fetch`
próprio, sem cookies/interceptores administrativos. Permissões são verificadas
pela API a cada requisição; manipular o contexto armazenado não altera privilégios.

Temas/cores ficam no contêiner da área mobile e não mudam o tema administrativo.
Mapas, GPS, cartas/campanhas, legendas, não bater, solicitações e compartilhamentos
estão na mesma área. O compartilhamento nativo tem alternativa de cópia; não há
envio automático de mensagens. Sem conexão, não são enfileiradas marcações.

## Quadra completa e permissões

Uma consulta a `GET /v1/field/blocks/:blockId/sync` carrega a quadra inteira em
`streets[].houses`. Expandir/recolher ruas não navega nem consulta a API. Existe
somente um long polling ativo; atualizações preservam ruas abertas e diálogos.
O cabeçalho fixo mostra a logo transparente em círculo com a cor do tema e a data/hora da última sincronização bem-sucedida, preservada quando offline. Mapa, ajuda, atualização manual e compartilhamento do dirigente ficam na barra inferior. Presença é contabilizada por quadra.

Cada casa recebe `canMark`, `canUnmark`, `blockedReason` e `canUnmarkUntil`.
O frontend usa essas permissões para os controles, acrescidas de conexão e
operações pendentes. Ao vencer o prazo informado, desabilita a desmarcação e
renova o snapshot. A API revalida a mesma regra ao salvar. Se a casa mudar
enquanto a confirmação estiver aberta, a confirmação é bloqueada.

## Testes

```bash
npm ci
npm run typecheck
npm run build
```

No workspace com API/Admin locais ativos:

```bash
bash dev/test-field.sh
```

O script executado da raiz do workspace cria/reutiliza somente a congregação
`QA Frontend Unificado`, com administrador `qa-campo@local.test` / `admin123`.
O seed recusa execução com `NODE_ENV=production` ou host de banco remoto.
Os testes não alteram os dados das congregações restauradas.

Para executar diretamente neste repositório, gerar o JSON do seed local e passar:

```bash
FIELD_DEMO_FILE=/caminho/fixture.json npm run test:e2e
```

Chrome instalado pode ser selecionado com
`PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/google-chrome`; caso contrário,
instalar o Chromium do Playwright com `npx playwright install chromium`.

A suíte cobre administrador → dirigente → publicador, sessões independentes,
larguras 360/390/430/1280, mapas, dois navegadores, rede offline/reconexão,
solicitação/aprovação, UUIDs e revogação. Resultados locais em
`playwright-report/` e `test-results/` são ignorados pelo Git.

Também cobre accordion sem consultas extras, apenas um polling em andamento,
permissões enviadas pelo backend, vencimento do prazo sem alterações no banco e
uma quadra simulada com 174 casas. Os testes de contrato dessa interface usam
respostas HTTP simuladas; os fluxos de integração usam a API e a congregação QA.

## Cadastros e solicitações

`/gestao/solicitacoes` é a central administrativa: filtros, comparação antes e
proposta, dependências, histórico, revisão individual ou lote atômico e confirmação
do impacto de exclusão. O contador do cabeçalho e a central compartilham o mesmo
long polling de solicitações. A antiga gaveta de ocorrências agora leva à central.

Em `/cadastro/territorio/[id]`, “Link para dirigente” funciona também em território
vazio. O administrador controla “Permitir edição de quadras e ruas”, desabilitado
por padrão e editável para o mesmo link. A tela da rodada oferece a mesma permissão
para os links com rodada fixa.

O dirigente autorizado pode cadastrar quadras e ruas e solicitar correção/exclusão
de rua. Inclusões ficam em análise, mas já recebem cadastros filhos e links de
publicadores. Casas continuam disponíveis para solicitações por todos os acessos.
O histórico de solicitações não aparece no menu da área de campo. Os formulários de alteração continuam nas ruas; a central administrativa permanece em `/gestao/solicitacoes`.

Casas provisórias podem ser marcadas durante a análise, inclusive sob pais
provisórios. Se não houver rodada aberta compatível, o cadastro de casa inicia
uma rodada padrão do mesmo tipo em toda a congregação. A aprovação conserva as
marcações. Sem participação, a casa continua cinza e indisponível. A API informa
`workRoundNumber` para os links de catálogo. O accordion usa o ID permanente
do vínculo da rua para preservar expansão mesmo após renomeação.

O teste `catalog.spec.ts` percorre território vazio → permissão do link ao vivo →
quadra/rua provisórias → publicador cadastra casa → revisão de conjunto no Admin →
rodada automática e marcação provisória → aprovação preservando marcação → renomeação e
exclusão da rua com confirmação de impacto.

## Ajustes mobile e carga

Logo transparente do legado em `public/logo.png`; ações em barra inferior com área segura.
Cadeados de prazo aceitam toque para explicar o bloqueio sem enviar PATCH.
A rejeição de inclusão exige confirmação atualizada e apaga cadastro provisório e
marcações; correções rejeitadas preservam os registros aprovados.
O roteiro reutilizável de carga está em `../territory-manager-v2/load-tests/README.md`.
As duas APIs existem somente no compose de carga, com banco sintético próprio.

## Compartilhamento e apresentação de quadras

As quadras são ordenadas somente no frontend: sem histórico, último trabalho mais
antigo e nome em ordem natural (Quadra 2 antes de Quadra 10). O dado usado é
`lastWorkedAt` já recebido no snapshot. Cards usam uma coluna no celular e duas em
telas maiores, com gráfico à esquerda e indicadores à direita em duas metades de largura semelhante. A rosca segue as proporções do Admin; compartilhar fica no cabeçalho, e contador, presença e acesso às ruas ficam no rodapé.

Compartilhar usa o mesmo `navigatorShare` do Admin com a mensagem de designação,
quadra, território e link. A alternativa copia a mensagem completa. Se compartilhar
e copiar estiverem indisponíveis, um diálogo permite copiar manualmente ou tentar
novamente. Reenviar reutiliza a assinatura ativa, inclusive após cancelar o envio.
O resultado de geração atualiza imediatamente o estado local; `expirationDate`
alimenta o contador de validade, atualizado a cada segundo. Link vencido para em
zero e permite gerar outro. A revogação fica abaixo dos indicadores do card e exige
confirmação da quadra selecionada.

Nas ruas, os ícones de carro e documento com adição vêm do legado. Os números das
casas usam 20 px. O texto “Prazo encerrado” não ocupa espaço no cartão; o cadeado
e a explicação ao tocar continuam indicando o bloqueio de desmarcação.

Esses ajustes não mudam endpoints, regras de autorização, banco ou worker.

O Início administrativo e a origem de seus indicadores estão documentados em
[`dashboard.md`](dashboard.md).
