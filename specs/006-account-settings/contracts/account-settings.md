# Contrato: configurações pessoais

`POST /api/v1/me/settings`, JSON, sessão autenticada em cookie, `Origin` igual ao portal e cabeçalho `x-csrf-token` com pelo menos 32 caracteres. Não recebe identificador de usuário: o titular é sempre derivado da sessão. Propriedades desconhecidas são recusadas.

| action | Campos adicionais | Resultado |
| --- | --- | --- |
| profile | name (1–160 caracteres), version (inteiro positivo) | Atualiza nome e versão. |
| password | currentPassword, newPassword (12–72), confirmPassword, version | Troca a senha, invalida pedidos de e-mail pendentes e encerra as outras sessões. |
| request-email | currentPassword, newEmail, version | Envia link de uso único, sem mudar o endereço atual. Novo pedido invalida o anterior; intervalo mínimo de um minuto entre pedidos enviados. |
| confirm-email | token (64 caracteres hexadecimais) | Confirma pedido válido do titular, atualiza endereço e versão e encerra as outras sessões. |

Sucesso: HTTP 200, `{ "success": true, "version": 2 }` (versão ilustrativa).

Falhas: JSON `{ "code": "...", "message": "...", "requestId": "UUID" }`.

- 401: `AUTHENTICATION_REQUIRED` para sessão ausente, revogada, expirada ou conta desativada.
- 403: `ORIGIN_DENIED` ou `CSRF_TOKEN_REQUIRED`.
- 409: `VERSION_CONFLICT`, `EMAIL_UNAVAILABLE`, `EMAIL_LINK_INVALID`, `EXTERNAL_CREDENTIAL`.
- 422: `VALIDATION_FAILED`, `INVALID_PASSWORD`, `PASSWORD_MISMATCH`, `PASSWORD_UNCHANGED`, `EMAIL_UNCHANGED`.
- 429: `TOO_MANY_ATTEMPTS` (cinco senhas incorretas em 15 minutos) ou `EMAIL_REQUEST_LIMIT`.
- 503: `EMAIL_DELIVERY_FAILED`, sem troca de endereço ou pedido efetivado.
- 500: falha inesperada, sem detalhes internos.

O plugin e todos os endpoints de MFA foram removidos (FR-019); chamadas a `/api/auth/two-factor/*` retornam 404. Rotas nativas alternativas de alteração de conta também são bloqueadas: as alterações pessoais usam o contrato acima.

Novas senhas exigem maiúscula, minúscula e número; símbolos opcionais. A política 12–72 vale também para cadastro e redefinição; credenciais antigas continuam aceitas na autenticação.

Recuperação usa `POST /api/auth/request-password-reset` com `{ email }` e `POST /api/auth/reset-password` com `{ token, newPassword }`, atendidos por serviço transacional próprio. O token aleatório é armazenado como SHA-256, expira em 30 minutos e aceita um único uso; novo pedido invalida o anterior. A política é validada antes de consumir o token. Senha, consumo do link, invalidação dos pedidos de e-mail, encerramento de todas as sessões e auditoria `user.password.reset` são efetivados na mesma transação. Falha na auditoria desfaz todas essas alterações. Alterar a senha ou confirmar novo e-mail também invalida links de recuperação pendentes.

Limites em ambiente normal: três pedidos/minuto e cinco tentativas de redefinição/minuto, com HTTP 429 ao exceder. Solicitações válidas retornam a mesma mensagem para endereços conhecidos e desconhecidos. A disponibilidade SMTP é verificada antes de procurar a conta; indisponibilidade retorna HTTP 503 `RECOVERY_UNAVAILABLE`, com erro e opção de nova tentativa na tela. Mailpit somente em localhost; envio real obrigatório fora dele (FR-013).

O link de confirmação usa `/confirm-email#token=...`. O fragmento não é enviado no endereço da requisição HTTP; o cliente o remove da barra e envia o token somente no corpo da confirmação explícita. Reabrir o link exige novamente a sessão do titular; não há redirecionamento automático para destinos externos.
