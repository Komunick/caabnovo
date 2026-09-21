# Implementation Plan: Parceiros e benefícios: exportação autorizada

**Branch da entrega**: `docs/project-clarify-20260921` | **Data**: 2026-09-21
**Spec**: [spec.md](spec.md) | **Estado**: desenho concluído; implementação/validação pendentes.

## Summary

Aplicar o padrão de exportação aos dados e abas existentes de Parceiros preservando contratos, vigência e publicação.

US1 estabelecimentos, US2 contratos, US3 benefícios, US4 permissões e US5 exportação. Portal, resgate, crédito e coleta externa permanecem fora.

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

- Reutilizar parceiros/serviços do domínio; separar datasets para evitar joins que multipliquem registros. Exportar configurações consultáveis como campos/valores, sem segredos.
- Conferir consulta/edição/publicação e arquivos privados; read+geral libera somente as fontes permitidas. Exportar não renova contrato, aprova, modera ou publica benefício.
- Contratos incluem referência/estado/vigência/condições; documentos apenas metadados autorizados. Histórico conserva autor/data/alterações e motivos históricos sem nova obrigatoriedade.
- Integrar ação em listas e abas do cadastro com contexto e filtros atuais. Aplicar todos os formatos também às unidades/categorias/benefícios/avaliações consultáveis; não deixar botão sem destino em vazio.

Modelo em [data-model.md](data-model.md), interface em [contracts/exports.md](contracts/exports.md)
e [contrato comum](../002-integrated-modules/contracts/direct-exports.md). UI preserva
rascunhos/filtros e dados em falhas, sem exigir justificativa. Catálogo de colunas é
allowlist por função; servidor não confia no catálogo antigo do navegador.

## Project Structure

- `apps/web/modules/partners/partner-service.ts` (existente).
- `apps/web/modules/partners/directory-service.ts` (existente).
- `apps/web/modules/partners/access.ts` (existente).
- `apps/web/modules/partners/ui/partner-list-page.tsx` (existente).
- `apps/web/modules/partners/ui/partner-editor.tsx` (existente).
- `apps/web/modules/partners/export-adapter.ts` e `export-adapter.test.ts` (novos planejados).
- `apps/web/app/(admin)/partners/exportar/page.tsx` (nova planejada).

## Rollout, migração e rollback

Uma entrega/worktree; mudanças SQL aditivas e numeradas coordenadas pela spec001.
Preparar compatibilidade de leitura de chaves/snapshots antes de ativar migrações e
novos botões. Conta sem acesso não ganha concessão para preservar conveniência.
Diagnosticar conflitos antes da restrição008; parar sem corrigir registros automaticamente.
Rollback da UI/API deve preservar grants convertidos, dados e arquivos; não publicar
binário antigo que dependa exclusivamente de audit:export/reports:export após conversão.
Preferir correção compatível para frente; reversão SQL exige plano e evidência próprios.

## Validation e próximo passo

Três formatos por dataset, mesmo filtro/ordem/colunas; leitura sem exportação e exportação sem leitura negadas; documentos/contatos privados preservam seu controle; exportação não muda publicação ou contrato.

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

# Implementation Plan: Parceiros e benefícios

**Branch**: `feature/partners-management` | **Date**: 2026-09-11 | **Spec**: [spec.md](spec.md)
**Base**: origin/dev 9b5bfd3 (integração local em 516b655). Próxima spec existente: 007. Migration 0016, preservando 0015
reservada pela foto de Associados no PR #17.

## Summary

Implementar cadastro administrativo de estabelecimentos, unidades, contratos e benefícios,
com consulta externa mínima por canal. Reutilizar sessão/RBAC, arquivos privados, transação,
idempotência, auditoria e componentes de Associados/Notícias. Sete páginas e seis abas
conforme [interface.md](interface.md); nenhum cadastro duplicado de portal ou login.

## Technical Context

TypeScript 6, Node 24, Next 16.3.4/React 19, Zod, PostgreSQL/pg e componentes compartilhados
já instalados. Storage PostgreSQL bytea/ClamAV/worker existentes. Vitest/contratos,
Testcontainers/PostgreSQL, Playwright e Axe. Web responsiva administrativa e API v1 de leitura.
Paginação de 25 registros e filtros server-side; volumes de produção não presumidos.

## Constitution Check

Antes/depois do desenho: compatível. Sem novo serviço, CMS ou abstração CRUD universal.
Integridade/FKs e concorrência em PostgreSQL; autorização atual em cada operação; documentos
privados, auditoria sem contatos/arquivos completos. Autenticação atual sem MFA segue decisão
explícita do usuário/spec 006; não reintroduzir autenticador. Sem inventar elegibilidade,
conversão ou política de avaliação. Revisão humana sensível no PR, sem merge automático.

## Project Structure

- specs/007-partners-management/: spec, interface, research, plan, data-model, contracts,
  quickstart, tasks, checklist e evidence.
- packages/contracts/src/partners.ts e tests/partners.test.ts.
- packages/db/migrations/0016_partners.sql e tests/migrations.test.ts.
- apps/web/modules/partners/: access, partner-service, http/routes/runtime, ui/.
- apps/web/app/(admin)/partners/: page, new/page, [partnerId]/page, benefits/page.
- apps/web/app/api/v1/partners/[[...path]]/route.ts e benefits/[channel]/route.ts.
- apps/web/modules/files/file-service.ts: guarda do proprietário partner em upload/finalize/download.
- Navegação, matriz individual de acessos e dashboard existentes: incluir Parceiros funcional.
- apps/web/tests/integration/partners.test.ts; tests/e2e/partners.spec.ts.

## Implementation Sequence

### Retomada — 14/09/2026

Aplicar a regra de criação sem justificativa também às categorias, contratos e
rascunhos de benefícios. Contratos e formulários distinguem criação de edição pelo
ID do registro; edições e transições exigem autorização e auditoria, sem motivo obrigatório.
Auditoria de criação usa descrição automática quando não há motivo informado.
Sem migration ou reescrita dos eventos anteriores. Cobrir rejeição de edição sem
motivo, criação sem motivo e trilha de auditoria em contratos, integração e E2E.

### Ajustes no formulário de unidade — 11/09/2026

Adicionar postalCode opcional ao JSON do perfil, sem migration e sem alterar
registros existentes. Consulta pontual ao ViaCEP pelo navegador apenas com os oito
dígitos do CEP, sem credenciais/referrer; timeout, cancelamento e preservação de
campos corrigidos durante a consulta. UF em input com datalist nativo; telefone
normalizado em dígitos no contrato e formatado na interface. Justificativa opcional
somente no comando unit sem unitId; serviço registra descrição automática da criação.
Cobrir contratos, persistência/auditoria e E2E de fixo/celular, CEP, falha e concorrência.

Aplicar também ao parceiro: endereço e CEP opcionais, CNPJ com máscara alfanumérica,
e-mail/site validados ao sair do campo e ao enviar, criação sem motivo obrigatório.
Usar componentes e contratos da branch fix/common-field-validation (spec 001,
tarefas CF01–CF03), em PR separado da implementação específica de Parceiros.
Compor ambos no preview local; não integrar branches ou PRs em dev sem autorização.

### Complemento de 11/09/2026

Reutilizar a worktree/PR 18. Migration 0017 aditiva: categorias normalizadas e vínculo
com parceiro (backfill das categorias existentes), configuração única do app e seleção
por ID estável, avaliações com conteúdo original imutável e estado de moderação.
Manter compatibilidade do profile.category: entradas textuais resolvem a categoria;
renomear atualiza o nome nos perfis sem perder vínculo. A consulta app aplica a
configuração no servidor; default todas preserva comportamento atual, seleção vazia
exibe nenhuma. Nova API de categorias públicas retorna somente categorias elegíveis.
Leituras/escritas administrativas reutilizam autorização transacional, idempotência
e auditoria do módulo; unidades reaproveitam manutenção já existente no detalhe.
Consulta/moderação de avaliações não equivale a implementar o app externo.

Gates: contratos, testes de integração de backfill/vínculos/visibilidade/negações,
E2E de navegação e configuração com efeito real no app, builds e revisão visual.
Atualizar preview composto somente após validar em banco descartável; backup antes
da migration local, sem seed de testes no banco 3107.

1. Spec/pesquisa/checklist e contrato/modelo/tarefas antes do código.
2. Schema/DDL/permissões com testes de CNPJ, limites e banco descartável.
3. Serviço transacional e HTTP; validar sessão atual, propriedade, idempotência e auditoria.
4. Interface de cadastro/unidades; contratos com upload real; benefícios com prévia/publicação.
5. Consulta externa com whitelist e filtros de vigência em cada leitura; testes de canais.
6. Verificação visual e acessibilidade nas sete páginas e aba Avaliações; unidade/integração/E2E/build.
7. PR único para dev com evidências e rollback, corrigindo os próprios gates.

## Complexity Tracking

Correção de navegação solicitada em 11/09/2026: retirar PartnerNavigation do editor,
preservando o retorno à lista e as seções internas. Conferir a separação em criação,
edição e consulta geral no E2E de contatos, incluindo a captura em 390 px.

Retomada de 11/09/2026: concluir estados de consulta do histórico e a distinção visual
entre rascunho e publicação, dentro de T015/T018; cobrir recuperação de falha e edição
privada na jornada T019. O pedido atual autoriza atualizar o preview principal após validação local.

Sem exceções arquiteturais. Quatro entidades próprias; arquivos, histórico e identidade
reutilizados. Estado publicado guarda somente snapshot dos dados da oferta; nenhuma fila
nova é necessária para expirar, pois a leitura revalida vigência no servidor.

## Campos de todo o sistema — 14/09/2026

Consumir a evolução do PR #19. Espalhar brazilianAddressSchema.shape nos perfis JSONB de parceiro/unidade; formatar address no contrato para preservar consumidores públicos. Formulários enviam partes independentes e listagem exibe formato compatível. Sem migration ou backfill. Atualizar os testes de contatos/persistência/legado e todos os gates afetados.


## Regra vigente: nenhuma justificativa obrigatória — 14/09/2026

Atualizar contratos e serviços desta função para aceitar omissão/vazio; manter o campo opcional no contrato para compatibilidade com clientes antigos. Retirar entradas, estados e bloqueios de justificativa das telas. Normalizar ausência para vazio nas colunas históricas não nulas e para null na auditoria; preservar autoria, resultado e datas. Migration aditiva de política retira somente restrições de texto obrigatório, mantendo consistência das decisões. Não são necessários estados especiais de criação de notícia. Cobrir ausência em contratos, autorização, integração e E2E; executar banco/navegador/build no CI com serviços locais desligados.


## Preservação compartilhada — 16/09/2026

Branch fix/scheduling-select-20260916, baseada em dev após PR29. Usar armazenamento temporário
em memória no layout autenticado, por rota/formulário/cadastro, com controles nativos e estado
React preservados. Integrar sucesso/cancelamento aos descartes e testar navegação entre módulos.
Não usar cache público, localStorage ou salvamento automático no banco.

## Checkpoint de revisão de código — 21/09/2026

Administração, unidades, categorias, contratos, benefícios, API pública e moderação implementados. Portal/QR/resgates/coleta externa de avaliações não estão conectados. Não há ação própria de exportação do módulo; DX01 detalha EXP06/EXP07 sem duplicar construção de cadastros existentes.

Revisão estática da base `ed31baf`; nenhum teste de aplicação ou homologação nesta etapa.
Evidências e limites: [revisão transversal](../002-integrated-modules/code-audit-2026-09-21.md).

Executar adequações e seus testes em retomada de implementação. Preservar dados e decisões adiadas; a revisão atual altera somente documentação.

</details>
