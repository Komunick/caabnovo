# Encerramento da rodada de clarify — 21/09/2026

Rodada encerrada com **11 perguntas respondidas**, além dos complementos espontâneos
sobre ocultação de módulos e formatos obrigatórios. O usuário autorizou perguntas
sem limite, uma por vez. Nenhuma nova pergunta de produto necessária para atualizar
o planejamento do recorte atual; isso não significa implementação ou homologação.

## Decisões e documentos responsáveis

| Decisão | Registro responsável |
| --- | --- |
| Q1: impedir sobreposição por beneficiário; familiares têm identidades próprias | [Agendamentos](../008-scheduling-management/spec.md), FR-016 |
| Q2: bloqueio mantém reservas futuras e sinaliza decisão manual | [Agendamentos](../008-scheduling-management/spec.md), FR-017; [Associados](../005-members-management/spec.md), FR-019 |
| Q3–Q4: permissão geral de exportação intersectada com módulos/dados; converter concessões antigas sem ampliar acesso | [Fundação](../001-project-foundation/spec.md), [Auditoria](../003-audit-operations/spec.md), [Relatórios](../010-reports-analytics/spec.md) |
| Complemento: módulo sem acesso ausente da barra lateral, busca e Início | [Programa](spec.md), [Fundação](../001-project-foundation/spec.md) |
| Q5: Mensagens para comunicados/campanhas; chat interno e suporte por tickets são possibilidades futuras separadas | [Mensagens](../009-messaging/spec.md), [inventário](../../docs/MODULES.md) |
| Q6–Q7: filtros, seleção/ordem de colunas e download direto, sem teto funcional; Excel, CSV e PDF sempre | [Padrão obrigatório de exportação](../../docs/EXPORT-STANDARD.md), specs 001/002/003/010 |
| Q8–Q9: Notícias e Agendamentos exigem concessão; preservar consulta/alteração separadas e publicação de Notícias | [Notícias](../004-news-publishing/spec.md), [Agendamentos](../008-scheduling-management/spec.md) |
| Q10: retenção institucional adiada; descarte automático desligado | [Fundação](../001-project-foundation/spec.md), [política pendente](../../docs/privacy/retention-policy.md) |
| Q11: critérios de dependentes/documentos adiados; preservar cadastro e análise manual | [Associados](../005-members-management/spec.md), FR-006/SC-006/P01/POL01 |

Seções atualizadas: Clarifications, requisitos, cenários, casos de borda, critérios
de sucesso, entidades/contratos quando afetados, planos, tarefas e checkpoints.
Conciliação final nas specs 001–007: remover exigências antigas de MFA/justificativa
conforme decisões já vigentes, preservar motivos históricos e corrigir referências
a Agendamentos como somente pesquisa. Não altera decisões, código ou dados.

## Cobertura da revisão dirigida

| Categoria | Resultado |
| --- | --- |
| Escopo e comportamento | Resolvido: fronteiras de módulos, exportação e permissões |
| Domínio e dados | Resolvido no recorte atual; políticas institucionais e identidade externa adiadas |
| Interação e jornadas | Resolvido: ocultação, filtros, colunas, formatos, download e operação manual |
| Qualidade não funcional | Controles existentes preservados; dimensionamento de exportação sem teto vai ao planejamento |
| Integrações e dependências | Formatos resolvidos; OAB hospedada, canais reais e novos módulos continuam adiados |
| Casos de borda e falhas | Resolvido no recorte: concorrência, sobreposição, bloqueio, revogação, erros e arquivos completos |
| Restrições e escolhas | Claro: localhost desligado, sem implementação nesta rodada, padrões existentes preservados |
| Terminologia e consistência | Finalidades resolvidas; conciliação dos artefatos técnicos derivados ainda pendente em DOC01 |
| Critérios de conclusão | Requisitos/aceites atualizados; execução de testes e homologações continuam pendentes |
| Marcadores e decisões futuras | Pendências explícitas preservadas, sem políticas ou aprovações presumidas |

Esta é revisão dirigida das decisões da rodada, não certificação exaustiva de todos
os documentos históricos nem auditoria de produção/contas.

## Checklists de qualidade

Comparação com o início da rodada, conforme checkpoints e estados registrados:

| Spec | Antes → depois |
| --- | --- |
| 001 Fundação | 16/16 → 13/16 |
| 002 Programa | 9/9 → 9/9 |
| 003 Auditoria | 6/6 → 6/6 |
| 004 Notícias | 16/16 → 16/16 |
| 005 Associados | 16/16 → 13/16 |
| 006 Conta | 12/12 → 12/12 |
| 007 Parceiros | 9/9 → 9/9 |
| 008 Agendamentos | 14/14 → 13/14 |
| 009 Mensagens | Sem checklist de requisitos |
| 010 Relatórios | 6/6 → 6/6 |

Sem itens novos aprovados. Itens desmarcados nesta rodada: 001 — ausência de detalhes
técnicos, ausência de vazamento de implementação e requisitos integralmente
inequívocos; 005 — ausência de detalhes técnicos, redação integralmente para público
não técnico e ausência de vazamento de implementação; 008 — ausência de frameworks
ou código. Permanecem como atenção documental; a correção dirigida não certifica
todos os requisitos legados. Somente os marcadores das checklists foram alterados.
As notas históricas de aprovação não representam a contagem atual.

## Verificação e próximo passo

Conferência de Q11 em spec/FR-006/SC-006, P01, POL01 e 002 T017; links da documentação
nova e diff verificados. Nenhum teste de aplicação executado, nenhuma tarefa de
implementação concluída pelo clarify. Hooks ausentes: `.specify/extensions.yml`
não existe nesta worktree. Não houve alteração do estado operacional.

Próximo comando recomendado: **$speckit-plan**, para atualizar os planos das funções
afetadas na entrega ativa, tratar DOC01 e detalhar as adequações antes de implementar.
Não iniciar pesquisas ou construção dos módulos futuros por constarem no backlog.
Retomar clarify quando houver definições institucionais ou recorte aprovado das
expansões. Não é necessário repetir as onze respostas desta rodada.
