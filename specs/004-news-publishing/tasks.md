# Tasks: Notícias e publicação editorial

**Status**: função completa implementada e validada; PR único para dev. Testes obrigatórios conforme spec. Este arquivo recebe também futuras mudanças da
função; não criar specs de suas melhorias.

## Phase 1 — Setup

- [x] T001 Pesquisar mercado e compatibilidade e registrar decisão de acesso em
      `specs/004-news-publishing/research.md` e `spec.md`.
- [x] T002 Definir plano/modelo/contratos/validação em `specs/004-news-publishing/plan.md`,
      `data-model.md`, `contracts/news.md` e `quickstart.md`.

## Phase 2 — Fundação

- [x] T003 Criar regressões de metadados/comandos em `packages/contracts/tests/news.test.ts`.
- [x] T004 Implementar schemas estritos e exportar em `packages/contracts/src/news.ts` e `index.ts`.

## Phase 3 — US1 Rascunhos (P1)

Teste independente: rascunho incompleto recuperável; edição obsoleta não sobrescreve; histórico
preservado.

- [x] T005 [US1] Testar acesso herdado, autoria confiável e versão em
      `apps/web/modules/news/draft-policy.test.ts`.
- [x] T006 [US1] Implementar preparação de comandos em `apps/web/modules/news/draft-policy.ts`.
- [x] T007 [US1] Integrar Payload/Lexical com migrations revisadas, sem segundo login/upload/worker,
      em `apps/web/modules/news/payload/` e `apps/web/package.json`; provar rollback com auditoria e
      edição concorrente em `apps/web/tests/integration/news.test.ts` antes de expor escrita.
- [x] T008 [US1] Implementar persistência/versões/criar/editar/duplicar/arquivar/restaurar em
      `apps/web/modules/news/news-service.ts` e rotas autenticadas `apps/web/app/api/v1/news/`.
      Concluído incluindo retirada dos canais públicos e cancelamento de agendamentos na mesma
      operação de arquivamento, preservando histórico.
- [x] T009 [US1] Implementar lista/editor/histórico, integrar arquivos existentes e catálogo em
      `apps/web/app/(admin)/news/`, `apps/web/modules/news/ui/` e
      `apps/web/modules/workspace/areas.ts`. Lista com busca/filtros/paginação, editor Lexical,
      histórico, catálogo, capa e imagens no corpo implementados. Imagens usam upload/quarentena
      existentes; descrição, legenda, ordenação, remoção, Desfazer e recuperação validados.

## Phase 4 — US2 Publicação (P1)

Teste independente: edição não altera publicação; prévia privada; conteúdo/mídia inválidos não
publicam.

- [x] T010 [US2] Testar precondições de publicação em
      `apps/web/modules/news/publication-policy.test.ts`.
- [x] T011 [US2] Implementar validação server-side em `apps/web/modules/news/publication-policy.ts`.
- [x] T012 [US2] Implementar sanitização/renderer Lexical e prévia privada em
      `apps/web/modules/news/ui/` e `apps/web/app/(admin)/news/[newsId]/preview/page.tsx`; definir
      provedores de embed em `specs/004-news-publishing/contracts/news.md` antes de habilitá-los.
      Renderer textual e prévia autenticada concluídos. Nenhum provedor de embed habilitado.
- [x] T013 [US2] Integrar publicação transacional e referências de arquivos disponíveis em
      `apps/web/modules/news/news-service.ts`; documentar API implementada em
      `packages/contracts/src/openapi.ts` e testar XSS/arquivo/acesso em
      `apps/web/tests/integration/news.test.ts`.
      Concluído: publicação/retirada e auditoria transacionais, APIs administrativas/públicas,
      mídia revalidada e revisão pública preservada; contratos v1 documentados.

## Phase 5 — US3 Agenda e distribuição (P2)

Teste independente: cancelar impede publicação e três execuções produzem um efeito por destino.

- [x] T014 [US3] Definir contratos app/site, incluindo entrega e credenciais por ambiente, em
      `specs/004-news-publishing/contracts/news.md` antes de conectar consumidores reais.
      Concluído: leitura aberta aprovada pelo usuário; API pública de consulta por canal, mídia
      e página pública. Consumidores externos integram o contrato em seus repositórios; não há
      confirmação de consumo presumida ou credencial de leitura pendente.
- [x] T015 [US3] Implementar agendar/cancelar/retirar/distribuir com idempotência e auditoria em
      `apps/web/modules/news/news-service.ts` e `apps/worker/src/jobs/publish-news.ts`; testar
      revisão fixa, cancelamento e retry em `apps/web/tests/integration/news-worker.test.ts`.

## Phase 6 — Verificação e entrega

- [x] T016 Validar editor, publicação, histórico, agenda e acessibilidade em
      `apps/web/tests/e2e/news.spec.ts`; atualizar `specs/004-news-publishing/evidence.md`,
      `docs/MODULES.md` e tarefas do programa; rodar gates completos antes do PR da função completa.

## Dependencies & Execution Order

### Experiência de edição — concluída e validada localmente

- [x] T020 Reorganizar escrita/configurações e implementar barra familiar de formatação com
      desenho próprio, incluindo sublinhado/tachado seguros e estilos ativos.
- [x] T021 Substituir seleção textual de imagens por biblioteca visual, envio por arrastar,
      prévia local identificada e inserção no ponto de edição.
- [x] T022 Compartilhar renderer com a leitura pública e oferecer Site/Mobile/Lado a lado.
- [x] T023 Automatizar endereço curto do título com personalização opcional e links estáveis.
- [x] T025 Permitir imagens desde a criação e salvar automaticamente ao publicar/agendar,
      preservando edição, vínculo privado dos arquivos e validações existentes.
- [x] T024 Validar editor, imagens, publicação, prévia responsiva e documentação no localhost.
      Fechamento do PR único de Notícias autorizado após o aceite; destino dev e merge manual.

### Refinamento solicitado em 09/09/2026

- [x] T017 Atualizar a mesma spec com miniaturas, resumo em duas linhas, filtros automáticos,
      botões visíveis, mais opções de filtro/ordenação e subpágina de rascunhos.
- [x] T018 Implementar listagem compacta, `/news/drafts`, contratos e consulta paginada com
      filtros combináveis, mantendo acesso e histórico existentes.
- [x] T019 Validar integração, contratos, navegador/Axe em desktop e celular e atualizar o
      PR existente da função com evidências finais.


T001/T002 → T003/T004 → T005/T006 → T007/T008/T009 para US1. T010/T011 dependem só dos contratos e
do acesso definido; podem avançar enquanto T007 é preparado. T012/T013 exigem T007/T008/T011. T014
antecede consumidores reais; T015 depende de T013/T014. T016 encerra a função após todas as
histórias. Estado atual: T001–T016 concluídos. Editor, publicação, API pública, agenda, worker, mídia e
acessibilidade validados. Evidências e limites em evidence.md; nenhum PR preliminar.

## Oportunidades independentes e estratégia

Após contratos, testes US1 e US2 usam arquivos distintos. UI US1 e renderer US2 podem ser preparados
separadamente após serviço; contratos de consumidores US3 independem da edição. Integração e
migrations são sequenciais. Essas possibilidades não autorizam agentes ou PRs adicionais. Concluir
incrementos locais, registrar evidência parcial sem marcar a função pronta. MVP funcional será US1
com banco/editor; validações isoladas são apenas início de implementação.

## Correção de proxy — 10/09/2026

**RETOMADO por solicitação do usuário.** Branch `fix/news-draft-proxy-origin`, base atual `951c103`.
Revisão ampliada e correções locais autorizadas. Implantação no ambiente remoto ainda pendente.
Contexto e plano de retomada: [standby-origin-fix.md](standby-origin-fix.md).

- [x] T026 Preparar rascunho local de origem confiável usando BETTER_AUTH_URL nos validadores
      compartilhados e testar gravação por proxy, origens externas, CSRF e idempotência.
- [ ] T027 Após retomada autorizada, revisão e implantação em DEV, salvar e reabrir rascunho pelo domínio público,
      confirmando POST 201 e PUT 200 no navegador.

- [x] T028 Revisar a dev atual, configuração pública, links/storage, e-mail, modo de teste,
      conexões e referências ao repositório; corrigir problemas confirmados e registrar o
      roteiro de mudança em `docs/DEPLOYMENT-CONFIG-AUDIT.md`.
