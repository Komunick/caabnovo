# Implementation Plan: Mensagens: revisão de aderência e exportação condicionada

**Branch da entrega**: `docs/project-clarify-20260921` | **Data**: 2026-09-21
**Spec**: [spec.md](spec.md) | **Estado**: desenho concluído; implementação/validação pendentes.

## Summary

Avaliar o protótipo de campanhas/comunicados conforme a finalidade confirmada e planejar exportações sem iniciar canais reais.

Histórias1–7 existentes mantêm significado; US6 valida finalidade; US8 detalha exportação administrativa condicionada à continuidade registrada em M016. Canais/provedores M009/M010 e chat/suporte permanecem adiados.

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

- M016 produz matriz objetivo→tela→estado→evidência e separa lacunas do protótipo; nenhuma evidência antiga é homologação do produto. Registrar resultado e decisão de continuidade antes de executar novas tarefas de construção/exportação.
- Manter messages:access para operações existentes; não inventar permissões separadas de envio. Exportação futura deste recorte exige também exports:generate.
- Exportar campanhas/modelos/públicos como definições e contagens, programações e execuções como estados reais; não transformar contagem em lista de contatos nem afirmar envio/entrega. Filtros de público não concedem acesso completo a Associados.
- A ausência de canal continua estado bloqueado; não conectar provedores, reativar tentativas antigas ou criar tickets/chat. Gate não impede documentar agora adaptador, dados e testes condicionados.

Modelo em [data-model.md](data-model.md), interface em [contracts/exports.md](contracts/exports.md)
e [contrato comum](../002-integrated-modules/contracts/direct-exports.md). UI preserva
rascunhos/filtros e dados em falhas, sem exigir justificativa. Catálogo de colunas é
allowlist por função; servidor não confia no catálogo antigo do navegador.

## Project Structure

- `apps/web/modules/messaging/http/routes.ts` (existente).
- `apps/web/modules/messaging/ui/list-page.tsx` (existente).
- `apps/web/modules/messaging/ui/schedules.tsx` (existente).
- `packages/db/src/repositories/messaging.ts` (existente).
- `packages/contracts/src/messaging.ts` (existente).
- `apps/web/modules/messaging/export-adapter.ts` e `export-adapter.test.ts` (novos planejados).
- `apps/web/app/(admin)/messages/exportar/page.tsx` (nova planejada).

## Rollout, migração e rollback

Uma entrega/worktree; mudanças SQL aditivas e numeradas coordenadas pela spec001.
Preparar compatibilidade de leitura de chaves/snapshots antes de ativar migrações e
novos botões. Conta sem acesso não ganha concessão para preservar conveniência.
Diagnosticar conflitos antes da restrição008; parar sem corrigir registros automaticamente.
Rollback da UI/API deve preservar grants convertidos, dados e arquivos; não publicar
binário antigo que dependa exclusivamente de audit:export/reports:export após conversão.
Preferir correção compatível para frente; reversão SQL exige plano e evidência próprios.

## Validation e próximo passo

Após M016, conferir preparo/segmentação/programação sem envio real; exports respeitam a projeção mínima e formatos/colunas; nenhum botão/tela de chat ou ticket; alterações no protótipo dependem do gate registrado.

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

# Plano — Mensagens

**Decisão vigente — 21/09/2026:** a finalidade de Mensagens foi confirmada: comunicados e campanhas aos associados, com seleção de público e programação. O código existente continua sendo um protótipo, sem homologação do produto. A definição de finalidade substitui a pendência de 17/09; revisão de aderência do protótipo e critérios de continuidade permanecem em M016. Meios, provedores e envio real continuam adiados. Conversa interna do painel e suporte por tickets do app/site são possibilidades de módulos futuros separados, com nomes e funcionamento sujeitos a pesquisa posterior; não estão em implementação.

O plano abaixo registra a construção existente do protótipo. A finalidade foi
confirmada em Q5/M015; revisar aderência do protótipo e critérios de continuidade
em M016 antes de nova construção. Não incluir conversa interna ou tickets neste
módulo; pesquisa e eventual especificação desses candidatos pertencem ao programa 002.

1. Contratos Zod, migrations aditivas 0021/0022 e permissão única com concessão ao papel administrador existente.
2. Repositório transacional compartilhado web/worker: catálogos, campanha versionada, seleção mínima de associados, bloqueios, execuções e auditoria sem corpo da mensagem nem lista de pessoas nos logs gerais.
3. Rotas autenticadas, validação de origem/CSRF, limites de corpo, idempotência por usuário e operação, revalidação de sessão e permissão no banco.
4. Scheduler durável consulta programações vencidas com locks; cancela por acesso revogado e registra bloqueio por ausência de canal. Falhas revertem transação e permitem repetição. Sem dependência de provedor.
5. UI integrada ao painel com modelos, públicos, preferências, editor/prévia/confirmação e histórico. Estado de edição no WorkspaceDrafts por rota/registro.
6. Contratos, integração PostgreSQL descartável, navegador e acessibilidade no CI. Não iniciar serviços nem build/E2E local por preferência do usuário.

Rollback: retirar navegação e handler/worker novos; manter tabelas aditivas e registros. Sem remoção de dados ou mudanças em módulos anteriores.

## Conclusão de formulários

Limpar o cache de inclusão depois da atualização de React, pois useDraftState grava no cache de forma síncrona. Salvar conteúdo de registro existente preserva a programação não confirmada. Duplicar não substitui o cache do registro original. Descarte explícito limpa também o horário não confirmado.

## Evolução de públicos e agendamentos

1. Migration aditiva 0023, cadastro mínimo de segmentação e índices parciais.
2. Contratos compatíveis com públicos antigos, consulta agregada e listas sem teto de 500.
3. Seletores combinados, resumo de audiência e paginação de seleções longas.
4. API/lista de agendamentos e reagendamento com histórico anterior cancelado atomicamente.
5. Testes reais em PostgreSQL descartável no CI, incluindo 100 registros sintéticos; navegador/a11y.

## Checkpoint de revisão de código — 21/09/2026

Protótipo contém campanhas/modelos/públicos, segmentação, preferências e programação. Worker prepara e bloqueia sem canal; não envia mensagens. M016 permanece revisão de produto, M009/M010 adiadas. Exportação própria ainda ausente (DX01), sem ampliar o escopo para chat/tickets.

Revisão estática da base `ed31baf`; nenhum teste de aplicação ou homologação nesta etapa.
Evidências e limites: [revisão transversal](../002-integrated-modules/code-audit-2026-09-21.md).

Executar adequações e seus testes em retomada de implementação. Preservar dados e decisões adiadas; a revisão atual altera somente documentação.

</details>

## Compatibilidade com os cargos I1 — 21/09/2026

Gestor deve consultar Mensagens e exportar dados autorizados, sem receber edição/preparação por efeito de messages:access. O desenho anterior de chave única não basta para essa distinção: revisar guardas por operação e contrato em coordenação com001 T114 e M016/T003. Administrador conserva acesso completo às funções disponíveis; canais/envio real permanecem adiados. Não presumir homologação ou ultrapassar o gate de continuidade.
