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


## Regra vigente: nenhuma justificativa obrigatória — 14/09/2026

Atualizar contratos e serviços desta função para aceitar omissão/vazio; manter o campo opcional no contrato para compatibilidade com clientes antigos. Retirar entradas, estados e bloqueios de justificativa das telas. Normalizar ausência para vazio nas colunas históricas não nulas e para null na auditoria; preservar autoria, resultado e datas. Migration aditiva de política retira somente restrições de texto obrigatório, mantendo consistência das decisões. Não são necessários estados especiais de criação de notícia. Cobrir ausência em contratos, autorização, integração e E2E; executar banco/navegador/build no CI com serviços locais desligados.

## Retirada do armazenamento legado — 15/09/2026

Retirar parâmetros/cliente S3 do job de exportação; adaptar regressão de repetição para consultar os bytes privados do banco e verificar redação e uma única cópia. Validação coordenada pela SR03 da fundação.
