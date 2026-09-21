# Validação do incremento — Notícias: concessão explícita e exportação

## Estado e pré-requisitos

Pré-requisitos de execução futura: Node 24/pnpm do package.json, dependências fixadas,
PostgreSQL 18 descartável/Testcontainers e Chromium no CI. Nunca usar banco do preview
ou contas reais como seed. Localhost continua desligado; os comandos abaixo são roteiro,
não foram executados neste planejamento. Variáveis/segredos seguem `.github/workflows/ci.yml`.

```powershell
corepack pnpm install --frozen-lockfile
corepack pnpm test:unit
corepack pnpm test:contract
corepack pnpm test:integration apps/web/tests/integration/news.test.ts
corepack pnpm test:e2e news.spec.ts --project=chromium
corepack pnpm test:a11y --project=chromium
```

O job browser existente prepara ambiente/contas sintéticos; não copiar seus seeds
para o preview principal. Testes de migração/conflito usam banco descartável. Antes
de entrega de código, completar format/lint/typecheck/build/security e evidências
visuais pelo workflow de CI, sem iniciar builds/serviços pesados no computador.

## Jornada independente

Conta sem user_access e sem papel não recebe Notícias; leitor/editor/publicador mantêm ações distintas; publicado público continua; três formatos não vazam revisão privada no contexto de publicada.

Para cada dataset do contrato, abrir Exportar [módulo], variar filtros, selecionar/reordenar colunas por teclado e baixar Excel/CSV/PDF. Ler arquivos com parsers independentes, confrontar IDs/contagem/conteúdo/ordem com a massa conhecida. Vazio mantém cabeçalho; mais de uma página não corta resultados.

Matriz negativa: anônimo, sessão revogada, sem acesso, leitura sem geral, geral sem
leitura, leitura+geral sem escrita, campo proibido, operação de outro usuário e
revogação entre lotes. Preservar filtros após falha; interrupção não retorna sucesso.
Testar teclado,390 px, desktop e temas. Módulos negados têm zero entradas no menu,
busca e Início; controles pessoais da conta continuam disponíveis.

## Evidência esperada

Registrar comandos, versões/commit, fixtures sintéticas, resultados, arquivos
validados e capturas em `specs/004-news-publishing/evidence/plan-2026-09-21-validation.md`
(arquivo futuro). Nunca marcar tarefas como concluídas por este roteiro.
Requisitos e representações: [modelo](data-model.md), [contrato](contracts/exports.md).

## Roteiro anterior — histórico

Não executar serviços/seeds indicados abaixo no preview principal. O roteiro atual
usa CI/banco descartável; passos substituídos não autorizam reativação local.

<details>
<summary>Roteiro anterior preservado</summary>

# Validação — Notícias

Node 24, pnpm e Docker. Dependências: PostgreSQL e ClamAV do compose existente.
Configurar .env conforme .env.example, sem usar credenciais de produção.

Atrás de proxy, `BETTER_AUTH_URL` deve conter a URL pública do painel (esquema, domínio e
porta pública, quando houver), e não o endereço interno do contêiner. A origem da gravação
é conferida contra essa configuração. Após implantar, criar um rascunho, reabrir e editar:
esperar POST `/api/v1/news` com 201 e PUT com 200. Um 403 `ORIGIN_DENIED` exige conferir
essa configuração; não liberar origens arbitrárias nem remover a proteção CSRF.

Na listagem ativa, `/news` exibe a versão publicada também usada pela inicial; Rascunhos abre
`/news/drafts` com notícias sem publicação vigente, inclusive retiradas. Arquivadas preservam
a localização histórica no filtro Exibir. Digite para buscar automaticamente e
abra Mais filtros e ordenação para combinar categoria, destino previsto, destaque, capa,
período e ordenação. Nenhum botão Filtrar é necessário. Ao publicar pela primeira vez,
a notícia passa para a lista principal; edições posteriores não duplicam seu cadastro.

1. Instalar com corepack pnpm install --frozen-lockfile.
2. Subir docker compose up -d; executar corepack pnpm db:migrate e o seed DEV autorizado.
3. Executar corepack pnpm dev e corepack pnpm dev:worker em terminais separados.
4. Em /news, criar título/endereço/conteúdo, enviar imagens e aguardar liberação, salvar e
   conferir prévia. Marcar destaque/ordem quando desejado. Publicar em site/app/ambos.
5. Abrir a publicação sem login. Editar e usar “Retirar publicação e salvar rascunho”: a notícia
   sai dos cards publicados da inicial e dos canais, e o texto salvo aparece em Rascunhos
   e em “Para continuar”. Conferir que agendas pendentes foram canceladas.
6. Agendar publicação futura em Brasília, editar posteriormente e conferir revisão fixa.
   Cancelar outra ação pendente. Retirar somente um canal; arquivar retira todos.
7. Falhas aparecem na agenda e em Auditoria → Processamentos conforme acesso existente.
   Tentar novamente mantém a revisão. No limite de tentativas, cancelar/criar nova ação.

## Testes reproduzíveis

Na raiz:

~~~powershell
corepack pnpm format:check
corepack pnpm lint
corepack pnpm typecheck
corepack pnpm test:unit
corepack pnpm test:contract
corepack pnpm test:integration
corepack pnpm build
corepack pnpm security:scan
~~~

Integração aplica migrations em PostgreSQL descartável e usa caab_runtime. Verifica rollback
de auditoria/fila, concorrência, revisão fixa, três execuções, cancelamento, mídia inválida,
conta desativada, retry e destaque único. Não altera banco DEV.

Para navegador, usar porta livre separada do dev:

~~~powershell
$env:PLAYWRIGHT_BASE_URL='http://localhost:3100'
$env:BETTER_AUTH_URL='http://localhost:3100'
node node_modules/@playwright/test/cli.js test --config apps/web/playwright.config.ts news --project chromium
~~~

O setup E2E aplica migrations no DEV e usa contas sintéticas. Compila/inicia produção local;
news-publication.spec.ts inicia/encerra worker para verificar antivírus e horário real, podendo
levar até três minutos. Os outros cenários cobrem edição, conflito, histórico, capa e imagens,
teclado, Axe e tela móvel. Evidência em test-results e [evidence.md](evidence.md).

## Editor e publicação direta

Em Nova notícia, envie uma capa ou use Imagem na barra do corpo, mesmo antes do título.
Descreva a imagem, escreva e escolha os destinos em Publicação e agenda. Publicar agora salva
o conteúdo e publica após confirmação; Salvar rascunho é opcional. A verificação da imagem deve
terminar antes da publicação. Salvar e visualizar abre a prévia com Site, Mobile e Lado a lado.
O endereço é automático; a pergunta de personalização abre a configuração opcional.

`news-direct-publish.spec.ts` cobre capa/corpo antes do título e publicação sem salvar manualmente,
além de publicação direta sem imagens. `news-editor-experience.spec.ts` cobre estilos, endereço e
prévia responsiva. No localhost existente, usar configuração local sem global setup/seed/reset.
Manter o worker ativo para liberar as imagens. O refinamento integra o mesmo PR de Notícias,
com destino dev e merge manual após os checks; não há PR de documentação separado.

## Consumo mobile/site

Consultar /api/v1/content/app/news ou /api/v1/content/site/news sem login, em seguida /{id} e
/{id}/media/{fileId}. Contrato e regras de cache em [contracts/news.md](contracts/news.md).
App/site externos precisam implementar consulta/renderização em seus repositórios; o painel
não apresenta consumo como confirmado. Nenhum push é enviado por publicar notícia.

</details>
