# Implementation Plan: Auditoria e Processamentos: exportação direta

**Branch da entrega**: `docs/project-clarify-20260921` | **Data**: 2026-09-21
**Spec**: [spec.md](spec.md) | **Estado**: desenho concluído; implementação/validação pendentes.

## Summary

Exportar eventos e processamentos nos três formatos, preservando redação, separação de permissões e arquivos legados.

US1 descoberta por subárea; US2 continuidade; US3 consultas/reenvios existentes; US4 histórico legível preservado; US5 exportação.

## Technical Context

TypeScript 6.0.3, Node 24, Next 16.3.4, React 19.2.8, Zod 4.5.4 e pg8.23.0 do checkout;
PostgreSQL 18 no CI. Monólito modular; banco também armazena arquivos legados. Sem S3/MinIO
novo. Testes Vitest 4.1.11, Playwright 1.62.1 e Axe existentes. UI desktop/390 px, temas,
teclado e tokens compartilhados. Exportação incremental com pg-cursor/ExcelJS propostos
e PDFKit existente, sujeitos a spike/versão fixada no código; nenhum pacote instalado agora.

**Performance/escala**: preservar p95 de 2s das telas comuns; não aplicar esse alvo a
transferência integral arbitrária. Exportações não têm teto funcional de registros/período.
Aplicar o [perfil C1 de100 registros](../002-integrated-modules/export-validation-100.md):
medir tempo/recursos e validar integridade, resposta do painel e recuperação. Sem prova
de estresse/grande volume nesta rodada; manter produto sem teto funcional de registros.
**Restrições**: banco único, autorização atual por ação; sem localhost, deploy, seed real,
limpeza de dados ou implementação nesta fase. Q10/Q11 e módulos futuros continuam adiados.

## Constitution Check

Pré-pesquisa: escopo decorre de Q1–Q11 e complementos, sem política institucional inferida.
Pós-desenho: monólito/fonte única, negação por padrão, auditoria mínima, integridade no
PostgreSQL e UI compartilhada preservados. Constituição 2.0.0 concilia justificativas já
retiradas; autenticação continua sem MFA. Abstração de exportação cobre oito consumidores
reais, sem CRUD genérico. Não há violação de desenho sem justificativa. Aprovações
institucionais/produção permanecem pendentes; compatibilidade do desenho não é execução de gates.

## Phase 0 — Research

Decisões, alternativas e fontes em [research.md](research.md), com pesquisa transversal
[de 21/09](../002-integrated-modules/research-2026-09-21.md). Leitura estática conclui
as escolhas necessárias para este recorte; limitações operacionais viram validações
de implementação, não requisitos indefinidos. Sem consulta a contas/dados de produção.

## Phase 1 — Design

- Manter audit:read e jobs:read separados; exports:generate sozinho não abre a área. Seleção de subárea define fonte e autorização, nunca exigir ambas.
- Adaptador consome repositórios audit-query/job-execution e a mesma redação autorizada da interface. Filtros período/ator/ação/entidade ou tipo/estado, ordenação estável timestamp+ID, sem página/limit no conjunto exportado.
- Novos botões usam fluxo comum Excel/CSV/PDF; auditoria JSONL/fila/download assinado existentes tornam-se compatibilidade legada, sem eliminar jobs/arquivos nem o endpoint antigo.
- Converter autorização do worker e download legado para chave geral preservando propriedade, auditoria e demais controles. Exportar Processamentos não concede reenvio.
- Writer deve suportar campos históricos longos e valores redigidos, com contagem de registros lógicos; nunca exportar payload bruto/segredos por selecionar uma coluna.

Modelo em [data-model.md](data-model.md), interface em [contracts/exports.md](contracts/exports.md)
e [contrato comum](../002-integrated-modules/contracts/direct-exports.md). UI preserva
rascunhos/filtros e dados em falhas, sem exigir justificativa. Catálogo de colunas é
allowlist por função; servidor não confia no catálogo antigo do navegador.

## Project Structure

- `apps/web/modules/audit/audit-export-service.ts` (existente).
- `apps/web/modules/audit/ui/audit-export-dialog.tsx` (existente).
- `packages/db/src/repositories/audit-query.ts` (existente).
- `packages/db/src/repositories/job-execution.ts` (existente).
- `apps/worker/src/jobs/audit-export.ts` (existente).
- `apps/web/modules/audit/export-adapter.ts` e `export-adapter.test.ts` (novos planejados).
- `apps/web/app/(admin)/audit/exportar/page.tsx` (nova planejada).

## Rollout, migração e rollback

Uma entrega/worktree; mudanças SQL aditivas e numeradas coordenadas pela spec001.
Preparar compatibilidade de leitura de chaves/snapshots antes de ativar migrações e
novos botões. Conta sem acesso não ganha concessão para preservar conveniência.
Diagnosticar conflitos antes da restrição008; parar sem corrigir registros automaticamente.
Rollback da UI/API deve preservar grants convertidos, dados e arquivos; não publicar
binário antigo que dependa exclusivamente de audit:export/reports:export após conversão.
Preferir correção compatível para frente; reversão SQL exige plano e evidência próprios.

## Validation e próximo passo

Perfis só eventos e só jobs exportam apenas sua subárea; matriz geral+leitura; campos redigidos e colunas reordenadas nos três formatos; downloads legados continuam protegidos.

Executar roteiro [quickstart.md](quickstart.md) na implementação. Evidência anterior
nunca conclui tarefa nova. Pesquisa/plan encerrados; próximo comando desta solicitação:
speckit-tasks, organizado por história, com dependências e critérios independentes.

## Complexity Tracking

Núcleo comum necessário para aplicações repetidas em oito funções; adaptadores mantêm
as regras dos domínios. Sem microserviço, linguagem nova ou nova fonte de verdade.
Estado operacional serve somente à transferência atual; não é fila/histórico obrigatório.

## Histórico anterior — referência, não sequência executável atual

O conteúdo abaixo preserva decisões/evidências anteriores. Em caso de divergência,
valem o desenho de 21/09 acima e a spec vigente; não reabrir branches/PRs já integrados.

<details>
<summary>Plano anterior preservado</summary>

# Implementation Plan: Auditoria e Processamentos

**Branch**: `feature/product-direction` | **Date**: 2026-09-09 | **Spec**: [spec.md](spec.md)

## Summary

### US3 — execução em 15/09/2026

Branch feature/processamentos-20260915, criada separadamente a pedido do usuário.
Evoluir contrato Zod de consulta/retorno, mover consulta ao repositório existente e
validar permissões antes de toda consulta/mutação. Cursor timestamp UTC com seis casas
e UUID, comparados como tupla no PostgreSQL; buscar limit+1 para indicar continuação.
Formulário GET com Next Form, filtros de estado/tipo, próxima página e primeira página;
URL inválida recebe aviso com recuperação, sem consultar lista irrestrita silenciosamente.
Não criar endpoint de lista: a página usa o serviço autorizado existente. Sem migration.
Regressões unitárias/contrato, banco descartável com mais de 100 linhas e microssegundos,
reenvio negado sem efeitos, reenvio permitido/rollback/concorrência, navegador e a11y.
Executar build, integração e navegador no CI. Sem justificativa obrigatória.

Centralizar catálogo de áreas repetido em menu, busca e dashboard. Rotas de jobs em `/audit/jobs`,
subnavegação Eventos/Processamentos e redirecionamentos das rotas existentes. Serviços/APIs
inalterados.

## Technical Context

TypeScript/Next.js/React existentes; PostgreSQL sem mudança. Lucide para ícones e Link para
navegação. Vitest para seleção por perfil; Playwright/Axe para jornadas afetadas. Alvo web
responsivo. Sem dependência externa nova nem consulta ao legado. Escala/latência preservadas da
fundação.

## Constitution Check

Três repetições reais justificam catálogo único. Fusão é visual, serviços continuam separados.
Guardas de página/API mantidas; layout não exige audit:read globalmente. Sem permissão ampliada,
migration ou alteração de main. PR próprio autorizado pelo usuário. Resultado: compatível
antes/depois do desenho.

## Project Structure

- `apps/web/modules/workspace/areas.ts`: catálogo, filtro por permissão e rota ativa.
- `modules/auth/ui/authorized-nav.tsx`, `components/workspace-controls.tsx`, `app/(admin)/page.tsx`:
  consumidores.
- `app/(admin)/audit/layout.tsx`, `modules/audit/ui/audit-navigation.tsx`: subnavegação.
- `app/(admin)/audit/jobs/`: páginas canônicas; `operations/jobs/`: redirects.
- `modules/workspace/areas.test.ts` e `tests/e2e/`: regressões da mudança.

## Complexity Tracking

Sem exceções. Detalhes, lista e exportações reutilizados; não copiar serviços nem refazer banco.

## Evolução registrada em 09/09/2026

US3 atualiza esta função, sem novo spec. Antes de implementá-la, complementar research.md com
práticas atuais de consulta operacional; definir cursor estável por created_at/id e filtros no
contrato existente de jobs. Repositório, serviço e página de Processamentos serão atualizados em
conjunto. Reenvio verificará jobs:read e jobs:redrive antes da mutação. Validar negação sem efeitos
colaterais e paginação com mais de 100 registros. Nenhuma mudança desta fase foi aplicada ainda.


## Regra vigente: nenhuma justificativa obrigatória — 14/09/2026

Atualizar contratos e serviços desta função para aceitar omissão/vazio; manter o campo opcional no contrato para compatibilidade com clientes antigos. Retirar entradas, estados e bloqueios de justificativa das telas. Normalizar ausência para vazio nas colunas históricas não nulas e para null na auditoria; preservar autoria, resultado e datas. Migration aditiva de política retira somente restrições de texto obrigatório, mantendo consistência das decisões. Não são necessários estados especiais de criação de notícia. Cobrir ausência em contratos, autorização, integração e E2E; executar banco/navegador/build no CI com serviços locais desligados.

## Retirada do armazenamento legado — 15/09/2026

Retirar parâmetros/cliente S3 do job de exportação; adaptar regressão de repetição para consultar os bytes privados do banco e verificar redação e uma única cópia. Validação coordenada pela SR03 da fundação.

## T014 — Plano de implementação, 15/09/2026

Adicionar catálogo único de ações/tipos e apresentação derivada no serviço de consulta, sem alterar o writer ou exportador. Consultar apenas id/name de colaboradores e perfis em lotes por página, após audit:read e sob users:read/roles:read. Acrescentar apresentação opcional ao contrato para compatibilidade. A tabela exibe frases e mudanças reconhecidas; dados técnicos ficam em details. Filtros usam select com rótulos e preservam opções desconhecidas de URLs antigas. Validar funções puras, consulta/autorização com PostgreSQL real no CI e E2E com evidência visual sintética; manter servidores locais desligados.

Atualização do usuário: reativar localhost:3107 para revisão com uso reduzido de recursos. Preservar o banco existente, sem seeds; executar apenas web compilada e PostgreSQL limitado, mantendo worker/scanner pausados. Compilar no CI e conservar artefato temporário por três dias para evitar compilação no PC de 8 GB. Origem, processos e limites ficam no mapa local fora do PR. Esta autorização substitui a suspensão anterior dos servidores.
## T014 — reformulação após feedback de 15/09/2026

Reaproveitar serviço de apresentação e traduções; enriquecer contrato opcional com autoria/alvo e diferenças permitidas. Reutilizar Dialog Radix para detalhe lateral e foco, sem nova dependência. Substituir tabela/expansões por lista semântica agrupada por dia. Filtros agrupam ações por área, oferecem períodos rápidos e busca paginada de autores pelo nome com endpoint específico que devolve somente id/name e exige ambas as permissões. A seleção continua enviando actorId, compatível com exportação e links existentes. Dados técnicos ficam recolhidos no detalhe. Testar busca restrita, paginação, estados vazios, seleção e Escape/foco, largura mobile, filtros combinados e exportação. Build/E2E exclusivamente no CI; reusar artefato compilado no preview limitado.

Identificação dos alvos: consultar nomes de associado/convênio, título de notícia e nome de arquivo
em lote por página; exigir leitura da área e, para arquivo, também files:read e área proprietária.
A consulta cruza permissões recebidas com concessões atuais e sessão ativa; nenhuma busca de
contatos ou reconstrução de valores históricos. Cobrir revogação, sessão encerrada e nome indisponível.

## Correção de sobreposição — 16/09/2026

Incluída por pedido do usuário no ciclo fix/scheduling-ui-20260916, mantendo spec própria. Elevar a camada compartilhada do backdrop acima do cabeçalho20/menu60 e o diálogo acima do backdrop (80/90). Não modificar autenticação/dados. Cobrir o empilhamento real por elementsFromPoint no teste de abertura de log, foco/Escape e capturas de desktop/mobile. Gates no CI.


## Preservação compartilhada — 16/09/2026

Branch fix/scheduling-select-20260916, baseada em dev após PR29. Usar armazenamento temporário
em memória no layout autenticado, por rota/formulário/cadastro, com controles nativos e estado
React preservados. Integrar sucesso/cancelamento aos descartes e testar navegação entre módulos.
Não usar cache público, localStorage ou salvamento automático no banco.

## Permissão geral de exportação — 21/09/2026

Adequar autorização de exportação à permissão geral, preservando leitura da subárea,
redação, propriedade e controles de servidor. Converter automaticamente a permissão
antiga na geral para quem já a possui, coordenando 001 AX01/002 EXP04 sem alterar leitura. O desenho original sem mudança de permissões é histórico
da fusão; esta evolução permanece documental, com EX01/EX02 pendentes.

## Exportação direta — Q6 de 21/09/2026

FR-011 aplica o fluxo transversal à subárea autorizada: ação nomeada, tela com
filtros pertinentes e Excel/CSV/PDF com download direto, sem limite funcional de
registros/período, prazo ou fila/histórico obrigatório. JSONL/jobs descritos em
incrementos anteriores documentam o código existente e não limitam o novo requisito.
Preservar eventos, redação, autorização e dados legados. Planejar volume/formatos
em coordenação com 002 EXP06/EXP07; sem implementação neste clarify.

Q7: seletor de campos autorizados e ordenação de colunas na tela de exportação,
com seleção inicial adequada à subárea. Excel/CSV/PDF respeitam exatamente a seleção
e ordem; manter redação e validação de campos no servidor. DX01/DX02 pendentes.

## Checkpoint de revisão de código — 21/09/2026

Eventos/Processamentos e reenvio existem. Exportação atual é JSONL por fila, não Excel/CSV/PDF direto. Worker não revalida permissões; download genérico de audit_export passa com files:read. EX01/EX02 devem fechar esses caminhos além da migração para permissão geral; DX01/DX02 permanecem pendentes.

Revisão estática da base `ed31baf`; nenhum teste de aplicação ou homologação nesta etapa.
Evidências e limites: [revisão transversal](../002-integrated-modules/code-audit-2026-09-21.md).

Executar adequações e seus testes em retomada de implementação. Preservar dados e decisões adiadas; a revisão atual altera somente documentação.

</details>
