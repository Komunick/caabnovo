# Inventário de dados pessoais — pendente de aprovação

Status: DRAFT — Jurídico/DPO ainda não aprovou este inventário.

| Categoria | Exemplos mínimos | Finalidade | Acesso técnico | Retenção/descarte |
| --- | --- | --- | --- | --- |
| Identidade interna | nome, e-mail, estado da conta | autenticação e administração de acesso | próprio usuário; gestores autorizados | PENDENTE DPO |
| Autenticação | hash de senha, segredo TOTP, códigos de recuperação | provar identidade e MFA | serviço de autenticação; nunca UI/log/auditoria | PENDENTE DPO |
| Sessão | token com hash/identificador, expiração, IP/user-agent minimizados | manter/revogar sessão e investigar abuso | autenticação e segurança | PENDENTE DPO |
| Autorização | funções, permissões, concessor e justificativa | menor privilégio e responsabilização | gestores e auditoria autorizados | PENDENTE DPO |
| Auditoria | ator, ação, entidade, razão, request/correlation IDs | integridade, investigação e obrigação legal | auditores autorizados; append-only | PENDENTE DPO / possível preservação legal |
| Arquivos privados | conteúdo enviado, nome de exibição, proprietário lógico | evidência/documento do domínio futuro | proprietário lógico e perfis autorizados | PENDENTE DPO / quarentena rejeitada separada |
| Operações | tipo/estado do job, tentativas, erro seguro, correlação | suporte, resiliência e diagnóstico | operadores autorizados | PENDENTE DPO |

Não são finalidades permitidas: marketing implícito, enriquecimento externo ou reutilização sem nova
base legal. Dados reais não entram em DEV, testes, logs ou evidências automatizadas.

Antes da aprovação, o DPO deve preencher base legal, controlador/operador, compartilhamentos,
localização, prazo por categoria, evento inicial do prazo e ação final verificável.
