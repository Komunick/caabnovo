# Correção de origem ao salvar notícias — retomada

Registro original de espera e retomada em 10/09/2026, por solicitação do usuário.
Relatório atual: [revisão de ambiente e mudança de domínio/repositório](../../docs/DEPLOYMENT-CONFIG-AUDIT.md).

## Branch e estado

- **Status: RETOMADO.** O usuário autorizou conferir novamente a dev, ampliar a revisão,
  corrigir os erros encontrados e documentar mudanças de domínio/repositório.
- Branch local: `fix/news-draft-proxy-origin`.
- Base original: `74d7bd0`. Base atual integrada: `origin/dev`, commit
  `951c1039efb854cbc2a1fe827ef2a34a178b6f46`.
- Worktree: `.cache/check-dev-draft`, relativo à raiz do repositório principal.
- Spec responsável: `004-news-publishing`.
- Destino eventual: PR para `dev`. A correção e a revisão ampliada permanecem locais;
  nenhum push, PR, merge em dev ou implantação foi realizado.
- O ambiente remoto permanece sem esta correção.

## Problema constatado

Em `https://caabv2dev.komunick.com/news/new`, salvar um rascunho retorna HTTP 403. O usuário
confirmou o código `ORIGIN_DENIED` na resposta. O navegador reproduziu a mensagem genérica;
a listagem de notícias funcionou. O aviso de Permissions-Policy é independente desse bloqueio.

A rota de Notícias usa `validateMutationRequest`, que na base `74d7bd0` compara o cabeçalho
Origin com `new URL(request.url).origin`. Essa regra está inalterada desde `0f18f4e`, de
08/09/2026. Testes locais reproduziram a recusa quando a origem pública difere da URL interna
do proxy. O endereço interno exato e as variáveis do servidor remoto não foram inspecionados.

Better Auth já integra o login da fundação. A orientação para trocar BETTER_AUTH_URL por uma
URL pública HTTPS também existe no quickstart da spec `006-account-settings`, no worktree
local `.cache/pr-account-settings`. Esses artefatos não estavam na dev na investigação inicial;
entraram depois pelo PR #13 (`951c103`), sem alterar a validação de gravação.

## Alteração proposta para revisão posterior

Usar a origem pública configurada em `BETTER_AUTH_URL`, a mesma configuração da autenticação,
como referência confiável. Centralizar a regra em `apps/web/modules/shared/mutation-origin.ts`
e aplicá-la aos validadores de Notícias/Usuários, Arquivos (incluindo imagens das notícias) e
Auditoria, que repetem a comparação atual.

Preservar sessão, permissões, CSRF e idempotência; não aceitar domínios arbitrários nem confiar
em Host/Forwarded enviados pelo cliente. Em produção, configuração ausente ou inválida deve
recusar a operação. Sem nova permissão editorial, dependência ou migration.

## Evidências já disponíveis

O rascunho local passou em 103 testes unitários, typecheck do web, lint e formatação dos
arquivos alterados e build de produção web. Os testes verificam POST 201/PUT 200 por proxy,
rejeição de origens externas, CSRF e idempotência. Esses resultados não comprovam implantação
nem sucesso de gravação no ambiente remoto. Detalhes em [evidence.md](evidence.md).

## Pendências de entrega após a revisão local

1. A dev atual foi conferida e integrada nesta branch, preservando outros worktrees.
2. Revisar as alterações e confirmar no ambiente de destino
   `BETTER_AUTH_URL=https://caabv2dev.komunick.com`.
3. Validar os testes aplicáveis e submeter a correção ao fluxo de revisão para dev.
4. Após implantação autorizada, criar, reabrir e editar um rascunho pelo domínio público,
   verificando POST 201 e PUT 200; conferir também o envio de imagem e a proteção de origem.

As tarefas da correção são T026 e T027 em [tasks.md](tasks.md). T027 permanece pendente.
