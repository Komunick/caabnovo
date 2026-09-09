# Implementation Plan: Auditoria e Processamentos

**Branch**: `feature/product-direction` | **Date**: 2026-09-09 | **Spec**: [spec.md](spec.md)

## Summary

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
