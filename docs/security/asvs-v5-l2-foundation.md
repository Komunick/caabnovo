# Matriz OWASP ASVS 5.0.0 L2 — Fundação CAAB

Esta matriz é evidência viva. Cada controle aplicável deve apontar para implementação e teste; itens
que dependem de infraestrutura de produção permanecem bloqueadores até revisão humana.

| Área ASVS | Requisito verificável da Fundação | Evidência automatizada | Estado |
| --- | --- | --- | --- |
| V1 Arquitetura | Fronteiras do monólito e componentes confiáveis documentados | lint de imports; `docs/architecture/foundation.md` | Atendido |
| V2 Autenticação | Sessão server-side, revogação imediata e MFA administrativo | testes unitários, integração e E2E da US1 | Atendido |
| V3 Sessão | Cookies seguros e sessão ativa consultada a cada ação | integração Better Auth e revogação E2E | Atendido |
| V4 Autorização | Negação por padrão e menor privilégio em toda ação protegida | testes de autorização US1–US5 | Atendido |
| V5 Validação | Entradas validadas por schemas Zod e respostas sem detalhes internos | 16 testes de contrato | Atendido |
| V6 Criptografia | Segredos fora do repositório; TLS obrigatório fora do local | secret scan local/CI; revisão de deploy | Parcial — TLS do ambiente final |
| V7 Erros e logs | Logs allowlisted e redigidos, com IDs de correlação | 5 testes canário e E2E operacional | Atendido |
| V8 Dados | Minimização, inventário, retenção e descarte aprovados por DPO | gate de privacidade T089 | Bloqueado por aprovação |
| V9 Comunicação | TLS e endpoints versionados `/api/v1` | validação OpenAPI; configuração de deploy | Parcial — TLS do ambiente final |
| V10 Código malicioso | Upload em quarentena, magic bytes e ClamAV fail-closed | 8 testes de scan/ClamAV | Atendido |
| V11 Lógica | Idempotência, concorrência e invariantes no PostgreSQL | 27 testes de integração | Atendido |
| V12 Arquivos | Tipo/tamanho/checksum, nomes físicos aleatórios e download autorizado | contrato, integração e E2E US5 | Atendido |
| V13 API | Contrato OpenAPI 3.1.1 versionado e autorização server-side | 16 testes de contrato e testes de negação | Atendido |
| V14 Configuração | Configuração tipada, dependências fixadas e CI bloqueante | lint, typecheck, audit e build | Atendido no código |

## Critério de conclusão

Nenhum item aplicável pode permanecer sem evidência antes da promoção a `main`. “Parcial” ou
“Bloqueado” impede produção, mas não autoriza inventar decisões de retenção, infraestrutura ou negócio.
