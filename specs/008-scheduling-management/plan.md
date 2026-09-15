# Implementation Plan: Agendamentos em três etapas

**Branch**: `codex/scheduling-planning-20260915` | **Date**: 2026-09-15
**Spec**: [spec.md](spec.md)
**Status**: planejamento completo do recorte inicial para revisão; sem código.
O setup-plan resolveu os caminhos da spec; seu campo BRANCH inferiu o nome da pasta.
A branch real foi conferida com git e é a indicada acima.

## Summary

Primeiro entregar catálogo mínimo + horários + lista diária + criar/consultar/remarcar/
cancelar no painel. Após essa primeira versão validada, o próximo passo do produto
será a primeira versão da interface do usuário no app/site, com especificação própria
e integração de reservas coordenada nesta spec. Depois retomar os demais incrementos
até o legado e, por último, selecionar sugestões novas. [Roadmap e limites](roadmap.md).

## Technical Context

- **Language/Version**: TypeScript 6, Node 24, versões da base atual.
- **Primary Dependencies**: Next.js 16.3.4/React 19, pg, Zod, formulários e componentes
  existentes. Não instalar Cal.com. Lista inicial com componentes existentes; decisão
  documentada de adiar FullCalendar apesar da referência anterior em STACK.
- **Storage**: PostgreSQL, migrations aditivas; nenhuma migration escrita nesta fase.
- **Testing**: Vitest para contratos/unidade/integração real, Playwright e axe.
- **Target Platform**: painel web desktop/mobile; serviços locais desligados.
- **Project Type**: monólito modular; scheduling é domínio próprio.
- **Performance Goals**: lista diária paginada (25 padrão/100 máximo), sem carregar
  catálogo/histórico inteiro; alvo de primeira resposta útil em 2s em ambiente de
  validação com 10 mil reservas sintéticas. É alvo proposto, não SLA comprovado.
- **Constraints**: UTC persistido, America/Bahia exibido; sem novas permissões
  específicas de Agendamentos, motivo obrigatório, dados clínicos ou créditos.
- **Scale/Scope**: várias unidades e serviços; uma pessoa e um profissional por reserva
  na primeira entrega. Um profissional pode ter vínculos válidos em várias unidades,
  mantendo prevenção global de conflito para sua identidade.

## Constitution Check

Pré/pós-design: solução coesa no monólito, PostgreSQL como autoridade, contratos
versionados, auditoria, minimização e acessibilidade. Sem nova infraestrutura.
Decisões explícitas do usuário prevalecem sobre trechos históricos locais:
qualquer acesso válido ao painel autoriza Agendamentos; motivos não são obrigatórios.
Não ampliar permissões de outros módulos. Branch codex existente conforme instrução
do ambiente; exceção de Processamentos em outra branch está registrada no mapa local.
Gates de implementação continuam exigidos; planejamento não equivale a aprovação de
CI, teste, merge ou deploy. Nenhuma integração Cal.com necessária identificada.

## Project Structure

Documentação em specs/008-scheduling-management: spec, plan, research, roadmap,
data-model, contracts/admin.md, quickstart, tasks e checklists/requirements.md.

Destinos de implementação futura:
- apps/web/modules/scheduling/ — catálogo, horários, disponibilidade, comandos e UI.
- apps/web/app/(admin)/scheduling/ — lista, configuração e detalhes.
- apps/web/app/api/v1/scheduling/ — endpoints autenticados do painel.
- packages/contracts/src/scheduling.ts — contratos.
- packages/db/migrations/ — próximo número livre ao implementar, sem reservar número.
- packages/db/src/repositories/members.ts — leitura mínima e coerente da elegibilidade.
- apps/web/modules/members/ — coordenação de bloqueios/vínculos com confirmação.
- apps/web/modules/workspace/ — navegação e busca.
- apps/web/modules/audit/ — descrições humanas dos eventos.
- apps/web/tests/integration/scheduling.test.ts e tests/e2e/scheduling.spec.ts.

**Structure Decision**: reaproveitar componentes/auth/auditoria e cadastro de associados.
Unidades da agenda não são automaticamente unidades de Parceiros; profissionais não
são contas de login. Não antecipar motor genérico de recursos, turmas ou pagamentos.

## Sequência de implementação futura

1. Contratos/modelo, migrations e testes de integridade.
2. US1: catálogo mínimo, autorização e horários, busca de beneficiário e criar reserva.
3. US2: lista/detalhes, remarcação/cancelamento, integração com auditoria e navegação.
4. Executar roteiro, CI e revisão visual; abrir PR somente quando a entrega for funcional.
5. Após validar a primeira entrega, priorizar a primeira interface do usuário no
   app/site: preparar seu spec/plano/tarefas próprios e detalhar a integração de reservas
   nesta spec (incremento 2C/T022), antes dos demais incrementos da etapa 2.
6. Entregar e validar o recorte definido para app/site; depois retomar os demais
   incrementos de Agendamentos, atualizando esta spec.
7. Novidades só após seleção explícita; não executar roadmap como backlog já autorizado.

## Integridade e concorrência

- Intervalos [início,fim); exclusion constraint GiST por profissional e intervalo
  para status scheduled. Avaliar btree_gist na migration conforme PostgreSQL do ambiente.
- Criar/remarcar em transação, com lock de configuração/identidades e releitura.
  Escritas em horários/catálogo usam a mesma ordem de locks. Erro na remarcação faz rollback.
- Mudanças em bloqueio/vínculo de dependência precisam participar do mesmo protocolo.
  Apenas reler o associado não elimina corrida; cobrir criação/encerramento de vínculos
  e bloqueio de titular em testes de integração da spec005 também.
- Repetição: idempotency key por ator/operação, hash do pedido e resultado persistidos
  junto da alteração. Chave reutilizada com outro conteúdo retorna conflito.
- Edição: versionamento otimista; datas, duração e vínculo definidos no servidor.
- Busca mínima de beneficiários sob autorização de Agendamentos retorna apenas
  id/nome/indicação suficiente para seleção; não exige members:read nem libera o
  cadastro completo de Associados. Validar contra nomes iguais e dados sensíveis.

## Rollout, migração e rollback

Primeira entrega independente do legado, uso administrativo; sem sincronização,
seed real ou migração automática. Preservar dados de qualquer preview existente.
Mudanças aditivas no schema; rollback da aplicação preserva registros gravados.
Antes da conexão app/site, documentar contrato, autenticação de beneficiário, ambiente,
mapeamento de identidades/dados e corte de escrita para evitar duas agendas concorrentes.
Homologação com dados sintéticos; nenhum tráfego público muda nesta etapa.

## Gates e próximos passos

Format/lint/types, contratos, integração real concorrente, E2E, a11y, build,
segurança e revisão humana conforme DELIVERY-WORKFLOW. Executar no CI quando houver
código; não reativar localhost/banco sem pedido. Pesquisa e estrutura revisadas agora;
tarefas permanecem não executadas.

