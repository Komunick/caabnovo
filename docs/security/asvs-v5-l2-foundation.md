# Matriz OWASP ASVS 5.0.0 L2 — Fundação CAAB

Esta matriz é evidência viva. Cada controle aplicável deve apontar para implementação e teste; itens
que dependem de infraestrutura de produção permanecem bloqueadores até revisão humana.

| Área ASVS | Requisito verificável da Fundação | Evidência automatizada | Estado |
|---|---|---|---|
| V1 Arquitetura | Fronteiras do monólito e componentes confiáveis documentados | lint de imports; `docs/architecture/foundation.md` | Em implementação |
| V2 Autenticação | Sessão server-side, revogação imediata e MFA administrativo | testes de autenticação e MFA da US1 | Planejado |
| V3 Sessão | Cookies seguros e sessão ativa consultada a cada ação | integração Better Auth da US1 | Planejado |
| V4 Autorização | Negação por padrão e menor privilégio em toda ação protegida | testes `authorization.test.ts` | Planejado |
| V5 Validação | Entradas validadas por schemas Zod e respostas sem detalhes internos | testes de contrato | Em implementação |
| V6 Criptografia | Segredos fora do repositório; TLS obrigatório fora do local | secret scan; revisão de deploy | Parcial |
| V7 Erros e logs | Logs allowlisted e redigidos, com IDs de correlação | testes canário de redação | Em implementação |
| V8 Dados | Minimização, inventário, retenção e descarte aprovados por DPO | gate de privacidade T089 | Bloqueado por aprovação |
| V9 Comunicação | TLS e endpoints versionados `/api/v1` | validação OpenAPI; configuração de deploy | Parcial |
| V10 Código malicioso | Upload em quarentena, magic bytes e ClamAV fail-closed | testes de arquivo da US5 | Planejado |
| V11 Lógica | Idempotência, concorrência e invariantes no PostgreSQL | testes PostgreSQL reais | Em implementação |
| V12 Arquivos | Tipo/tamanho/checksum, nomes físicos aleatórios e download autorizado | testes de arquivo da US5 | Planejado |
| V13 API | Contrato OpenAPI 3.1.1 versionado e autorização server-side | testes de contrato/autorização | Em implementação |
| V14 Configuração | configuração tipada, dependências fixadas e CI bloqueante | lint, typecheck, audit e build | Em implementação |

## Critério de conclusão

Nenhum item aplicável pode permanecer sem evidência antes da promoção a `main`. “Parcial” ou
“Bloqueado” impede produção, mas não autoriza inventar decisões de retenção, infraestrutura ou negócio.
