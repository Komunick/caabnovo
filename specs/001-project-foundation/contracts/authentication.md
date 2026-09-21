# Authentication and Authorization Contract

**Estado conferido em 21/09/2026:** catálogo atual contém news:read/write/publish,
mas ainda não consulta/alteração de Agendamentos nem permissão geral de exportação.
AX01/AX04 definirão a transição sem novas concessões automáticas de módulo.
Nesta entrega, T096 bloqueia `/sign-up/email` na lista de rotas e configura
`disableSignUp: true`; a requisição pública é negada sem usuário, credencial ou
sessão. Login, recuperação e criação administrativa permanecem. Validado no CI
de 7d4d507; integração em dev pendente no PR #35.
Permissões efetivas usam a view effective_user_permission, inclusive concessões
individuais de user_access; não derivar o acesso somente do nome do papel.

## Session boundary

- Better Auth owns handlers below `/api/auth/*`; exact generated paths follow the pinned library
  release and are covered by integration tests.
- Sessions are opaque, persisted in PostgreSQL and transported only by `HttpOnly`, `Secure` cookies
  with the strictest practical `SameSite` policy.
- Stateless/JWT sessions and cookie session cache are disabled so revocation is effective on the next
  protected action.
- Every Server Action, Route Handler and application use case invokes a trusted session lookup and
  `requirePermission(resource, action)` before reading or mutating protected data.
- Mutation requests authenticated by cookie require CSRF protection and origin validation.

## Autenticação vigente — 21/09/2026

E-mail e senha com sessão ativa. MFA/TOTP, códigos de recuperação e desafios foram
retirados em 10/09/2026; não reintroduzir. Concessão administrativa exige autoridade
atual, proteção contra autoelevação e preservação do último administrador, sem MFA.
Recuperação de senha e confirmação de e-mail seguem a spec 006; nenhum segredo em logs.

## Authorization contract

Permission identifiers use `<resource>:<action>`, for example:

- `users:read`, `users:create`, `users:update`, `users:disable`
- `roles:read`, `roles:grant`, `roles:revoke`
- `audit:read`, `exports:generate`
- `files:create`, `files:read`, `files:delete`
- `jobs:read`, `jobs:redrive`

Rules:

- Unknown permissions deny access.
- Valid role assignments follow [the role contract](roles.md): Administrator receives every
  concrete permission in the available catalog, even with an individual override. Manager
  has read access to every module, general export permission and full Reports access.
  Manager can grant other modules' mutation permissions without receiving those mutations;
  self-changes and role assignment are denied. Collaborator cannot grant access.
  No wildcard, session bypass or bypass of domain invariants is introduced.
- An actor cannot grant a permission outside the set they are authorized to manage.
- Resource ownership checks are additional to RBAC where relevant.
- `401` means no valid identity. `403` means a valid identity lacks access. `404` may replace `403`
  when revealing resource existence would disclose protected information.
- Denials are recorded as redacted security events; sensitive changes require authorization, applicable confirmation and a
  business audit event, without requiring a written reason.

## Required authorization tests

- Unauthenticated access for every protected operation.
- Horizontal access between two users with the same role but different resource ownership.
- Vertical access from ordinary user to administrator/auditor operations.
- Role composition, expiry and revocation during an active session.
- Disabled user and revoked session on the next request.
- Administrator authenticates without MFA while unauthorized grants remain denied.
- Attempted self-escalation and attempted grant beyond actor authority.
- Auditor read/export versus forbidden update/delete.


## Regra final de justificativas — 14/09/2026

Nenhuma operação desta função exige motivo escrito. Campos de justificativa foram retirados da interface. Contratos aceitam omissão e vazio; texto legado opcional mantém seu limite. As exigências anteriores de justificativa estão substituídas. Histórico permanece preservado, e novos eventos registram autoria, data, ação e alterações automaticamente, sem motivo inventado. Fonte, resultado, autenticação, permissões, versão e dados necessários à operação continuam obrigatórios.
