# Implementation Plan: Parceiros e benefícios

**Branch**: `feature/partners-management` | **Date**: 2026-09-11 | **Spec**: [spec.md](spec.md)
**Base**: origin/dev ab0ad89. Próxima spec existente: 007. Migration 0016, preservando 0015
reservada pela foto de Associados no PR #17.

## Summary

Implementar cadastro administrativo de estabelecimentos, unidades, contratos e benefícios,
com consulta externa mínima por canal. Reutilizar sessão/RBAC, arquivos privados, transação,
idempotência, auditoria e componentes de Associados/Notícias. Quatro páginas e cinco abas
conforme [interface.md](interface.md); nenhum cadastro duplicado de portal ou login.

## Technical Context

TypeScript 6, Node 24, Next 16.3.4/React 19, Zod, PostgreSQL/pg e componentes compartilhados
já instalados. Storage S3-compatible/ClamAV/worker existentes. Vitest/contratos,
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

1. Spec/pesquisa/checklist e contrato/modelo/tarefas antes do código.
2. Schema/DDL/permissões com testes de CNPJ, limites e banco descartável.
3. Serviço transacional e HTTP; validar sessão atual, propriedade, idempotência e auditoria.
4. Interface de cadastro/unidades; contratos com upload real; benefícios com prévia/publicação.
5. Consulta externa com whitelist e filtros de vigência em cada leitura; testes de canais.
6. Verificação visual e acessibilidade nos quatro caminhos; unidade/integração/E2E/build.
7. PR único para dev com evidências e rollback, corrigindo os próprios gates.

## Complexity Tracking

Sem exceções arquiteturais. Quatro entidades próprias; arquivos, histórico e identidade
reutilizados. Estado publicado guarda somente snapshot dos dados da oferta; nenhuma fila
nova é necessária para expirar, pois a leitura revalida vigência no servidor.
