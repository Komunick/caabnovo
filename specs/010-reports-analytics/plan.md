# Implementation Plan: Relatórios: exportação direta nas três abas

## Privacidade e identidade do rascunho — 07/10/2026-CODEX-mafaltti

Reutilizar WorkspaceDrafts para transportar o comentário em memória, no provider autenticado
identificado por usuário. Vincular o handoff à seleção de destino (href sem comentário), consumir
uma única vez e rejeitar destino divergente/expirado. Remover resíduos da chave legada de
sessionStorage, sem importar seu conteúdo. Colocar AccountMenu no mesmo provider; logout limpa o
cache completo e a troca de identidade remonta o provider. A tela de negação descarta o handoff.

Complemento P1: AdminLayout fornece `initialIdentityId` a WorkspacePermissions. O provider mantém a
identidade observada em `/api/v1/me` separada da identidade do layout em cache. Diferença de id ou
401 desmonta os children, incluindo WorkspaceDrafts, e apresenta o estado curto de sessão em
atualização com `role="status"`. Pedir `router.refresh()` somente no efeito posterior a esse commit;
props antigas não removem o bloqueio. Layout novo e identidade observada precisam coincidir para
remontar o contexto vazio. Polling/foco deduplicam a mesma resposta e ignoram gerações abortadas.
Confirmação da mesma identidade preserva o cache; revalidação de permissões e falhas transitórias
mantêm seu comportamento. Sem BroadcastChannel, persistência ou mudança da autenticação.

ExportScreen recebe valores iniciais suplementares separados da identidade da seleção. O comentário
preenche apenas a criação do rascunho; rascunho existente tem prioridade. initial e context
continuam identificando filtros/colunas/ordenação/formato da origem. Validar componentes reais com
desmontagem/remontagem entre módulos, StrictMode, negação e troca de conta, além de tipos/lint e
regressões dos demais consumidores. Sem nova dependência, migration ou serviço.

Provar também a janela sem refresh, troca entre contas com permissões iguais, formulário já editado,
401, resposta atrasada de geração abortada e preservação da mesma conta. Regressão E2E real usa duas
páginas do mesmo BrowserContext e as contas sintéticas existentes; apenas escrever/listar
localmente, com execução em CI. A validação aprovada de `538e3e9` é anterior ao P1 e não cobre essa
correção; T049 continua aberta até confirmar a nova ponta completa.

## Segunda revisão — 06/10/2026-CODEX-mafaltti

CSV reconhece valores finitos em coluna numérica com gramática numérica estrita; demais valores e
cabeçalhos continuam neutralizados. PDF imprime todos os registros da primeira faixa e repete o
spool privado de valores selecionados para faixas adicionais, com numeração comum, cabeçalhos e
continuações. Não mantém o arquivo inteiro em memória, não corta colunas/linhas e remove o spool.
Arredondamento de contagens usa inteiros exatos para evitar erros binários em meios exatos, com
mesma regra do SQL. Janelas de uso passam a um CTE materializado de quatro agregados condicionais.
Regressões: writers reais/catálogo padrão, segurança CSV, cancelamento/limpeza, contrato de
arredondamento, paridade PostgreSQL e EXPLAIN real. Medição T038 continua pendente, sem promessa de
desempenho em bases grandes. Revalidar tudo após incorporar dev/PR49 na mesma branch aberta.

## Correção do PR46 — 06/10/2026-CODEX-mafaltti

Restaurar análise e barras mensais no PDF executivo conforme decisão do usuário. O adaptador fornece
um writer PDF opcional ao núcleo existente; o cursor devolve metadados internos de séries apenas
nesse modo/formato, excluídos das colunas tabulares. O gráfico usa as mesmas fontes e
reautorizações. Um spool temporário de agregados em diretório privado do sistema mantém memória
constante e é removido no sucesso, erro ou cancelamento; não cria armazenamento permanente nem
guarda o arquivo inteiro. Funil passa a CTE materializado único, sem alterar suas etapas.
Retentativa leva formato validado e notas via sessionStorage; botão na mesma aba evita perder o
comentário em nova aba. Mensagem de acesso negado substitui 404 apenas para autorização. Validar
writers, autorização, paridade PostgreSQL, E2E da retentativa e PDF renderizado.

## Execução de 02/10/2026 — CODEX/SOLICITANTE_NAO_VERIFICADO

Entrega `feature/reports-complete-20261002`, base dev748539d. Concluir Exportar detalhe agrupado,
resumo e evolução sem os limites antigos (CAAB-44) e conferir Exportar análise detalhada sem
agrupamento (CAAB-43), integrantes de Exportar o conjunto completo de dados em Relatórios (CAAB-24).
Reutilizar cursor, snapshot, writers e revalidação do motor integrado; nenhum novo
serviço/migration. Detalhe agrupado usa o mesmo SQL de agrupamento e filtros da tabela, com catálogo
grupo/quantidade. Resumo/evolução usam projeção tabular de indicadores, inventário, séries, contexto
e comentários, com fontes explicitamente autorizadas e revalidadas por lote. Datas de comparação
continuam explícitas, sem teto de duração. A seleção de fontes nunca concede permissões.

Coordenação: Agendamentos4e9abac tem prioridade e controla bookings/migrations0031–0034. Não editar
seu ambiente. Preservar runtime.ts; a extensão renderFilter/initialFilters da sua tela compartilhada
será reutilizada sem substituição dos adaptadores. Em reports.ts, manter a projeção bookings
separada das mudanças de agrupamento, permitindo conciliação com o modelo novo. Documentos
transversais pertencem à terceira frente. Testes técnicos e QA humano são aceites distintos.

**Branch da entrega**: `docs/project-clarify-20260921` | **Data**: 2026-09-21 **Spec**:
[spec.md](spec.md) | **Estado**: desenho concluído; implementação/validação pendentes.

## Summary

Substituir a jornada nova de exportação por filtros/colunas e download direto nas três abas,
preservando métricas, consultas e arquivos antigos.

US1 Resumo gerencial, US2 Análise detalhada, US3 Resultados/evolução; US4 coleta continua existente,
sem alteração de métricas ou integrações externas.

## Technical Context

TypeScript 6.0.3, Node 24, Next 16.3.4, React 19.2.8, Zod 4.5.4 e pg8.23.0 do checkout; PostgreSQL
18 no CI. Monólito modular; banco também armazena arquivos legados. Sem S3/MinIO novo. Testes Vitest
4.1.11, Playwright 1.62.1 e Axe existentes. UI desktop/390 px, temas, teclado e tokens
compartilhados. Exportação incremental com pg-cursor/ExcelJS propostos e PDFKit existente, sujeitos
a spike/versão fixada no código; nenhum pacote instalado agora.

**Performance/escala**: preservar p95 de 2s das telas comuns; não aplicar esse alvo a transferência
integral arbitrária. Exportações não têm teto funcional de registros/período. Aplicar o
[perfil C1 de100 registros](../002-integrated-modules/export-validation-100.md): medir
tempo/recursos e validar integridade, resposta do painel e recuperação. Sem prova de estresse/grande
volume nesta rodada; manter produto sem teto funcional de registros. **Restrições**: banco único,
autorização atual por ação; sem localhost, deploy, seed real, limpeza de dados ou implementação
nesta fase. Q10/Q11 e módulos futuros continuam adiados.

## Constitution Check

Pré-pesquisa: escopo decorre de Q1–Q11 e complementos, sem política institucional inferida.
Pós-desenho: monólito/fonte única, negação por padrão, auditoria mínima, integridade no PostgreSQL e
UI compartilhada preservados. Constituição 2.0.0 concilia justificativas já retiradas; autenticação
continua sem MFA. Abstração de exportação cobre oito consumidores reais, sem CRUD genérico. Não há
violação de desenho sem justificativa. Aprovações institucionais/produção permanecem pendentes;
compatibilidade do desenho não é execução de gates.

## Phase 0 — Research

Decisões, alternativas e fontes em [research.md](research.md), com pesquisa transversal
[de 21/09](../002-integrated-modules/research-2026-09-21.md). Leitura estática conclui as escolhas
necessárias para este recorte; limitações operacionais viram validações de implementação, não
requisitos indefinidos. Sem consulta a contas/dados de produção.

## Phase 1 — Design

- Remover teto 366 dias/50 mil linhas e restrição XLSX só details na configuração de exportação;
  separar schema da consulta visual caso limites de tela continuem necessários. Não adicionar limite
  substituto.
- Corrigir seleção de colunas para mapear a lista ordenada pedida, recusando
  restritas/desconhecidas; não filtrar ordem fixa do catálogo. Remover teto arbitrário de20 se
  catálogo oferecer mais, mantendo validação de tamanho seguro da requisição.
- Adaptador reusa queries/domínios, mas retorna cursor parametrizado em snapshot para detalhado;
  resumo/evolução agregam o conjunto autorizado completo. Dataset bookings exige scheduling:read;
  métricas não viram atendimentos/produtividade.
- Usar core001 e ação direta nas três abas, mantendo filtros, agrupamentos e rascunhos de consulta.
  Não mostrar histórico como etapa para novos downloads; preservar acesso ao histórico legado quando
  já existente.
- Aplicar [U1](contracts/legacy-downloads.md): normalizar chaves antigas, preservar
  propriedade/exigências salvas e complementar pela configuração/gerador original. Arquivos antigos
  com Agendamentos, inclusive resumo/apresentação PR34 sem scheduling:read salvo, exigem essa
  leitura atual. Conteúdo não determinável com segurança nega download; preservar bytes/registros e
  proteger também worker/caminhos genéricos.
- CSV/PDF/XLSX usam mesmo conjunto, sequência de colunas e contexto. Fotografias datadas não
  reconstroem estados históricos inexistentes; novos downloads consultam dados atuais.

Modelo em [data-model.md](data-model.md), interface em [contracts/exports.md](contracts/exports.md)
e [contrato comum](../002-integrated-modules/contracts/direct-exports.md). UI preserva
rascunhos/filtros e dados em falhas, sem exigir justificativa. Catálogo de colunas é allowlist por
função; servidor não confia no catálogo antigo do navegador.

## Project Structure

- `packages/contracts/src/reports.ts` (existente).
- `packages/db/src/repositories/reports.ts` (existente).
- `packages/db/src/repositories/report-storage.ts` (existente).
- `apps/web/modules/reports/http.ts` (existente).
- `apps/web/modules/reports/ui/reports-page.tsx` (existente).
- `apps/worker/src/jobs/report-format.ts` (existente).
- `apps/web/modules/reports/export-adapter.ts` e `export-adapter.test.ts` (novos planejados).
- `apps/web/app/(admin)/reports/exportar/page.tsx` (nova planejada).

A autorização de Agendamentos inclui também métricas, séries, avisos e consulta de cancelamentos em
packages/db/src/repositories/report-summary.ts, não só reportCatalog.bookings; recusar vazamento de
agregados sem scheduling:read.

## Rollout, migração e rollback

Uma entrega/worktree; mudanças SQL aditivas e numeradas coordenadas pela spec001. Preparar
compatibilidade de leitura de chaves/snapshots antes de ativar migrações e novos botões. Conta sem
acesso não ganha concessão para preservar conveniência. Diagnosticar conflitos antes da
restrição008; parar sem corrigir registros automaticamente. Rollback da UI/API deve preservar grants
convertidos, dados e arquivos; não publicar binário antigo que dependa exclusivamente de
audit:export/reports:export após conversão. Preferir correção compatível para frente; reversão SQL
exige plano e evidência próprios.

## Validation e próximo passo

Três abas baixam Excel/CSV/PDF com100 registros sintéticos, inclusive filtros distribuídos por mais
de366 dias, colunas na ordem pedida e dados íntegros; downloads legados seguem U1. Medições e aceite
no [perfil C1](../002-integrated-modules/export-validation-100.md). Não afirmar validação de grande
volume; coleta US4 permanece sem afetar reserva.

Executar roteiro [quickstart.md](quickstart.md) na implementação. Evidência anterior nunca conclui
tarefa nova. Pesquisa/plan encerrados; próximo comando desta solicitação: speckit-tasks, organizado
por história, com dependências e critérios independentes.

## Complexity Tracking

Núcleo comum necessário para aplicações repetidas em oito funções; adaptadores mantêm as regras dos
domínios. Sem microserviço, linguagem nova ou nova fonte de verdade. Estado operacional serve
somente à transferência atual; não é fila/histórico obrigatório.

## Histórico anterior — referência, não sequência executável atual

O conteúdo abaixo preserva decisões/evidências anteriores. Em caso de divergência, valem o desenho
de 21/09 acima e a spec vigente; não reabrir branches/PRs já integrados.

<details>
<summary>Plano anterior preservado</summary>

# Implementation Plan: Relatórios e Análises

**Branch**: `feature/reports-analytics-20260918` | **Date**: 2026-09-18 **Spec**: [spec.md](spec.md)

## Summary

Três abas com consultas autorizadas sobre os mesmos dados, consultas salvas pessoais, exportação
direta Excel/CSV/PDF e métricas próprias minimizadas. Sem conta externa obrigatória. Q6 substitui a
jornada anterior de fila/histórico e os tetos de exportação.

## Technical Context

Base existente: TypeScript/React/Next/PostgreSQL/pg-boss/Zod; XLSX com write-excel-file, PDF com
PDFKit e CSV UTF-8 BOM protegido contra fórmulas. Código integrado ainda gera no worker, limita a 50
mil linhas/366 dias e armazena arquivos. Q6 exige adequação: download direto a partir dos filtros,
três formatos em todas as abas, sem teto funcional de registros/período, sem expiração e sem
histórico obrigatório. Preservar snapshot consistente; paginação da tabela não limita arquivo.
Pesquisar/planejar geração incremental, recursos, interrupção e limites físicos dos formatos antes
de implementar, sem impor cortes ao usuário. Remover restrições do contrato que impeçam o período
solicitado na exportação; eventuais limites exclusivos da tela de consulta não podem limitar os
arquivos.

## Constitution Check

Monólito e fonte de verdade preservados; reports:read e permissão geral de exportação combinadas com
leitura dos domínios; reautorização na geração/download, propriedade de consultas/arquivos; migração
aditiva, jobs idempotentes e auditoria. UI padrão, WCAG AA, dados sintéticos e CI, localhost
desligado. Retenção institucional T089 continua pendente; sem política destrutiva inventada. Hooks
ausentes. Gates de desenho compatíveis; pesquisa independente revisou bibliotecas e bypass de
arquivos.

## Project Structure

- packages/contracts/src/reports.ts: filtros, eventos e formatos.
- packages/db/migrations/0024_reports.sql: eventos, consultas e exportações.
- packages/db/src/repositories/reports*.ts: catálogo, métricas e persistência.
- apps/web/modules/reports/: HTTP, UI e coletor.
- apps/web/app/(admin)/reports/: três abas.
- apps/web/app/api/v1/reports/: endpoints versionados.
- apps/worker/src/jobs/report-export.ts: fila, geração e arquivos.

## Exportação em todos os módulos — decisão transversal

Todos os módulos existentes e futuros deverão oferecer ação visível de baixar/exportar os dados
consultados. Preservar filtros, período, ordenação e campos autorizados, exportando além da página
visual. Q6 define Excel/CSV/PDF para todos, com tela de filtros e download direto, sem prazo ou teto
funcional de quantidade/período. Associados, Notícias, Parceiros/Benefícios, Colaboradores,
Agendamentos, Mensagens, Auditoria/Processamentos e futuros módulos entram na revisão de cobertura.
Não reativar módulos suspensos. Botões nos demais módulos permanecem no backlog 002; atualizar specs
próprios ao implementar. Esta entrega implementa Relatórios.

## Validation

Contratos/unitários, autorização e banco descartável; E2E das três abas, exportações reais,
consultas e coleta SPA; screenshots mobile/desktop/temas e acessibilidade.
Formato/lint/tipos/build/segurança antes de PR para dev, sem merge.

## Histórico dos ajustes da revisão do PR34 — 18/09/2026

O comportamento de fila descrito neste parágrafo é histórico; foi substituído como requisito de
produto por Q6 e ainda precisa de adequação no código. Histórico projeta `retrying` quando
job_execution registra falha e ainda possui tentativas dentro do limite de cinco (execução inicial +
quatro retries). A interface continua polling nesse estado e reserva a ação de nova solicitação à
falha definitiva. Gerar incrementa a revisão da consulta mesmo com filtros iguais. Coleta de
confirmação usa o agendador `after` do Next na fronteira HTTP, injetado na rota para testes; falhas
de agendamento da coleta também não alteram a resposta de negócio. Testes de componente com relógio
controlado, transições reais no PostgreSQL e rota com coleta pendente/rejeitada cobrem os três
casos. CI push e PR devem concluir.

## Clarify de autorização — 21/09/2026

Substituir reports:export pela permissão geral de exportação, mantendo reports:read, leitura dos
domínios e propriedade de arquivos/consultas. A implementação integrada ainda usa reports:export;
migrar catálogo, guardas, worker e download genérico em coordenação com 001 AX01/002 EXP04. Q4
autoriza converter automaticamente a permissão antiga na geral para quem já a possui, habilitando
exportação dos módulos já acessíveis sem alterar leitura. Quem não tinha exportação não recebe pela
conversão. EX01/EX02 pendentes; CI anterior não valida esta decisão nova.

## Adequação à Q6 — 21/09/2026

DX01–DX03 implementam o novo fluxo; manter registros/arquivos legados preservados, sem migration
destrutiva. Não confundir ausência de prazo no download direto com retenção ilimitada de dados de
auditoria/analytics; a política institucional segue separada. Permissão geral + acesso ao
módulo/domínios continua sendo revalidada. Auditoria registra ator, filtros permitidos, formato e
resultado, sem conteúdo do arquivo ou dados pessoais desnecessários. Só documentação nesta etapa.

## Seleção de colunas — Q7 de 21/09/2026

Estender a configuração autorizada de colunas à tela de exportação e aos três formatos, inclusive
resumo/executivo conforme seus dados. Seleção inicial adequada ao módulo/visão; permitir remover e
reordenar campos. Não confundir ordem das colunas com ordenação das linhas. Servidor recusa campos
restritos; validação compara a seleção e ordem nos arquivos Excel/CSV/PDF reais (DX02/DX03).
Implementação pendente.

Q10 de 21/09/2026 confirma adiamento institucional dos prazos de cadastros, documentos e auditoria e
manutenção do descarte automático desligado. Nenhuma retenção permanente é inferida do download
direto (Q6); 001 T089 permanece pendente.

## Checkpoint de revisão de código — 21/09/2026

Versão inicial de três abas, consultas salvas e exportadores implementada. Mantém 50 mil linhas/366
dias, fila e Excel apenas no detalhe; seleção de colunas existe, ordem segue catálogo. EX01/EX02 e
DX01–DX03 permanecem. T025 cobre autorização de Agendamentos também nos resumos/arquivos; T026 cobre
coleta nos consumidores externos ainda não comprovada.

Revisão estática da base `ed31baf`; nenhum teste de aplicação ou homologação nesta etapa. Evidências
e limites: [revisão transversal](../002-integrated-modules/code-audit-2026-09-21.md).

Executar adequações e seus testes em retomada de implementação. Preservar dados e decisões adiadas;
a revisão atual altera somente documentação.

</details>

## Padronização de ações — 22/09/2026

Reutilizar Button/buttonVariants e um cabeçalho compartilhado para os quadros. Mover exportações
existentes de Colaboradores, Auditoria e Relatórios acima dos filtros, mantendo permissões e fluxos
existentes. Remover agrupamento especial do cabeçalho de Colaboradores para seguir a inclusão de
Parceiros/Associados. Validar posição, cores, navegação e responsividade em temas claro/escuro nos
testes existentes.

## Dependência confirmada para publicação — 02/10/2026

A revisão spec008 foi conferida por hashes antes de corrigir notice:cancelled. A base748539d não tem
original_start nem reservas sem horário. Não copiar migrations0031–0034 isoladamente: a versão
combinada deverá manter a projeção bookings de Agendamentos e os helpers/gerador desta entrega e ser
revalidada. Correção preparada no segundo commit, com regressão real T041. Publicação/PR
condicionados aos gates; serviços e merge proibidos.

## Conciliação da branch combinada — 06/10/2026-CLAUDE-Gabriel-Komunick

Autoria CLAUDE, solicitante Gabriel-Komunick. A dependência registrada acima foi atendida na branch
`feature/reports-complete-combined-20261006` (ponta 9c47c5e), que incorpora o PR #43 (ffd8997) e a
dev (b80bf6e, #44) sobre c8a2614, sem copiar migrations isoladamente. A conciliação semântica (T042)
foi feita por leitura: registry com os três grupos de adaptadores, ExportScreen aditivo, projeção
bookings com original_start/procedure_id e profissional opcional, helpers do resumo e gerador
agrupado preservados. Gates locais (tipos, lint, Prettier, unitários e contratos) passaram; SQL real
em PostgreSQL, T041, T038, T039, E2E, acessibilidade e QA humano seguem pendentes e a ponta ainda
não tem CI. Detalhes e limites em [evidência](evidence/plan-2026-09-21-validation.md). A migration
0035 pertence ao PR #45; as listas de migrations de dois testes precisarão incluí-la quando ele
chegar à dev. PR para dev somente depois que o PR #43 estiver na dev, após nova atualização com
`origin/dev`, repetição dos gates e pedido explícito do usuário.
