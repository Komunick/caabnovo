# Senha inicial — validação em 17/09/2026

Entrega: `fix/employee-initial-password-20260917`; specs responsáveis 001 e 006.
Formato solicitado: uma palavra aleatória seguida de seis dígitos. Lista revisada de
252 palavras, com inicial maiúscula, sem acentos e pelo menos seis letras. Sorteios
independentes com crypto.randomInt; zeros iniciais preservados. Vocabulário público
não é segredo e não deve ser apresentado como fonte de alta entropia.

Contas novas recebem hash Better Auth na mesma transação de cadastro, funções,
auditoria e idempotência. Senha retornada somente na criação; repetição não substitui
credencial e retorna null. A interface apresenta recibo temporário, mostrar/ocultar,
copiar e abrir cadastro. Não há envio de e-mail automático nem armazenamento em rascunhos.

Conta antiga sem senha: ação no detalhe com users:create/users:update/roles:grant,
sessão revalidada, autoridade sobre todos os acessos do destinatário e lock transacional.
Não permite autogeração, destinatário desativado ou substituir uma senha existente.
Usuário informou que existe apenas uma conta nessa situação; não há backfill em lote
nem identificação da conta real no código/fixtures.

## Evidências locais

- Typecheck e lint aprovados.
- Formatação e git diff --check aprovados.
- Unidades/contratos: 464 passaram; um teste antigo de production-readiness falhou no
  Windows ao iniciar tsx (`uv_os_get_passwd` / ENOMEM), antes de executar a regra testada.
  Esse teste permanece obrigatório no CI Linux, sem skip ou alteração de expectativa.
- Contratos OpenAPI: três testes aprovados após atualização da resposta e rota.
- Gitleaks 8.28.0 sobre `origin/dev..7927259`: três commits, 71,77 KB, nenhum segredo.
  Isto é a execução real local; a limitação conhecida do scanner em container no CI,
  registrada na revisão anterior, não foi usada como comprovação de segurança.
- Revisão manual do vocabulário eliminou termos com uso ofensivo ou ambíguo; teste de
  regressão impede a reintrodução de exemplos removidos. Adições exigem nova revisão.

## Validação remota

[CI de implementação](https://github.com/Komunick/caabnovo/actions/runs/35247979170),
commit 68ee80a. Inclui testes novos de integração (credencial/login/recuperação,
concorrência/idempotência, rollback e negações), testes HTTP e jornada E2E com login
real de usuário sintético, recibo desktop/mobile, acessibilidade e conta sem senha.

A primeira execução detectou incompatibilidade entre o default histórico de issuer
do banco e Better Auth 1.7.2. A implementação passou a usar
`createLocalAccountIssuer("credential")` da biblioteca, inclusive para uma linha
legada sem hash. O segundo CI confirmou login e recuperação, concorrência,
preservação de senhas existentes e rollback; um fixture adicional precisou separar
parâmetros SQL text/uuid. Nenhuma expectativa de segurança foi reduzida.

[CI da correção](https://github.com/Komunick/caabnovo/actions/runs/35249227008),
commit 29b90f9: qualidade aprovada, 347 testes unitários, 118 contratos e 210
integrações passaram, incluindo nove testes de senha inicial. Build de produção,
formatação, lint e typecheck aprovados. O teste afetado pelo ambiente Windows
passou no Linux sem alteração.

[Navegador aprovado](https://github.com/Komunick/caabnovo/actions/runs/35248817223)
na execução 35248817223: 79 E2E e seis testes de acessibilidade passaram. O código de
aplicação é idêntico ao de 29b90f9; a única alteração posterior foi o parâmetro do
fixture de integração. Capturas desse run inspecionadas visualmente:
[desktop](initial-password-desktop.png) e [mobile](initial-password-mobile.png).
Recibo legível, senha mascarada e ações visíveis. A tabela preexistente abaixo do
recibo continua com colunas estreitas em mobile; não foi redesenhada nesta correção.

Screenshots são de contas sintéticas e mantêm a senha mascarada. Não iniciar localhost
nem banco local para essa validação. Nenhum reset da conta real, merge ou deploy realizado.
