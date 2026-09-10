# Implementation Plan: Associados

Branch `feature/members-management` · 2026-09-09 · [Spec](spec.md)

## Summary

Cadastro único, dependências históricas, documentos privados e avaliações manuais independentes. Reutilizar fundação, sem login adicional, CMS ou saldo de créditos.

## Technical Context

TypeScript 6, Next/React e Zod nas versões do lockfile; PostgreSQL 18 com pg e migrations SQL. Vitest, Testcontainers, Playwright e axe. Monólito modular Linux/Windows. Listas de 25 e histórico de 50 por página. JSON <=64 KiB; arquivos PDF/JPEG/PNG <=25 MiB na fundação. UTC e exibição America/Bahia. Nenhuma dependência nova.

## Constitution Check

Desenho revisado em 10/09: cinco tabelas, autenticação/arquivos/auditoria reutilizados. Permissões members:read, members:write e members:review, sem novo papel; administrador existente recebe as concessões. Todas são revalidadas no banco em cada operação; arquivos exigem ainda files:read/create. Integridade transacional, avaliações manuais e testes negativos. Credencial é situação/validade, sem emissão institucional. Gates pendentes de execução, sem exceção arquitetural.

## Project Structure

- packages/contracts/src/members.ts: schemas.
- packages/db/migrations/0010_members.sql e src/repositories/members.ts: persistência e resumo para Caassh.
- apps/web/modules/members/: serviço, HTTP e UI.
- apps/web/app/(admin)/members/ e app/api/v1/members/: páginas/API.
- apps/web/tests/integration/members.test.ts e tests/e2e/members.spec.ts: validação.

## Sequência e dependências

US1 cadastro/vínculos → US2 documentos → US3 avaliações → US4 consumidores/navegação → gates/PR. Caassh segue o [handoff](contracts/caassh-handoff.md), sem presumir outra instância ativa. Base atualizada para origin/dev be46efa em 10/09/2026, com Notícias, Configurações, remoção do autenticador e correção de URLs públicas atrás de proxy. PR final contém Associados e os ajustes necessários da fundação para proteger seus arquivos; permanece suspenso até conclusão e revisão funcional solicitada pelo usuário.
