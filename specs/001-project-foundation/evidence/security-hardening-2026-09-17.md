# Correção de segurança — 17/09/2026

Escopo autorizado: aplicação, banco, Compose local e dependências. Configurações e
workflows GitHub excluídos. Nenhuma conta real ou serviço local alterado.

- Signup desabilitado no Better Auth e na lista de rotas. Fixtures SQL exclusivas
  de teste substituem inscrições; não existe flag para reabrir signup.
- Migration 0024 preserva o baseline editorial anterior como função explícita,
  somente para contas preexistentes sem user_access. Overrides, negações e RBAC
  dinâmico permanecem. Contas futuras começam sem permissões implícitas. Migração
  auditada como sistema; granted_by da concessão histórica usa o destinatário por
  compatibilidade com o schema, sem representar ação humana.
- CSP com nonce criptográfico por HTML e renderização dinâmica, incluindo tema.
  Scripts de produção sem unsafe-inline/eval; estilos inline mantidos por exigência
  de React/editor. ViaCEP permitido em connect-src. Anti-framing, nosniff, política
  de referência/capacidades, HSTS no HTTPS e no-store nas APIs privadas.
- Seeds recusam app/banco remoto, produção e overrides de conexão antes de abrir
  conexão. App público recusa placeholders de autenticação/banco. Portas Compose
  passam a 127.0.0.1; aplicação depende de recriar os containers quando autorizado.
- Payload e seus pacotes alinhados em 3.89.0; DOMPurify 3.4.15, YAML 2.9.1 e cópias
  transitivas vulneráveis de esbuild fixadas em 0.28.2. Audit final: zero avisos em
  todas as severidades (registro local .cache/dependencies-after.json).

Pesquisa: [release Payload](https://github.com/payloadcms/payload/releases/tag/v3.89.0)
altera também defaults de jobs; o projeto usa pg-boss e mantém jobs Payload sem
tasks/autoRun. [DOMPurify](https://github.com/cure53/DOMPurify/releases) e
[esbuild](https://github.com/evanw/esbuild/security/advisories/GHSA-67mh-4wv8-2f99).
Não inferir ausência de falhas desconhecidas a partir do audit zerado.

Validação local: formatação e lint aprovados; 467 testes de unidade/contrato
passaram. Um teste de subprocesso antigo falhou no Windows com uv_os_get_passwd
ENOMEM; permanece obrigatório no CI Linux, sem skip. Integração/E2E/build no CI.

## Implantação e reversão

Antes da implantação, conferir segredos próprios do ambiente fora dos arquivos de
exemplo; a nova validação falha de forma explícita se placeholders permanecerem.
Aplicar migrations com o runner normal. A migration bloqueia inserções de contas
durante o snapshot. Não apaga contas ou sessões; revisar a legitimidade das contas
existentes operacionalmente continua necessário. Não reescrever migration aplicada.
Rollback de código deve manter a migration restritiva; não reabrir signup nem
restaurar permissões automáticas. Uma falha de CSP deve ser corrigida por origem/
diretiva específica, sem liberar scripts inline globalmente. HTML agora dinâmico
tem custo adicional de renderização. GitHub/scanner continuam pendências fora do escopo.
