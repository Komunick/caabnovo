# Evidências — Relatórios e Análises

Entrega em `feature/reports-analytics-20260918`, sobre `dev` 8f12db4. PR [34](https://github.com/Komunick/caabnovo/pull/34).
Validação com dados sintéticos. Localhost, banco e preview principais permaneceram desligados.

## Gates e regressão

Revisão P2 recebida após afe7b8d corrigida em **0eed68e**. Ambos os CIs concluídos
com sucesso, sem cancelamentos: [push](https://github.com/Komunick/caabnovo/actions/runs/35383512012)
e [PR](https://github.com/Komunick/caabnovo/actions/runs/35383516873).
360 testes unitários, 122 contratos, 217 integrações, 81 E2E, dois testes focados de
Relatórios e seis de acessibilidade; formatação, lint, tipos, build e segurança aprovados.

- Interface: três testes novos verificam renovação do indicador com filtros iguais,
  polling até disponibilizar download após retry e parada apenas na falha definitiva.
- Rota de reserva: três testes verificam resposta 201 antes da coleta pendente,
  rejeição posterior da coleta, falha do agendador e ausência de coleta para reserva rejeitada.
- Banco: cenário adicional usa o papel restrito, percorre as cinco tentativas e
  confirma sucesso posterior com arquivo real disponível. Falhas temporárias são
  apresentadas como `retrying`, mantendo a política existente do worker.

Commit posterior apenas registra estas evidências e conclui as tarefas da revisão.

- Formatação, lint e typecheck locais aprovados. A execução local completa de unidade/contratos
  encontrou um erro de ambiente do Node/Windows (`uv_os_get_passwd ENOMEM`) em subprocesso
  de um teste preexistente; a mesma suíte passou integralmente no CI Linux.
- [CI da implementação 578fd63](https://github.com/Komunick/caabnovo/actions/runs/35356554299):
  qualidade e segurança aprovadas. 354 testes unitários, 122 de contrato e 216 de
  integração aprovados. Inclui seis testes de relatórios com PostgreSQL descartável
  e papel `caab_runtime`, migrations aplicadas duas vezes, tooling de branches e
  build de produção.
- Navegador aprovado no mesmo CI: dois testes focados de Relatórios, 81 E2E da suíte
  completa e seis testes de acessibilidade. Todos os jobs concluíram com sucesso.
  Esse resultado documenta a implementação anterior à revisão P2; não substitui
  a validação das correções posteriores.

## Casos cobertos

Contratos: datas reais, intervalo de até 366 dias, limites de período e comparação
anterior, campos/ordenação permitidos, rejeição de propriedades pessoais arbitrárias.

Banco/worker: 65 pessoas sintéticas, filtro de cidade com 55 linhas e segunda página
com cinco; exportação completa além da paginação; filtros de situação exatos;
agrupamento e ordenação; base atual separada do período; consultas pessoais com
concorrência por versão; rollback se a fila falhar; idempotência por proprietário;
lock concorrente sem ampliar grants; PDF/XLSX reais e CSV protegido contra fórmulas.
Download alheio negado, permissão revogada bloqueia geração/download e a rota genérica
de arquivos não contorna o bloqueio.

Métricas: duplicação de evento não altera contagem, visitante/sessão/conta distintos,
ambientes separados, funil com etapas em sequência e nenhuma conta crua armazenada.
HTTP: leitura sem autenticação/permissão negada antes de consultar; leitura de domínio
não é concedida por reports:read; identidade e confirmação de reserva não são aceitas
do cliente do painel.

Navegador: três abas, estado vazio, consultas salvas, navegação e rascunhos, downloads
CSV/XLSX/PDF, coleta de uso, apresentação/Escape, desktop/mobile, claro/escuro e Axe
WCAG 2.2 AA. Edição concorrente retorna mensagem específica e preserva o rascunho;
cancelar permite abrir a versão atualizada. Cada download é associado ao identificador
da solicitação nova, sem reutilizar arquivos anteriores. Ver resultado final do CI
e artefato `reports-synthetic-evidence`.

## Revisão visual

PDFKit executado diretamente com massa sintética e PDFs renderizados para PNG com
PyMuPDF, sem subir servidor local. Seis páginas revisadas: detalhamento de 55 registros
com oito colunas em quatro páginas paisagem e executivo com comentários/gráfico em
duas páginas retrato. Acentos, cabeçalhos, numeração e tabelas legíveis; corrigida a
fonte da primeira linha após quebra de página. Arquivos temporários ficam na cache.

Capturas de Análise detalhada e Resultados e evolução do CI revisadas: cabeçalho, abas,
campos, navegação e tokens seguem o padrão do painel. Desktop claro de 1440 px e mobile
escuro de 390 px revisados, sem transbordamento horizontal. PDF vazio baixado pelo
navegador também revisado; mensagem alinhada abaixo da tabela e novamente renderizada
após correção. XLSX inspecionado como pacote íntegro com abas Dados/Contexto; CSV
confere cabeçalho, filtros, ambiente e fuso. As imagens ficam no artefato do CI e na
cache da worktree; não contêm dados pessoais reais.

Artefato final `reports-synthetic-evidence` do CI acima baixado e conferido: CSV com
34 registros, XLSX com 35 linhas incluindo cabeçalho e PDF com duas páginas, ambas
renderizadas e revisadas. As capturas finais são `reports-desktop-light.png` e
`reports-mobile-dark.png`. A execução focada também cobriu arquivos sem registros;
a integração cobre 55 linhas exportadas além da página visual de 50.

## Limites de entrega

Sites/app externos ainda exigem integração nos seus próprios backends; não há coletor
instalado nesses projetos nem histórico retroativo. O painel começa a coletar após
implantação. Sem ranking individual de produtividade, receitas ou impacto inferidos.

Arquivo: até 50 mil linhas e consulta de até 366 dias, erro explícito acima do limite.
Política institucional de retenção segue pendente (T089 do programa 002). Exportação
nos demais módulos foi planejada em EXP01–EXP03; seus botões não foram implementados
nesta entrega. Homologação em DEV e revisão humana de permissões/coleta permanecem
responsabilidades de entrega posteriores ao PR. Nenhum merge/deploy foi executado.

Rollback: retornar aplicação/worker ao código anterior, preservando tabelas e arquivos;
interromper consumo da fila report-export. Não apagar dados nem reverter a migration
com operação destrutiva.
