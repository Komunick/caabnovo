# Plano: organização do Jira e Confluence

**Branch:** `docs/jira-confluence-organization-20261001` | **Data:** 01/10/2026 | **Spec:**
[spec.md](spec.md)

## Resumo

**Atualização de execução — 02/10/2026:** a preparação inicial abaixo é histórica. Aplicação inicial
ocorreu em 01/10; o usuário autorizou correções de coerência no pedido atual. Reutilizar esta
entrega; comparar updated antes da escrita e reler cada operação. No Confluence, preservar HTML,
conferir versão/concorrência e registrar bloqueios individuais. Atualizar MODULES, PRD, STACK e
TOOLING sem copiar a entrega documental paralela ou modificar código.

Organizar os 37 tickets iniciais por entrega, preservar histórico e responsabilidade comprovada e
estruturar o Confluence para toda a equipe. Preparar manifesto revisável antes de aplicar operações
por item. Este comando entrega planejamento local; execução remota permanece posterior.

## Contexto técnico

- Formato: Markdown e PowerShell do Spec Kit existente; sem runtime novo.
- Dependências: conexões Jira/Confluence/GitHub, Git e Prettier do repositório.
- Persistência: artefatos locais e recursos existentes Atlassian na execução futura.
- Validação: formatação, links, cobertura de requisitos e releitura remota por operação.
- Plataforma: Windows e Atlassian Cloud; governança documental e operação assistida.
- Escala: 37 tickets iniciais, 41 PRs consultados, até cinco novos registros propostos.
- Desempenho: completude e rastreabilidade; respeitar paginação e limites da API, sem meta de
  latência.
- Restrições: nenhum apagamento, atribuição por inferência, alteração compartilhada de quadro,
  implementação de produto ou publicação nesta etapa.

## Verificação constitucional antes da pesquisa e após o desenho

| Princípio             | Antes                                   | Após                                                             |
| --------------------- | --------------------------------------- | ---------------------------------------------------------------- |
| I — Simplicidade      | Usar recursos existentes                | Checklists e operações assistidas; sem sistema novo.             |
| II — Fronteiras       | Specs funcionais continuam responsáveis | 011 rege organização, sem duplicar regras dos módulos.           |
| III — Integridade     | Não acessar banco do produto            | Sem migrations ou dados de usuários.                             |
| IV — Menor privilégio | Ler somente informação necessária       | Não armazenar segredos nem ampliar permissões.                   |
| V — Histórico         | Preservar chaves, status e autoria      | Conversão/movimento no mesmo recurso e verificação por operação. |
| VI — Integrações      | Separar plano de aplicação autorizada   | Prévia, concorrência e retomada sem duplicação.                  |
| VII — Interface       | Nenhuma UI do produto alterada          | Modelos legíveis sem significado dependente de cor.              |
| Entrega               | Worktree própria                        | Sem commit/push/PR/merge; QA histórico não presumido.            |

Gates aprovados para planejamento, sem exceção constitucional. Aplicação exige manifesto atual,
revisão da prévia e capacidades verificadas.

## Fase 0 — Pesquisa

[research.md](research.md) registra escolha da spec responsável, conversão nativa, labels aditivas,
versões/rascunhos e limites da evidência. Pesquisa delegada somente leitura conforme a skill.
Decisões de desenho resolvidas; pré-condições dinâmicas ficam para execução.

## Fase 1 — Desenho

[data-model.md](data-model.md) define registros e estados do processo.
[operations.md](contracts/operations.md) define preparação, escrita, verificação e recuperação.
[templates.md](contracts/templates.md) define modelos de tickets/páginas.
[ticket-preview.md](ticket-preview.md) preserva propostas dos 37 tickets.
[quickstart.md](quickstart.md) orienta validação, distinguindo simulação de aplicação.

## Sequência a detalhar em speckit-tasks

1. Atualizar inventário paginado, snapshots de tickets/páginas, metadados e PRs; comparar com a
   prévia.
2. Preparar manifesto campo a campo, correspondência comprovada entre contas, labels e dependências.
   Confrontar autor do PR e histórico; pendência individual não bloqueia itens independentes.
3. Preparar textos finais pelos modelos. Comparar regras/stack com fontes vigentes e propostas
   locais não integradas; não apresentar planejamento como implementação.
4. Apresentar prévia concreta para revisão, com conteúdo final e operações bloqueadas discriminadas.
5. Após revisão autorizadora, aplicar páginas e confirmar links antes de sinalizar transferências.
   Reclassificar existentes, incorporar aceite, criar apenas ausências confirmadas e vincular pais.
6. Verificar cada operação, preservar resultados parciais e pendências; validar visão ativa
   separada. Conciliar a página 7143436 com as decisões vigentes.

## Estrutura

```text
specs/011-jira-confluence-organization/
  spec.md
  plan.md
  research.md
  data-model.md
  ticket-preview.md
  quickstart.md
  contracts/operations.md
  contracts/templates.md
  checklists/requirements.md
  evidence/planning-validation.md
docs/history/reorganizacao-jira-confluence-2026-10-01.md
```

Código não afetado. A sequência foi detalhada em [tasks.md](tasks.md) pelo speckit-tasks. Manifesto
e snapshots de aplicação serão evidências futuras, não resultados inventados.

## Riscos

Auditoria dos quatro repasses em02/10/2026: conferir ponta local/publicada e CI por SHA, sem tratar
QA humano como concluído. Primeiro PR42 documental; PR43 funcional após revisão sensível/rollout e
conferência da combinação; Acessos concilia após42 e Relatórios após43. Trabalho/aceite futuro fica
nos tickets funcionais existentes; P01 ganhou subtarefa de decisão47. Corrigir descrições mantendo
histórico, reclassificar somente estados comprovados e registrar operações nativas indisponíveis.
Fonte: [ordem e cobertura](evidence/merge-readiness-2026-10-02.md).

Publicação do inventário: preservar ADF dos critérios em 17 tickets e HTML das duas páginas
existentes; reler resultados. Registrar coordenação no plano do programa e no caderno principal. As
outras instâncias executam as frentes; não criar fila concorrente em cada worktree.

Concorrência exige releitura; conversão indisponível vira operação manual pendente; autoria ambígua
fica sem alteração; rascunho desconhecido bloqueia publicação. PR integrado não comprova QA. O
limite inicial de cinco registros não permite duplicatas nem inventar escopo da caixa de entrada.
