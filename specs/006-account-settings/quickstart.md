# Validação do incremento — Conta: conciliação e regressão dos controles existentes

**Operação vigente — 21/09/2026:** localhost permanece desligado até ordem explícita.
Rotinas abaixo são roteiros para ambiente autorizado; usar banco descartável em
testes e preservar o banco principal. Portas/branches antigas são histórico, não
origem de preview atual. Nenhum teste foi executado pela revisão documental.

## Estado e pré-requisitos

Pré-requisitos de execução futura: Node 24/pnpm do package.json, dependências fixadas,
PostgreSQL 18 descartável/Testcontainers e Chromium no CI. Nunca usar banco do preview
ou contas reais como seed. Localhost continua desligado; os comandos abaixo são roteiro,
não foram executados neste planejamento. Variáveis/segredos seguem `.github/workflows/ci.yml`.

```powershell
corepack pnpm install --frozen-lockfile
corepack pnpm test:unit
corepack pnpm test:contract
corepack pnpm test:integration apps/web/tests/integration/account-settings.test.ts
corepack pnpm test:e2e account-settings.spec.ts --project=chromium
corepack pnpm test:a11y --project=chromium
```

O job browser existente prepara ambiente/contas sintéticos; não copiar seus seeds
para o preview principal. Testes de migração/conflito usam banco descartável. Antes
de entrega de código, completar format/lint/typecheck/build/security e evidências
visuais pelo workflow de CI, sem iniciar builds/serviços pesados no computador.

## Jornada independente

Usuário comum acessa sua conta, não altera outra nem ganha permissão; gestor concede sem MFA/justificativa, recusas permanecem específicas e último administrador protegido.

Verificar apenas os controles e a matriz de coordenação descritos no plano, sem ampliar funções pessoais ou institucionais.

Matriz negativa: anônimo, sessão revogada, sem acesso, leitura sem geral, geral sem
leitura, leitura+geral sem escrita, campo proibido, operação de outro usuário e
revogação entre lotes. Preservar filtros após falha; interrupção não retorna sucesso.
Testar teclado,390 px, desktop e temas. Módulos negados têm zero entradas no menu,
busca e Início; controles pessoais da conta continuam disponíveis.

## Evidência esperada

Registrar comandos, versões/commit, fixtures sintéticas, resultados, arquivos
validados e capturas em `specs/006-account-settings/evidence/plan-2026-09-21-validation.md`
(arquivo futuro). Nunca marcar tarefas como concluídas por este roteiro.
Requisitos e representações: [modelo](data-model.md), [contrato](contracts/exports.md).

## Roteiro anterior — histórico

Não executar serviços/seeds indicados abaixo no preview principal. O roteiro atual
usa CI/banco descartável; passos substituídos não autorizam reativação local.

<details>
<summary>Roteiro anterior preservado</summary>

# Validação local e transição de ambiente

## Localhost

1. Aplicar migrations da branch com a conexão administrativa local: `0011_account_email_change.sql` e `0012_remove_authenticator.sql`. A segunda limpa segredos, códigos e desafios legados de MFA e registra auditoria, conforme a decisão em [authenticator-removal.md](authenticator-removal.md). São independentes de Associados; a numeração 0010 está reservada pela branch desse módulo.
2. Iniciar Mailpit restrito a loopback:

```powershell
docker run -d --name caab-settings-mailpit -p 127.0.0.1:1025:1025 -p 127.0.0.1:8025:8025 axllent/mailpit:v1.27.4
```

3. Configurar somente no arquivo local ignorado:

```dotenv
MAIL_MODE=local
SMTP_HOST=127.0.0.1
SMTP_PORT=1025
BETTER_AUTH_URL=http://localhost:3105
```

4. Abrir o menu no próprio nome, Configurações da conta. Validar nome, senha, novo e-mail e recuperação de senha pelo link no login com uma conta sintética. Verificar ausência do autenticador no login e em Configurações e posição inferior do botão Conta ao recolher a navegação. Os links chegam a `http://localhost:8025`; não são entregues à caixa real do destinatário.
5. Para testar uma confirmação, abrir o link da mensagem e usar a conta que solicitou a mudança. O token fica no fragmento, é removido da barra pelo cliente e não deve aparecer em logs de acesso.

## Obrigatório antes de sair do local

Guia transversal atualizado: [domínio, SMTP, storage e repositório](../../docs/DEPLOYMENT-CONFIG-AUDIT.md).
A URL pública deve ser explícita, HTTPS e sem caminho/query/fragmento; a configuração de
e-mail não assume mais localhost quando BETTER_AUTH_URL está ausente. A página de recuperação
lê o modo de e-mail durante a requisição, sem preservar a configuração local do build.

- Substituir `MAIL_MODE=local` por `MAIL_MODE=smtp`.
- Definir `SMTP_HOST`, `SMTP_PORT` (587 com STARTTLS ou 465 com TLS), `SMTP_USER`, `SMTP_PASSWORD` e `MAIL_FROM` por configuração de implantação/segredos.
- Definir `BETTER_AUTH_URL` com a URL pública HTTPS correta.
- Não publicar Mailpit nem copiar suas configurações, mensagens de teste ou credenciais locais para outro ambiente.
- Validar remetente autorizado, entrega real, tratamento de indisponibilidade, validade de 30 minutos e uso único dos links no ambiente de destino.
- Verificar que a aplicação recusa modo local quando a URL pública não é loopback. Essa proteção é testada; testes locais não comprovam entrega externa.
- Nenhuma credencial real deve entrar no repositório. A ativação de envio externo exige configuração do responsável pela implantação.

## Rollback

Reverter o código da feature preserva usuários e credenciais. Pedidos pendentes deixam de ser confirmáveis pela interface anterior e expiram; não remover tabelas nem alterar o histórico de auditoria para reverter uma versão.

A remoção dos segredos de MFA pela migração 0012 não é revertida pelo rollback do código. Uma eventual reintrodução do autenticador exige uma nova decisão de escopo e um novo cadastro das chaves; não restaurar segredos antigos.

</details>
