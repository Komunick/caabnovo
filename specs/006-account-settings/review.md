# Revisão de conclusão — 10/09/2026

**Resultado atualizado:** R01–R04 e R06 corrigidos e cobertos por regressões; R05 retirado pela decisão explícita de remover o autenticador (FR-019). Implementação local verificada; em 10/09/2026, o usuário autorizou PR para dev condicionado aos testes aprovados (T009). Revisão humana e CI continuam exigidos antes de merge. Menções abaixo à ausência de autorização e pendências de T009 preservam o histórico anterior a essa decisão.

O restante desta revisão, até a seção de resolução, preserva o diagnóstico histórico anterior às correções. Naquela etapa foram avaliados 17 requisitos funcionais, cinco critérios de sucesso e quatro histórias; os ensaios reproduziram as falhas descritas abaixo sem modificar o código da aplicação.

Os testes anteriores continuam sendo evidência dos cenários executados, mas não cobriam as falhas abaixo. Os três ensaios adicionais em PostgreSQL descartável reproduziram comportamento incorreto; o resultado positivo desses ensaios confirma a reprodução, não a conformidade.

## Pendências confirmadas

| ID | Prioridade | Referência | Evidência e correção necessária |
| --- | --- | --- | --- |
| R01 | Alta | FR-010, SC-004, Constituição IV | Uma sessão marcada com `revoked_at` ainda recebeu HTTP 200 de `/api/auth/two-factor/enable` e criou registro de MFA. O handler nativo em `apps/web/app/api/auth/[...all]/route.ts` não passa pela verificação de sessão ativa usada nas rotas `/api/v1`. Aplicar a verificação server-side às ações autenticadas de conta/MFA, cobrindo também conta desativada. |
| R02 | Alta | FR-005, FR-011, Constituição V | `/api/auth/change-password` continua acessível. Ensaio com duas sessões recebeu HTTP 200, manteve ambas e criou zero eventos de auditoria. O hook de `auth-factory.ts` valida a força da senha, mas não aplica as garantias de `account-settings-service.ts`. Bloquear rotas alternativas desnecessárias ou submetê-las às mesmas regras de auditoria, revogação, versão e invalidação de pedidos. Inventariar também alterações nativas de perfil/MFA. |
| R03 | Alta | FR-005, FR-011, FR-016, US4/AC3 | O fluxo nativo grava a senha antes de executar `onPasswordReset`; só depois encerra sessões. Com falha injetada no callback, a API retornou HTTP 500, a nova senha já funcionava e a sessão anterior continuava no banco. `auth.ts` transaciona apenas o callback. Garantir conclusão consistente de senha, consumo do link, auditoria, pedidos pendentes e sessões, com teste de falha intermediária. |
| R04 | Média | FR-002, caso de borda de falha sem sucesso indevido | Com HTTP 503 simulado, `password-recovery.tsx` exibiu “Se houver uma conta com esse e-mail, você receberá um link…” e nenhum alerta. O código trata erros HTTP apenas quando `reset=true`, salvo 429. Diferenciar indisponibilidade de solicitação aceita sem revelar se o endereço existe; testar envio indisponível e tentativa posterior. |
| R05 | Baixa | US3/AC3 | A tela orienta reiniciar uma ativação interrompida, mas não explica que a nova chave substitui a anterior nem orienta remover a configuração incompleta do aplicativo autenticador. Acrescentar orientação e conferir a retomada após sair da página. |
| R06 | Baixa | US1/AC3, FR-002/003 | Nome contendo somente espaços passa pelo `required` do navegador, é rejeitado pelo schema após trim e recebe a mensagem genérica que orienta escolher uma senha forte. Apresentar orientação correspondente ao campo/ação, preservando os outros dados. |

## Cobertura dos requisitos

| Requisitos | Situação observada |
| --- | --- |
| FR-001, FR-014, FR-017 | Menu pelo nome/Conta, Configurações/Sessões/Sair, logo e ausência de avatar implementados; teclado do menu, mobile e capturas verificados anteriormente. |
| FR-002, FR-003 | Formulários e versão implementados na rota própria; mensagens incompletas em R04/R06. Rotas alternativas precisam do fechamento descrito em R02. |
| FR-004, FR-015 | Senha atual, confirmação, diferença da anterior e política 12–72 com maiúscula/minúscula/número implementadas no fluxo de Configurações. Política compartilhada também aplicada a novas senhas nativas. |
| FR-005 | Fluxo próprio aprovado nos testes; garantias não uniformes nas rotas alternativas e em falha de recuperação: R02/R03. |
| FR-006 | Troca de e-mail por senha atual + link, 30 minutos, uso único e titularidade implementada e testada. |
| FR-007, FR-008 | Ativação TOTP e códigos de recuperação implementados e testados; revalidação de sessão na API e orientação de retomada pendentes em R01/R05. |
| FR-009 | Códigos conhecidos têm mensagens em português; navegador cobriu exigência de MFA do destinatário. Falta evidência de toda a sequência de concessão após ativação e de cada recusa na interface. |
| FR-010, FR-011 | Controles presentes na rota própria; cobertura insuficiente das rotas nativas e da falha intermediária: R01–R03. |
| FR-012 | Axe e 390px verificados nos fluxos descritos em evidence.md. Não há evidência de todas as jornadas completas exclusivamente pelo teclado; completar essa validação antes do aceite integral de SC-005. |
| FR-013 | Restrição local e procedimento de transição implementados/documentados. Envio real e entrega externa continuam pendentes para implantação. |
| FR-016 | Recuperação normal, expiração, reutilização e preservação do desafio MFA testadas. Falhas e mensagem ainda pendentes: R03/R04. |

SC-001/002 têm evidência nos fluxos normais. SC-003/005 precisam completar a matriz de validação; SC-004 não é satisfeito pelo caso reproduzido de sessão revogada em R01. Plano de transações não é integralmente cumprido pela recuperação (R03).

## Evidências adicionais desta revisão

- Banco PostgreSQL temporário criado e encerrado pelos ensaios; nenhuma conta pessoal ou banco do localhost foi alterado.
- Três reproduções isoladas: falha do callback de recuperação, MFA com sessão revogada e alteração nativa de senha sem auditoria/revogação.
- Navegador com resposta HTTP 503 interceptada localmente: mensagem condicional de envio e zero alertas; nenhuma mensagem de e-mail foi enviada nesse ensaio.
- Scripts de investigação ficam ignorados em `.cache/settings-audit.test.ts`, `.cache/settings-audit.config.ts` e `.cache/settings-ui-audit.mjs`. As correções devem criar testes permanentes que exijam o comportamento correto.

## Aceite e implantação

T009 continua aguardando revisão funcional do usuário. Também falta a revisão humana específica de autenticação exigida antes de merge. SMTP real, remetente autorizado e HTTPS são pendências de implantação, distintas das correções locais acima.

Remetente atual: `CAAB Local <caab@example.test>`. Entrega apenas no Mailpit local (`http://localhost:8025`). O remetente externo será configurado por `MAIL_FROM`.

Preferências, notificações, integrações, privacidade e exclusão de conta permanecem fora do escopo aprovado; foto/avatar foram explicitamente dispensados. Não representam funcionalidades faltantes desta spec. Associados permanece na sua branch e sem PR.

## Incremento posterior: olho para mostrar senha

FR-018 foi solicitado após esta revisão e implementado na mesma branch. Os oito campos foram conferidos por teclado e os seis fluxos Chromium passaram. As pendências da revisão continuam abertas.

## Resolução posterior — 10/09/2026

| Item | Resolução e verificação |
| --- | --- |
| R01 | Plugin/rotas MFA removidos; chamadas retornam 404. Leitura nativa de sessão rejeita sessão revogada, expirada e conta desativada; criação de sessão exige conta ativa. Regressões em PostgreSQL. |
| R02 | Lista explícita de rotas nativas permitidas bloqueia alterações alternativas de conta. Testes exigem 404 para rotas que contornavam o serviço de Configurações. |
| R03 | Recuperação usa transação única para senha, token, auditoria, pedidos e sessões. Falha injetada na auditoria retorna erro sem mudança parcial; nova tentativa funciona. Duas redefinições concorrentes têm um único vencedor. |
| R04 | HTTP 503 produz alerta e permite nova tentativa por teclado. Verificação SMTP antecede consulta da conta; endereços conhecidos e desconhecidos têm resposta equivalente durante indisponibilidade SMTP. Falha de envio desfaz o pedido. |
| R05 | Retirado por FR-019: não existe mais cadastro nem retomada do autenticador. A decisão também substitui a solicitação intermediária de botão administrativo para remover MFA. |
| R06 | Nome é validado após trim com mensagem própria. Navegador verifica nome contendo espaços e preservação do rascunho de novo e-mail. |

Verificações adicionais: links armazenados como hash, invalidação do anterior ao solicitar outro, invalidação de recuperação após troca de senha/e-mail, recusa para conta desativada, limites reais de recuperação e proteção do último administrador independente do estado legado de MFA. A migração 0012 limpa segredos, códigos e desafios com auditoria.

A concessão administrativa funciona sem autenticador; seis causas de recusa foram verificadas na interface. O botão Conta permanece na parte inferior ao recolher a navegação, com regressão de posição no navegador. Os sete campos de senha atuais mantêm o controle de visibilidade; o oitavo pertencia ao autenticador retirado.

Resultados consolidados em [evidence.md](evidence.md). A revisão não declara ausência de toda falha possível; cobre as regressões e os cenários registrados. Permanecem pendentes o aceite funcional do usuário e a configuração/validação de SMTP real fora do localhost.
