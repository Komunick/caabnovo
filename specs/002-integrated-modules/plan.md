# Implementation Plan: Módulos integrados CAAB

**Branch**: `feature/product-direction` | **Date**: 2026-09-09 | **Spec**: [spec.md](spec.md)
**Input**: Todos os módulos no escopo, reutilização da fundação e início imediato por US1.

## Summary

Escopo integrado em monólito modular. PRs acompanham funções/specs concluídos, conforme orientação
de 09/09/2026. Começar pela fusão de navegação Auditoria/Processamentos, sem migração nem ampliação de
permissões. Demais domínios seguem dependências e regras institucionais definidas, nunca inventadas.

## Technical Context

**Language/Version**: TypeScript 6, Node.js 24, SQL PostgreSQL. **Primary Dependencies**: Next.js
16.3.4, React 19, Better Auth, Zod, pg, pg-boss, Radix e Lucide existentes. Payload/Lexical
permanecem previstos; compatibilidade/integração são tarefa de US2. **Storage**: PostgreSQL, storage
S3-compatible, ClamAV e worker existentes. **Testing**: Vitest, contratos, PostgreSQL descartável,
Playwright e Axe. **Target Platform**: Web desktop/tablet/móvel; servidor e worker; DEV sintético.
**Project Type**: Administrativo e portal restrito com contratos versionados. **Performance Goals**:
Alvo do PRD de p95 de 2s em telas comuns; paginação server-side e jobs para trabalho demorado.
**Constraints**: Sem legado, cadastros/serviços duplicados, permissão ampliada, produção ou PR
preliminar. **Scale/Scope**: Dez histórias; volumes reais ainda não fornecidos.
[MODULES.md](../../docs/MODULES.md) define responsabilidades.

## Constitution Check

- KISS/DRY: catálogo de áreas centraliza três repetições reais (menu, busca, dashboard); sem CRUD
  universal.
- Domínios separados: fusão visual não mistura eventos imutáveis com execução de jobs.
- PostgreSQL: transações/idempotência/constraints para reservas, lotes e créditos.
- Segurança: guardas por operação; documentos por proprietário; portal por organização.
- Auditoria/privacidade: mesma trilha append-only; descarte depende de T089.
- Integrações: contratos explícitos; estado desconhecido não vira decisão institucional.
- Acessibilidade: testes das mudanças efetivas; sem repetição da validação manual do PR #10.
- Entrega: branch de trabalho, PR por função concluída com documentação/testes, main fora do escopo.

Resultado antes/depois do desenho: compatível. US1 pronta para início. Histórias de negócio têm
tarefas de definição institucional antes das operações dependentes; não se presume aprovação.

## Project Structure

### Documentation (this feature)

`specs/002-integrated-modules/`: spec, plan, research, data-model, contracts, quickstart, tasks e
checklist.

### Source Code

```text
apps/web/modules/
  workspace/                         # catálogo único
  auth/ users/ files/ audit/ jobs/    # reaproveitados
  news/ members/ scheduling/ partners/ employees/
  messaging/ credits/ partner-portal/ reports/
apps/web/app/(admin)/audit/jobs/[jobId]/
apps/web/app/(admin)/operations/jobs/[jobId]/ # compatibilidade
apps/web/app/(partner)/              # portal planejado, escopo próprio
apps/web/app/api/v1/                 # contratos versionados
apps/worker/src/jobs/                # handlers por domínio, mesma fila
packages/contracts/src/              # schemas/OpenAPI
packages/db/migrations/              # migrations aditivas
packages/db/src/repositories/        # persistência por domínio
```

**Structure Decision**: Reutilizar estrutura real; diretórios novos são destinos planejados, não
módulos já implementados. Sem packages ou tabelas genéricas para antecipar abstrações.

## Implementation Sequence

### Agendamentos — direção vigente em 15/09/2026

Brainstorming/pesquisa: CAAB administra pelo painel a oferta de reservas do app/site.
Qualquer pessoa com acesso válido ao painel pode fazer alterações em Agendamentos,
sem concessão extra do módulo. Cadastro de unidades com vários serviços, profissionais,
procedimentos, funcionamento e gestão de avaliações são parte do escopo confirmado.
Não pressupor portal administrativo independente para profissionais/negócios.

Próximos passos: revisar a [pesquisa complementar](pesquisa-gestao-agendamentos-2026-09-15.md),
validar serviço/procedimento e vínculos, detalhar horários/exceções, ações de avaliações,
consumo no app/site, público elegível e preservação de dados. Depois consolidar spec
própria, plano, tarefas e critérios de aceite. As tarefas de implementação antigas
permanecem suspensas; não definir prazos, multas, bloqueios ou telas como aprovados.

Avaliar solução própria com a base existente. Cal.com é somente referência e não
deve ser integrado salvo se nenhuma outra possibilidade for encontrada. Registrar
alternativas e impedimentos concretos caso essa condição venha a ser investigada.
Não criar integração, dependência ou serviço nesta pesquisa.

### Prioridade vigente — 14/09/2026

Histórico; aplicar as decisões de 15/09 acima onde houver divergência.

Etapa atual limitada a pesquisa de mercado e documentação por solicitação expressa.
Recorte: barbearia, medicina, futevôlei, fisioterapia, psicologia, spa e zumba;
restaurantes somente como possibilidade futura. Consultar o relatório de pesquisa
antes de retomar o brainstorming. Não produzir implementação durante esta etapa.

Reabrir o levantamento de **Agendamentos** antes de produzir sua spec funcional ou código.
As propostas anteriores de US4 não definem a grande evolução solicitada pelo usuário.
Registrar fluxo atual, problemas e decisões no brainstorming deste programa; depois
consolidar uma spec própria com plano, tarefas e critérios de aceite.

**CAASSH: desativado — pendente de revisão.** Suspender US8/T041–T045 e suas
dependências de crédito. Atualizar apenas a indicação no painel e o planejamento;
não existem operações implementadas para desligar. Preservar o contrato de leitura
de Associados como referência histórica. Não há migration ou exclusão de dados.

As alterações permanecem na única branch ativa, ainda sem PR. Otimização da navegação
continua registrada separadamente; o brainstorming definirá o escopo de Agendamentos.

Cada funcionalidade possui spec próprio, plano e tarefas antes do código. Este é o mapa geral de
dependências, não um spec único para todas as implementações. A fusão inicia em
[003-audit-operations](../003-audit-operations/plan.md). Correções e melhorias, inclusive
paginação/filtros de jobs e pré-condição de reenvio, atualizam o spec existente da função. Notícias
é uma função nova, detalhada em [004-news-publishing](../004-news-publishing/plan.md).

1. Consolidar escopo/reaproveitamento e iniciar US1: catálogo, subnavegação, rotas canônicas de
   jobs, compatibilidade e testes. Serviços e APIs existentes mantidos.
2. US2 e US6: Conteúdo e Equipe reaproveitam autenticação/arquivos; verificar CMS e política
   editorial.
3. US3 e US5: Pessoas e Benefícios estabelecem identidades, vínculos e condições.
4. US4: Oferta/disponibilidade e operação de atendimentos sobre Pessoas; concorrência em banco real.
5. US7, US8 e US9: Mensagens, Créditos e Portal sobre cadastros e políticas confirmados.
6. US10: Pendências e relatórios dos registros reais dos domínios.
7. Validar cada função antes do seu PR; concluir validação cruzada de US1–US10 antes de liberar o conjunto.

Cada história segue contrato/modelo → testes de invariantes → serviço → UI → integração → evidência.
O usuário autorizou começar a implementação enquanto o plano completo é mantido, sem aguardar regras
de módulos independentes. Não tratar navegação vazia como entrega funcional.

## Complexity Tracking

Nenhuma exceção arquitetural. O tamanho da entrega foi solicitado; tasks.md preserva
rastreabilidade.

# Colaboradores, Usuários e Parceiros: decisão de escopo

Confirmado pelo usuário em 11/09/2026: Colaboradores no sistema antigo corresponde à
atual gestão de Usuários. Parceiros representa externos, como estabelecimentos e conveniados.
Não haverá módulo separado de equipe interna/RH.

A interpretação anterior de Colaboradores como cadastro de setor, cargo e situação funcional
foi descartada. COL-001–COL-005 e T032–T035 do programa 002, como definidos para RH,
foram retirados do escopo; não são tarefas implementadas.

A interface adota **Colaboradores** na mesma gestão de contas, rotas `/users`, identificadores
e permissões existentes. Menu, catálogo, busca, cabeçalho, página, ações e mensagens usam
o nome Colaboradores. A busca também reconhece o termo Usuários. Não há novo cadastro,
API ou migration para essa renomeação.

Esta decisão substitui as propostas anteriores de cadastro funcional separado no programa
002 e no PRD. Dependências de US6 usam a gestão de contas/RBAC existente.


## Regra vigente: nenhuma justificativa obrigatória — 14/09/2026

Atualizar contratos e serviços desta função para aceitar omissão/vazio; manter o campo opcional no contrato para compatibilidade com clientes antigos. Retirar entradas, estados e bloqueios de justificativa das telas. Normalizar ausência para vazio nas colunas históricas não nulas e para null na auditoria; preservar autoria, resultado e datas. Migration aditiva de política retira somente restrições de texto obrigatório, mantendo consistência das decisões. Não são necessários estados especiais de criação de notícia. Cobrir ausência em contratos, autorização, integração e E2E; executar banco/navegador/build no CI com serviços locais desligados.
