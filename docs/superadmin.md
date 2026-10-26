# Super admin integrada

As rotas `/superadmin`, `/superadmin/congregacoes` e `/superadmin/saude` usam a
autenticação do Admin e exigem `super_admin`. O login encaminha esse papel à visão
global; administradores comuns continuam em `/dashboard`. A API verifica o JWT e
as permissões independentemente do middleware e da interface.

O layout global não monta `RequestsProvider`: pendências globais vêm de
`GET /v1/dashboard/usage`, sem polling adicional da congregação do usuário.
A navegação da gestão oferece retorno à visão global e identifica a congregação
do JWT. Sessões de campo continuam independentes.

## Uso e congregações

Padrão: sete dias e agrupamento horário. Filtros de período/congregação são
compartilháveis pela URL. Datas personalizadas exigem início anterior ao fim e no
máximo 366 dias. A API pode ampliar a resolução; a interface mostra a efetiva.
Filtros locais de busca/cidade/UF/situação, ordenação e paginação de 15 registros
não alteram agregados ou a congregação do usuário.

Dispositivos são identidades de navegador, não pessoas únicas. A média é
ponderada por amostras. Atividade significa presença coletada ou alteração de
rodada no período. Cadastros e pendências são o estado atual. A ausência de
amostras aparece como falta de medição e não entra no alerta de inatividade.
As séries deixam lacunas; dados anteriores não aparecem em uma seleção nova.

Atualização automática a cada 30 segundos, suspensa com aba oculta, sem rede ou
pausa explícita. Retomar e atualizar manualmente renovam os dados. Falhas
preservam o último resultado do mesmo filtro, com aviso e nova tentativa.

- `GET /v1/admin/tenants/:id`: cadastro JSON de nome, cidade, UF e telefone.
- `PATCH /v1/admin/tenants/:id`: altera somente esses campos.
- `POST /v1/admin/tenants/switch`, com `Accept: application/json`: atualiza
  **o tenantId persistente do próprio usuário autenticado** e retorna `{ token }`.
  O Admin substitui o cookie e recarrega `/dashboard`. Abas administrativas
  detectam a mudança do token; filtros e consultas não executam essa operação.
- O formulário legado continua recebendo cookie `access_token` e redirecionamento.

## Saúde técnica

`GET /v1/dashboard/monitoring?period=15m|1h|24h|7d` fornece estados de API,
PostgreSQL e Bun, agregados de requisições, p95 aproximado, erros e contexto de
recursos. O período padrão é 24 horas. Infraestrutura é global, sem filtro de
congregação. Operações e esperas de long polling aparecem separadamente.

Falha de consulta não vira latência zero. O histórico anterior do mesmo período
é preservado quando somente o armazenamento técnico falha. CPU/memória/load
do ambiente visível ao processo não representam a quota exclusiva do container.

Configuração, coleta, migration e rollback estão em
`territory-manager-v2/docs/superadmin-monitoring.md` no workspace.

## Verificação

`tests/field/superadmin.spec.ts` cobre login, autorização, escopos, pausa, datas,
cancelamento, erros, edição, troca de token e layout de 360/390/430/1280/1440 px.
Contratos HTTP simulados usam dados QA. Fluxos integrados e mutações devem usar
somente usuários/congregações QA; a suíte da API usa banco isolado.

O painel Handlebars existente permanece disponível como alternativa durante a
validação. Não há redirecionamento de tokens entre domínios nem publicação
automática em produção.
