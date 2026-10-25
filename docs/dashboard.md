# Início operacional do Admin

O Início usa apenas contratos existentes e mantém os escopos separados:

- **Congregação:** rodadas abertas (`rounds/info`, estado `open`), casas cadastradas
  aprovadas (`dashboard/territory-details`, campo `total`) e solicitações pendentes
  do `RequestsProvider` já usado pelo sino e pela central administrativa.
- **Rodada selecionada:** progresso de `rounds/info` e designações de
  `territories?round=N`. O seletor oferece somente rodadas abertas e começa pela
  de maior número. Rodadas vazias continuam abertas quando esse é seu estado;
  não se deduz o ciclo de vida pela quantidade de casas ou pela data de término.
- **Histórico da congregação:** `dashboard/marked-houses`, carregado somente ao
  expandir a seção inferior. Contém até quatro categorias e não é apresentado
  como total geral de casas trabalhadas.

O gráfico de progresso reutilizável segue as proporções do Admin, com a rosca à
esquerda e os indicadores à direita. Na área de campo, o compartilhamento fica
no cabeçalho do card; contador, presença e acesso às ruas ficam no rodapé.

## Designações e atenção

Designação ativa exige chave e validade futura. Isso não representa presença
online. O painel reavalia a validade localmente a cada 30 segundos; o botão
“Atualizar painel” renova os dados de rodadas, casas e designações e reinicia o
polling compartilhado de solicitações.

- **Sem designação ativa:** território com casas a fazer e sem link válido;
  ordenar pela quantidade pendente, depois pelo nome em ordem natural.
- **Vencem em até 48 horas:** links ativos com vencimento dentro desse prazo;
  ordenar pelo vencimento, depois pelo nome. Links vencidos não entram nessa lista.
- Cada lista mostra até cinco territórios e informa quando existem outros.
  Os itens e o botão de gestão abrem a página da rodada correspondente, onde
  o administrador pode reenviar, revogar ou gerar links pelos controles existentes.

Trocar a rodada cancela a consulta anterior e impede que seus dados apareçam na
nova seleção. Falhas são apresentadas por seção, com nova tentativa; não viram
contadores zerados. A contagem de solicitações conserva o último valor recebido
quando a sincronização falha e identifica esse estado. Nenhum polling adicional
é criado para esse contador.

Sem rodada aberta, o resumo da congregação permanece e a operação oferece
acesso à gestão. Rodadas sem casas mostram uma rosca vazia e uma explicação;
rodadas concluídas mostram 100%. A classificação de designações usa somente os
territórios e campos disponíveis no endpoint atual para a rodada selecionada.

## Verificação

Os contratos simulados em `tests/field/dashboard.spec.ts` cobrem seleção,
cancelamento, métricas, vencimento, erros independentes, seção de histórico,
ordem do menu e larguras de 360, 390, 430 e 1280 px. A suíte de campo mantém os
fluxos de compartilhamento, marcação e revisão da congregação QA isolada.
