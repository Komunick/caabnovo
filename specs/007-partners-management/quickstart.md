# Validar Parceiros

1. Instalar dependências com corepack pnpm install --frozen-lockfile; usar infraestrutura local
   já existente ou isolada, configurar .env privado e aplicar migrations com db:migrate.
2. Administrador com partners:read/write/publish; documentos também files:read/create e worker ativo.
3. Abrir /partners, criar estabelecimento fictício, unidade, contrato com datas/condições explícitas.
4. Enviar documento sintético e aguardar liberação, aprovar contrato com justificativa.
5. Criar benefício, conferir prévia, selecionar canais e publicar. Conferir /api/v1/benefits/site.
6. Editar rascunho e confirmar publicação anterior preservada; ocultar e confirmar retirada.
7. Conferir lista geral/filtros/histórico, acessos negados e vigência vencida em testes isolados.
8. Validar em 390 px e desktop, claro/escuro, com teclado e axe; registrar evidência.

Gates: pnpm format:check, lint, typecheck, test:unit, test:contract, test:integration, build,
test:e2e --project=chromium e test:a11y. Nunca executar seed de contas sobre banco compartilhado.
Sem consulta real a OAB/Receita, mensagens ou publicação de dados reais durante testes.
Rollback: voltar aplicação e preservar tabelas opcionais/arquivos/auditoria; sem delete destrutivo.
