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
