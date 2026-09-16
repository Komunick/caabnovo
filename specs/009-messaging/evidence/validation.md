## Correção de públicos e agendamentos — 16/09/2026

Na branch feature/messaging-audiences-20260916, commit 8c17bfd, a validação remota
[35143077196](https://github.com/Komunick/caabnovo/actions/runs/35143077196) aprovou qualidade,
344 unitários, 115 contratos, 201 integrações, 78 E2E e segurança. A massa principal
usa 100 cadastros sintéticos por instrução do usuário; não foi realizado benchmark
com 40 mil pessoas. As consultas não truncam a audiência nem impõem teto de IDs.

Integrações comprovam filtros combinados, idade nas fronteiras, estado de residência
separado da OAB, vínculo vigente sem duplicação, situação Ativa/Inativa, exclusões,
reavaliação na data programada, reagendamento atômico e recusa de versão antiga.
Criação/edição/arquivo de Associados preservam os novos campos. A primeira execução
identificou o teste novo após revogação de sessão na suíte; corrigida a ordem sem
alterar a proteção do produto. Tipos, lint e formatação passaram localmente; a suíte
geral local sofreu ENOMEM no subprocesso Windows de prontidão e passou no CI Linux.

Revisão visual encontrou estreitamento de colunas no celular. Refinamento posterior
organiza cada linha de agendamento verticalmente no mobile, preservando semântica
acessível e tabela em desktop. Jornada inclui assertion de largura útil e ausência
de overflow horizontal. As capturas finais e CI correspondente acompanham o PR.

---

# Validação — 16/09/2026

## Preparação

Tipos web/db/worker, lint e formatação locais aprovados. 47 testes direcionados passaram. Sem build/E2E ou banco local iniciado.

## Primeira execução remota

[CI do PR, dfc8c57](https://github.com/Komunick/caabnovo/actions/runs/35130740619): os 15 testes de integração de Mensagens passaram com o papel caab_runtime e PostgreSQL descartável. Cobertura: permissão única, sessões inválidas/revogação, idempotência concorrente, versões, supressões, público, snapshot, scheduler concorrente, cancelamento e falha de auditoria com rollback. A suite geral detectou a lista fixa de migrations sem 0021; expectativa atualizada, sem suprimir teste. Navegador ainda em andamento.

## Limites

Nenhuma validação de entrega real é alegada. Meios adiados expressamente; não há provedores, credenciais ou disparo a associados. Atualização de DEV depende de merge humano; preview local permanece pausado por preferência vigente.

## Revisão visual inicial

A jornada completa de criação/modelo/público/campanha, edição preservada, prévia, bloqueio,
programação/cancelamento, preferência, duplicação e arquivo passou no navegador em 11,6s.
Axe WCAG 2.2 AA e contraste nos dois temas passaram durante essa jornada. 75 E2E passaram;
a verificação de acesso negado encontrou dois elementos `alert` (mensagem e anunciador
interno do Next), corrigida restringindo a asserção ao conteúdo principal. Não foi reduzida
a verificação HTTP 403. Capturas revelaram o título de seção genérico no shell: registrado
Mensagens explicitamente. Capturas finais reposicionam a página no topo após os testes de teclado.

## Resultado de base e revisão visual

Commit befaa2b: [CI do PR](https://github.com/Komunick/caabnovo/actions/runs/35132031970)
e [CI do push](https://github.com/Komunick/caabnovo/actions/runs/35132026951) aprovados integralmente.
340 testes unitários, 113 de contrato, 197 de integração, 76 E2E e 6 verificações da suíte
separada de acessibilidade. Formatação, lint, tipos, build, segurança e 12 grupos do tooling
de rulesets aprovados. Os checks do commit documental posterior acompanham o próprio PR.

Capturas finais revisadas, sem cortes no cabeçalho e com nomes exclusivamente sintéticos:

- [Prévia em 390px, tema claro](messages-preview-mobile-light.png).
- [Prévia em 390px, tema escuro](messages-preview-mobile-dark.png).
- [Histórico em desktop](messages-history-desktop.png).

O acesso negado foi confirmado na página e na API (403). Falha transitória de listagem oferece
nova tentativa; o fluxo principal exercita modelos, público salvo, persistência entre abas,
preview, preferência, solicitação bloqueada, programação/cancelamento, duplicação e arquivo/restauração.
A migration 0022 e a proteção de resultados concluídos passaram com o papel restrito do banco.
Principal dev 1fd8521 limpa, com fetch/ff-only confirmado; PR #31 aberto, sem aprovação ou merge.

## Regressão adicional de conclusão de formulários

Revisão posterior identificou limpeza de cache antes de useDraftState voltar a gravá-lo. Correção aplicada no editor compartilhado de campanhas/modelos/públicos. Nova jornada E2E verifica duas inclusões sucessivas de cada tipo, preservação da programação ao salvar conteúdo e navegar, retorno ao original após duplicação e descarte explícito. Resultado desta extensão acompanha os checks do HEAD atual do PR; as capturas acima continuam representativas, pois o layout não mudou.
