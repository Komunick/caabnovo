# Revisão da dev: correções e mudança de domínio ou repositório

Data: 10/09/2026. Branch de trabalho: `fix/news-draft-proxy-origin`.
Base remota conferida: `origin/dev` em `951c103` (Configurações da Conta, PR #13).

## Resultado da conferência

O erro de salvar rascunho **ainda não estava corrigido na dev consultada**. A rotina em
`apps/web/modules/users/http/responses.ts` continuava comparando Origin com a URL interna
da requisição, sem usar a URL pública configurada. O PR #13 acrescentou Configurações da
Conta, mas não alterou essa rotina. A nova rota de configurações também a reutiliza.

O usuário confirmou HTTP 403 e `ORIGIN_DENIED` ao salvar em
`https://caabv2dev.komunick.com/news/new`. O bloqueio de origem foi confirmado; o endereço
interno exato do servidor e suas variáveis não foram inspecionados. Testes locais reproduziram
a falha com origens pública e interna diferentes.

A instrução mais recente do usuário retomou a branch anteriormente em STANDBY e ampliou a
revisão. As alterações ficam nesta branch para revisão; o relatório não afirma implantação
no site. Nenhum banco remoto, configuração de hospedagem, ruleset ou repositório remoto foi alterado.

## Escopo e alterações

Foram pesquisados os endereços, variáveis de ambiente, referências a localhost, URLs de
redirecionamento e assinatura, configurações de autenticação/testes, conexão com banco/fila,
scripts operacionais e referências ao repositório em `apps`, `packages`, `infra` e `.github`.
A suíte existente foi executada como complemento à leitura de código. Isso não equivale a
uma garantia de ausência de defeitos em todos os caminhos, nem a uma auditoria do servidor remoto.

| Problema encontrado | Alteração nesta branch | Arquivos principais |
| --- | --- | --- |
| Origem legítima recusada quando o proxy apresenta outra URL ao Next.js | A referência passa a ser a origem de `BETTER_AUTH_URL`, sem confiar em Host/Forwarded do cliente. Sessão, permissões, CSRF e idempotência permanecem exigidos. | `apps/web/modules/shared/mutation-origin.ts`; validadores em `modules/users/http`, `modules/files/http`, `modules/audit/http` |
| URLs de aplicação sem validação adequada podiam produzir links/cookies incorretos | Validação central: HTTPS fora de loopback, URL na raiz, sem credenciais, query ou fragmento. HTTP continua disponível para testes locais. | `packages/config/src/public-origin.ts`, `packages/config/src/env.ts` |
| O endpoint interno do storage também era usado nas URLs entregues ao navegador | Novo `S3_PUBLIC_ENDPOINT` opcional para assinar upload, download, imagens de notícias e exportações de auditoria. A comunicação interna continua em `S3_ENDPOINT`. A assinatura é gerada diretamente para o host público, sem substituição posterior. | `modules/shared/storage-client.ts`, `modules/files/object-storage.ts`, `modules/audit/audit-export-service.ts` |
| A página pública de recuperação podia conservar a configuração de e-mail local do build | `/forgot-password` passa a ser renderizada por requisição e lê o modo de e-mail do ambiente em execução. A indicação de Mailpit só aparece com URL local explícita. | `app/(auth)/forgot-password/page.tsx`, `app/(admin)/settings/page.tsx` |
| Configuração de e-mail sem URL assumia `http://localhost:3000`; portas SMTP inválidas não eram recusadas | Remove o fallback de URL, valida porta inteira de 1 a 65535 e escolhe TLS implícito pela porta numérica 465. | `modules/auth/account-mail.ts` |
| Copiar `E2E_TEST_MODE=1` para o site desativava o limite de tentativas e habilitava uma rota de teste | Os recursos de teste exigem também uma URL de aplicação em loopback. A rota de revogação de sessão de teste exige origem confiável. | `modules/auth/auth.ts`, `app/api/test/revoke-current-session/route.ts`, `packages/config/src/public-origin.ts` |
| Erros emitidos em segundo plano por conexões ociosas/fila não tinham listener e podiam encerrar o processo | Acrescenta listeners para registrar códigos operacionais fixos, sem detalhes da conexão ou SQL. As consultas que falharem continuam retornando erro; não há sucesso nem retry fictício. | `packages/db/src/client.ts`, `apps/web/modules/jobs/queue.ts`, `apps/worker/src/queue.ts` |
| O script de rulesets selecionava `Komunick/caabnovo` por padrão, mesmo se copiado para outro repositório | `-Repository owner/name` passa a ser explícito; ausência interrompe antes de qualquer chamada ao GitHub. Preview continua sem escrita e somente dev pode ser alvo. | `infra/github/apply-rulesets.ps1`, `infra/github/test-rulesets.ps1` |

Não foram adicionadas dependências nem migrations. Better Auth já pertence à fundação;
a correção de origem não depende de uma nova funcionalidade de conta.

## Configuração necessária para implantar esta versão

As variáveis devem ser definidas na configuração dos serviços da hospedagem. Arquivos `.env`
locais e credenciais de exemplo não devem ser copiados para DEV publicado ou produção.

| Variável | Valor ou critério no ambiente publicado | Quem usa / efeito |
| --- | --- | --- |
| `NODE_ENV` | `production`, inclusive em DEV quando executado com `next start` | Modo de execução; o nome do ambiente DEV não significa usar `next dev` |
| `BETTER_AUTH_URL` | Em DEV: `https://caabv2dev.komunick.com` | Login, cookies, validação de origem, links de recuperação e confirmação de e-mail. Sem caminho `/news` ou `/api/auth`. Reiniciar web após mudar. |
| `BETTER_AUTH_SECRET` | Segredo gerenciado, com ao menos 32 caracteres | Preservar durante mudança de domínio/repositório, salvo rotação planejada. Não inserir neste arquivo. |
| `S3_ENDPOINT` | Endpoint da API S3 acessível pelo web e worker, podendo ser interno | Inspeção, processamento e armazenamento. Não é a URL do console administrativo do MinIO. |
| `S3_PUBLIC_ENDPOINT` | Endpoint HTTPS da mesma API S3 acessível pelo navegador | Necessário quando `S3_ENDPOINT` é interno/HTTP/localhost. Se omitido, `S3_ENDPOINT` precisa ser adequado também ao navegador. A configuração recusa endpoint de navegador HTTP ou loopback quando o painel é público. |
| `S3_REGION`, `S3_ACCESS_KEY`, `S3_SECRET_KEY` | Região e credenciais válidas para o mesmo storage | Devem ser coerentes nos serviços web e worker. Não alterar buckets/dados apenas por mudar domínio. |
| `S3_QUARANTINE_BUCKET`, `S3_PRIVATE_BUCKET`, `S3_PUBLIC_BUCKET` | Nomes dos buckets existentes | O script local `infra/storage/init.sh` usa nomes `caab-*`; se os buckets forem renomeados, reconciliar script e variáveis. Não executar inicialização local indiscriminadamente sobre storage existente. |
| `MAIL_MODE` | `smtp` | `local` é reservado a Mailpit no computador de teste. |
| `SMTP_HOST`, `SMTP_PORT` | Servidor real; normalmente 587 com STARTTLS ou 465 com TLS | Fora do local, o transport exige TLS. Porta deve ser válida. |
| `SMTP_USER`, `SMTP_PASSWORD`, `MAIL_FROM` | Credenciais e remetente autorizado | Verificar SPF/DKIM/DMARC e entrega com o provedor; não são definidos pelo código. |
| `DATABASE_URL` | PostgreSQL acessível pelo serviço, com usuário de runtime | `localhost` só é válido se o banco estiver realmente no mesmo namespace de rede. Em contêineres separados, usar DNS de serviço ou endpoint gerenciado. |
| `DATABASE_ADMIN_URL` | Conexão administrativa restrita à operação de migrations | Não usar como credencial permanente do web. |
| `CLAMAV_HOST`, `CLAMAV_PORT` | Endereço acessível pelo worker | Loopback só funciona se o antivírus estiver no mesmo namespace de rede. Imagens dependem do worker e do antivírus. |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | Endpoint do coletor acessível pelo processo | Um endpoint HTTP interno pode ser correto; não precisa ser o domínio do site. |
| `E2E_TEST_MODE` | Ausente ou diferente de `1` | Não habilitar em ambientes publicados. A proteção adicional limita o modo de teste ao loopback. |
| `DOTENV_CONFIG_PATH` | Somente se houver um arquivo de ambiente explícito montado no serviço | Atualizar o caminho se a pasta/montagem mudar. O carregador procura `.env` nos diretórios ancestrais quando essa opção está ausente. |

O proxy do storage precisa preservar o host e o caminho usados na assinatura. Configurar
CORS do storage para a origem do painel, métodos de upload/download necessários e os
cabeçalhos de checksum usados pelo cliente. Trocar o host de uma URL já assinada invalida
sua assinatura. As URLs atuais expiram em até 300 segundos; após migração, gerar URLs novas.

## Se o link/domínio do site mudar

1. Configurar DNS, certificado TLS e domínio no proxy/hospedagem para o novo endereço.
   Essa configuração não está versionada neste repositório; não há manifesto do proxy de
   `caabv2dev.komunick.com` nem workflow de deploy do site aqui.
2. Alterar `BETTER_AUTH_URL` no ambiente do web para a nova origem HTTPS, sem caminho.
   Não substituir URLs internas de banco, antivírus ou coletor pelo domínio do site.
3. Reiniciar o serviço web para recriar os singletons de autenticação/configuração.
   Se o endpoint do storage mudar, atualizar `S3_PUBLIC_ENDPOINT` e/ou `S3_ENDPOINT`
   nos serviços apropriados, reiniciar web/worker e ajustar TLS, DNS e CORS do storage.
4. Ajustar o endereço-base nos consumidores externos de `/api/v1/content/{channel}/news`
   e nos monitores. O site/app externo não faz parte deste repositório.
5. Validar links de confirmação/recuperação enviados após a mudança. Links já enviados
   continuam apontando ao domínio antigo até expirar; planejar a transição desse domínio.
6. Os cookies atuais são do host, sem domínio compartilhado configurado. É esperado que
   seja necessário fazer login no novo domínio. Não ampliar o domínio do cookie automaticamente.
7. Validar login/logout, salvar/reabrir/editar notícia, configurações da conta, upload e
   download de imagem, exportação de auditoria e recuperação de senha. Confirmar que uma
   origem externa continua recusada. Não validar enviando mensagens a destinatários reais
   sem autorização.

Rotas, links e `fetch` da interface usam caminhos relativos; não precisam de substituição
global do domínio no código. `allowedDevOrigins` em `apps/web/next.config.mjs` é configuração
do servidor de desenvolvimento do Next.js, não a lista de origens autorizadas de produção.

## Se o repositório, organização ou diretório mudar

| Local | O que revisar |
| --- | --- |
| Remoto Git de cada clone/worktree | Conferir `git remote -v` e, quando apropriado, usar `git remote set-url origin https://github.com/NOVA-ORG/NOVO-REPO.git`. Não muda o domínio do site por si só. |
| Integração da hospedagem | Trocar repositório de origem, credencial/GitHub App, webhook, branch de deploy e diretórios de build/start. Manter web e worker ligados à mesma versão compatível. |
| GitHub Actions | Recriar/conferir secrets, variables, environments, permissões e acessos de Actions no novo repositório. Workflows em `.github/workflows/ci.yml` e `promotion.yml` referem `dev`/`main`; ajustar somente se as branches também mudarem. |
| Proteções de branch | Os rulesets são configurações remotas e não são reaplicados só por copiar os JSONs. Conferir os checks `quality`, `browser`, `security` e as regras de promoção. Não contornar revisões. |
| `infra/github/apply-rulesets.ps1` | Informar `-Repository NOVA-ORG/NOVO-REPO`. Sem `-Apply` faz somente preview; aplicar exige autorização própria para mudar o ruleset. |
| `.github/CODEOWNERS` | Conferir os responsáveis `@Gabriel-Komunick` e seus acessos no novo repositório. Não presumir que a nova organização tenha os mesmos mantenedores. |
| Documentação e links de PR/evidência | Revisar links operacionais. Referências a PRs/commits antigos são evidências históricas e não devem ser substituídas em massa. |
| Caminhos locais e serviços | Atualizar cwd de build/start, `DOTENV_CONFIG_PATH`, volumes, cache e apontamentos de worktrees. `apps/web` continua sendo a aplicação web do monorepo. |
| `infra/postgres/backup.ps1` e `restore.ps1` | Passar `-Container` correto; o nome padrão local pode mudar com o projeto Compose/pasta. Não presumir que renomear o repositório move volumes ou bancos. |
| Infraestrutura externa | Confirmar banco, buckets, credenciais, certificados e backups existentes. Não executar seed ou recriar armazenamento como parte automática da troca de repositório. |

Exemplo de preview, sem alteração remota:

```powershell
./infra/github/apply-rulesets.ps1 -Repository NOVA-ORG/NOVO-REPO
```

## Referências locais que permanecem intencionais

- `.env.example`, `compose.yaml`, testes, fixtures, Playwright e CI usam serviços locais
  ou descartáveis. Não são configuração de implantação do site.
- Os links `http://localhost:8025` pertencem à interface de Mailpit, exibida somente no
  modo local validado. A página de recuperação agora decide isso em runtime.
- `http://caab.internal/...` em componentes de servidor apenas constrói um objeto Request
  para reutilizar os cabeçalhos da sessão; não faz fetch nem resolução DNS para esse host.
- `127.0.0.1:1` no gerador de migration é um endereço deliberadamente inativo para geração
  de schema; não é a conexão de runtime.
- `process.cwd()` e caminhos relativos de build/geração dependem do diretório de execução,
  não de um caminho fixo no computador do desenvolvedor.

## Validação e limites

A suíte inicial da dev integrada à correção anterior passou em 230 testes. Após as alterações:

| Verificação | Resultado |
| --- | --- |
| Unitários, contratos e integração PostgreSQL descartável | **267 testes aprovados em 47 arquivos** |
| Tipos e build de todos os pacotes, web e worker | **Aprovados** |
| Lint | **Aprovado** |
| Formatação e integridade do diff | **Aprovadas** |
| Script de rulesets com GitHub simulado | **Aprovado**: ausência de repositório não chama GitHub; alvo explícito, preview, falhas e restrição a dev verificados |
| Chromium através de proxy local | **9 testes aprovados**: Configurações da Conta, autenticação e Notícias; inclui salvar/reabrir/editar, conflito, histórico, duplicação, arquivamento e verificações de acessibilidade dos cenários |
| Mesmo build iniciado com URL pública e SMTP | `/forgot-password` retornou **200 sem link Mailpit**, e a rota de teste retornou **404**, mesmo com a flag E2E copiada |
| Auditoria de dependências | Gate high aprovado: **zero high/critical**; permanecem **3 low e 5 moderate** reportadas pelo gerenciador. Não foram atualizadas dependências nesta revisão. |

O teste Chromium usou `http://127.0.0.1:3117` como origem do navegador e proxy para
`http://127.0.0.1:3118`, executando o build de produção. O PostgreSQL foi exclusivo e
descartável, em porta separada do banco de desenvolvimento; contas e e-mails eram sintéticos.
Os testes de unidade complementam o cenário com origem HTTPS pública e URLs internas distintas.
O teste de runtime público iniciou o mesmo build com `BETTER_AUTH_URL=https://panel.example.test`
e `MAIL_MODE=smtp`; não enviou e-mails externos nem acessou esse domínio.

Na revisão final, a identificação de loopback também foi restringida a endereços IPv4
completos e IPv6/local explícitos: um domínio como `127.attacker.test` não ativa recursos
locais. Os 68 testes diretamente afetados e a verificação de tipos foram repetidos após
esse ajuste; os testes de navegador e build acima antecedem apenas esse refinamento.

Ainda é necessário revisar e implantar a branch pelo fluxo do projeto, configurar os endpoints
reais e repetir o smoke no domínio DEV. A mudança de domínio/repositório em si não foi executada.

Pendências já documentadas de produto, como política institucional de retenção em
`docs/production-readiness.md`, não foram tratadas como bugs a preencher com regras inventadas.
Não houve acesso a configurações, logs privados, banco ou infraestrutura remota nesta revisão.
