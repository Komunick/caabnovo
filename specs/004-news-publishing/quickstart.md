# Validação — Notícias

Node 24, pnpm e Docker. Dependências: PostgreSQL, MinIO e ClamAV do compose existente.
Configurar .env conforme .env.example, sem usar credenciais de produção.

Na listagem, `/news` reúne notícias com publicação no histórico; o botão Rascunhos abre
`/news/drafts` com conteúdos ainda não publicados. Digite para buscar automaticamente e
abra Mais filtros e ordenação para combinar categoria, destino previsto, destaque, capa,
período e ordenação. Nenhum botão Filtrar é necessário. Ao publicar pela primeira vez,
a notícia passa para a lista principal; edições posteriores não duplicam seu cadastro.

1. Instalar com corepack pnpm install --frozen-lockfile.
2. Subir docker compose up -d; executar corepack pnpm db:migrate e o seed DEV autorizado.
3. Executar corepack pnpm dev e corepack pnpm dev:worker em terminais separados.
4. Em /news, criar título/endereço/conteúdo, enviar imagens e aguardar liberação, salvar e
   conferir prévia. Marcar destaque/ordem quando desejado. Publicar em site/app/ambos.
5. Abrir a publicação sem login. Editar rascunho e confirmar que a publicação não muda.
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

## Consumo mobile/site

Consultar /api/v1/content/app/news ou /api/v1/content/site/news sem login, em seguida /{id} e
/{id}/media/{fileId}. Contrato e regras de cache em [contracts/news.md](contracts/news.md).
App/site externos precisam implementar consulta/renderização em seus repositórios; o painel
não apresenta consumo como confirmado. Nenhum push é enviado por publicar notícia.
