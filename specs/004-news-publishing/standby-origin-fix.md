# Correção de origem ao salvar notícias — em espera

Registro de 10/09/2026, por solicitação do usuário.

## Branch e estado

- **Status: STANDBY. Aguardar instrução explícita para retomar.**
- Branch local: `fix/news-draft-proxy-origin`.
- Base: `origin/dev`, commit `74d7bd0cbddd10f21f299fc0c9c3ef60a65c78d2`.
- Worktree: `.cache/check-dev-draft`, relativo à raiz do repositório principal.
- Spec responsável: `004-news-publishing`.
- Destino eventual: PR para `dev`, somente após retomada autorizada.
- O rascunho de código e testes já preparado fica preservado localmente. Isso não constitui
  autorização para continuar a implementação, fazer push, abrir PR, merge ou implantação.
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
local `.cache/pr-account-settings`; esses artefatos ainda não estão na dev. Isso não alterou
a validação de gravação e a correção não depende da entrega de Configurações da Conta.

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

## Retomada, somente quando solicitada

1. Conferir a dev atual e reconciliar esta branch preservando trabalhos em outros worktrees.
2. Revisar o rascunho e confirmar no ambiente de destino
   `BETTER_AUTH_URL=https://caabv2dev.komunick.com`.
3. Validar os testes aplicáveis e submeter a correção ao fluxo de revisão para dev.
4. Após implantação autorizada, criar, reabrir e editar um rascunho pelo domínio público,
   verificando POST 201 e PUT 200; conferir também o envio de imagem e a proteção de origem.

As tarefas da correção são T026 e T027 em [tasks.md](tasks.md). T027 permanece pendente.
