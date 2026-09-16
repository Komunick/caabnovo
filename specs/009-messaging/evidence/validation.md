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
