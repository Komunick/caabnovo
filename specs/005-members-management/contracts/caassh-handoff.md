# Contrato de colaboração: Associados → Caassh

Atualizado em 10/09/2026 após PRs #13/#14. Associados: branch `feature/members-management`, worktree `.cache/pr-members`, spec 005.
Caassh: spec, branch e worktree próprios. A spec 006 já pertence a Configurações; alocar o próximo
identificador disponível a partir da base atualizada. Não usar a pasta desta instância.

- Associados reserva somente `packages/db/migrations/0010_members.sql`. As migrations 0011 e 0012
  já pertencem a Configurações/remoção do autenticador; Caassh deve verificar o próximo número livre
  na base atualizada antes de criar sua migration. Não renumerar migrations já aplicadas.
- A tabela `member` possui `id uuid PRIMARY KEY` estável e `archived_at timestamptz NULL`.
- Caassh usa FK para `member(id)` sem CASCADE DELETE; não cria beneficiário, CPF, nome ou tabela de login duplicados.
- O cadastro não é uma conta de acesso. Não usar `user.id` como identificador de associado.
- Leitura no servidor: `@caab/db/repositories/members`, função `findMemberSummary(client, id)`; retorna `{ id, name, archivedAt } | null`. `archivedAt` é string ISO ou null.
- Seleção no painel: `GET /api/v1/members?q=...&page=1`, sessão ativa com `members:read`; itens com id, name, registrationStatus e archivedAt, sem CPF completo. Aprovação de acesso inicial ao administrador registrada em 10/09/2026.
- Caassh decide suas regras de concessão; cadastro aprovado ou OAB regular não comprovam elegibilidade financeira/crédito.
- Não editar arquivos de Associados, auth, News ou migration 0010. Mudanças no catálogo `apps/web/modules/workspace/areas.ts` e exports `packages/contracts/src/index.ts` podem exigir integração manual de adições; não sobrescrever outras entradas.
- A migração de Caassh com FK depende de 0010. Integrar Associados antes de executar essa migração; desenvolvimento isolado pode usar adaptador sintético explicitamente identificado.
- Sem alterações no mesmo banco DEV por duas instâncias; usar banco descartável para testes.
