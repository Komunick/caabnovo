# Contraste durante troca de tema — 16/09/2026

Correção no PR #28, branch `feature/scheduling-management-20260915`, código final
`8e15e8435ef306d40b881010726cb155910f3091`.

## Problema e correção

O [browser/push original](https://github.com/Komunick/caabnovo/actions/runs/35019277298)
falhou nas três tentativas do cenário de Agendamentos ao trocar escuro por claro:
o item ativo do menu chegou a contraste 4:1 e a busca a 4,24:1.
A interpolação de texto/fundo nos controles foi removida, preservando borda e movimento.

A [validação do PR após o primeiro ajuste](https://github.com/Komunick/caabnovo/actions/runs/35089213112)
revelou outra origem: a cor herdada de `body` ainda interpolava sobre superfícies já
claras nos detalhes e histórico da reserva, chegando a 2,09–2,26:1. Removida a
transição global de texto/fundo para que o tema seja aplicado simultaneamente.

O medidor existente de contraste por `requestAnimationFrame` foi compartilhado e
ampliado para menu, busca, detalhes, histórico e mensagens da reserva. Mede ambos
os sentidos durante 250 ms e exige pelo menos 4,5:1 em todas as amostras. As
verificações axe da jornada continuam ativas, sem espera adicional nem exclusão de regras.

## Validação final do código

- [CI push 35090365584](https://github.com/Komunick/caabnovo/actions/runs/35090365584): todos os jobs aprovados.
- [CI PR 35090370752](https://github.com/Komunick/caabnovo/actions/runs/35090370752): todos os jobs aprovados.
- 302 unitários, 105 contratos, 181 integrações, 69 E2E e 6 testes de acessibilidade.
- Formatação, lint, typecheck, build, ferramentas de proteção de branch e segurança aprovados.
- Jornada de Agendamentos e teste de contraste por quadros passaram na primeira tentativa.
- Capturas sintéticas de detalhe desktop claro e celular escuro do artefato
  `scheduling-synthetic-evidence` revisadas: texto legível, controles acessíveis e sem cortes.

Sem mudança de paleta, dependências, banco, permissões ou regras de reserva. Build,
E2E e serviços de teste executados somente no CI; nenhum seed no banco local.
Rollback: reverter as alterações CSS/testes; não há migration associada à correção.
Nenhum merge ou aprovação do PR realizado.
