# Checklist histórica de qualidade: Agendamentos — etapa 1

Data: 15/09/2026. Feature: [spec.md](../spec.md). **Arquivada logicamente em 28/09/2026, preservada
neste caminho para rastreabilidade.** Escopo exclusivo: planejamento da etapa 1 em 15/09. Os
marcadores abaixo não aprovam o recorte administrativo posterior nem 2C. A afirmação original de
ausência de execução refere-se àquela data.

Q8/Q9, PR #34/#36 e pendências atuais estão na
[reconciliação](../evidence/reconciliation-2026-09-28.md). A checklist de requisitos 2C é
[channels.md](channels.md), com revisão ainda aberta. O item sobre frameworks permanece como
registro da avaliação antiga; não foi marcado como satisfeito por esta correção e não representa
avaliação atual do uso de FullCalendar.

## Referência administrativa posterior

T078–T086 verificadas em 28/09 pelo painel e banco, com as mesmas regras confirmadas pelo usuário.
Resultado em [evidência administrativa](../evidence/admin-workflow-2026-09-28.md). Esta checklist
histórica não foi convertida em aprovação de app/site nem em checklist de código.

## Content Quality

- [ ] Spec descreve necessidades e resultados, sem frameworks ou código.
- [x] Jornada de valor e atores explícitos; acesso ao painel conforme usuário.
- [x] Seções obrigatórias preenchidas; exemplos distinguidos de políticas.
- [x] Pesquisa atual com fontes oficiais e alternativas no research.md.

## Requirement Completeness

- [x] Sem marcadores NEEDS CLARIFICATION na etapa 1; hipóteses de recorte declaradas.
- [x] Requisitos verificáveis e critérios de sucesso mensuráveis.
- [x] Cenários de concorrência, falha de remarcação, cancelamento e autorização.
- [x] Limites entre painel inicial, conexão futura dos canais e sugestões explícitos.
- [x] Dependências de Associados e cadastro/horários documentadas.
- [x] Regra sobre Cal.com preservada; sem justificativas obrigatórias.

## Feature Readiness

- [x] US1 e US2 têm testes independentes e tarefas cobrindo a primeira entrega.
- [x] Design cobre catálogo, horários, API, transações, histórico e idempotência.
- [x] SC-001 a SC-005 mapeados no roteiro de validação futura.
- [x] Correções aos documentos históricos apontam para a spec responsável.

## Notes

Resultado histórico em 15/09: planejamento pronto para revisão do recorte inicial, não
funcionalidade testada. Hipóteses a revisar: lista diária; reservas individuais futuras; estados
Agendado/Cancelado; rejeição conservadora de mudanças que afetem reservas existentes. Etapa 2 requer
contratos e políticas por incremento; etapa 3 permanece sugestões. Hooks before/after specify, plan
e tasks: não configurados (extensions.yml ausente).
