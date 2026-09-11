# Validação — foto de perfil (11/09/2026)

Branch: `feature/member-profile-photo`, baseada em `dev` (`ab0ad89`).

- 272 testes unitários/de contrato passaram; mais 3 testes do fluxo compartilhado de upload
  passaram após incluir seleção de foto no cadastro inicial.
- 25 testes de integração passaram em PostgreSQL descartável: migrations e associados,
  incluindo permissões atuais, isolamento de arquivos, idempotência, concorrência e rollback.
- Typecheck web, lint aplicável, formatação completa e diff sem erros passaram.
- Migration 0015 aplicada no banco local sem reset ou alteração dos cadastros existentes.
- Revisão visual autenticada no localhost: campo no perfil existente em temas claro/escuro.
- Testes E2E acrescentados para adicionar/substituir/remover, persistência, acessibilidade,
  390 px e criação com foto/retomada sem duplicar cadastro. Execução no CI pendente.
- A execução E2E local sem seed parou no login da conta sintética indisponível; nenhum
  cadastro foi criado por essa tentativa. A sessão do usuário no Chrome está autenticada,
  mas a extensão requer acesso a arquivos locais para selecionar imagens automaticamente.

Os gates e a revisão visual restantes serão atualizados no mesmo PR antes da conclusão.
