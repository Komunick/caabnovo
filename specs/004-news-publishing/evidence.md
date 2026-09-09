# Evidência de entrega — Notícias

Data: 09/09/2026. Função completa em branch feature/news-publishing, baseada em dev após o merge
de Auditoria (#11, f1b0ebd). Um PR para a função/spec 004; main não alterada e merge não executado
pelo agente. Código do app mobile/site externo não faz parte deste repositório.

## Resultado

Rascunhos incompletos, editor Lexical, capa/imagens no corpo com descrição/legenda/ordem,
histórico/restauração, duplicação, arquivamento, destaque/ordem, prévia privada, publicação,
retirada por canal, agenda em Brasília, cancelamento e retry. API pública v1 e página pública
com endereço legível. Leitura aberta por decisão expressa do usuário, revisável neste spec.
Gestão usa sessão do painel; não há permissão de Notícias, novo login, storage ou segundo worker.

## Verificações realizadas

| Gate | Resultado |
| --- | --- |
| Unitários e contratos | 107 testes, 25 arquivos, aprovados |
| Integração completa | 56 testes, 9 arquivos, PostgreSQL descartável, aprovados |
| Reenvio via Processamentos (ajuste final) | 3 testes news-worker aprovados novamente |
| OpenAPI e exemplo mobile atualizados | 6 testes contratuais aprovados |
| Typecheck workspace | Aprovado; web verificado após ajuste final |
| ESLint | Aprovado; arquivos do ajuste final verificados |
| Build Next produção | Aprovado como parte do gate E2E |
| Build completo workspace | Aprovado, incluindo CMS compartilhado e worker |
| Formatação | format:check aprovado |
| Playwright Chromium — Notícias | 7 testes aprovados, 3,1 minutos |
| Axe WCAG 2.2 AA | Zero violações nos cenários editor, seletor, publicação e público móvel |
| Dependências | Nenhum peer incompatível; geração de migration CMS offline aprovada |
| pnpm audit --audit-level high | Aprovado: 0 high/critical; 5 moderate e 3 low reportadas |

Resultados acima representam execução local; os checks remotos são consultados no PR, sem presumir resultado.
Gitleaks no diretório apontou três referências literais a env.S3_SECRET_KEY, sem valores de
credenciais, já existentes na fundação. A análise do diff introduzido é registrada no PR.
Migration 0007 preserva a formatação gerada e o checksum já aplicado em DEV; os avisos de
whitespace dessa migration não justificam reescrever uma migration aplicada. Demais arquivos
passam git diff --check.

## Evidência dos cenários

news.test.ts: transações com caab_runtime, criação/edição concorrente, rollback de auditoria,
versões, autoria confiável, sessão revogada, publicação preservada, arquivos de outra notícia,
mídia infectada/excluída/pendente, descrição obrigatória, acesso público por canal, idempotência,
três execuções concorrentes, cancelamento e retirada antiga incapaz de apagar nova publicação.

news-worker.test.ts: pg-boss real, fila e auditoria na mesma transação; horário futuro não
executa cedo; revisão agendada preserva rascunho posterior; destaque ordenado sem duplicação;
falha segura por mídia e rollback de publicação; reenvio pela agenda e Processamentos;
responsável desativado bloqueado; mídia pública revalida referência/estado.

news-publication.spec.ts: upload real no MinIO, ClamAV e worker real liberam imagem; agendamento
executa no horário e publica a revisão fixada; bytes públicos correspondem à imagem enviada.
Nova edição fica privada; retirada/arquivo tornam novas consultas 404. Outra jornada cobre
publicação só app, ambos os canais, retirada parcial, cancelamento, destaque, teclado e Axe.
news.spec.ts, news-cover.spec.ts e news-body-images.spec.ts completam editor, recuperação,
Desfazer, conflito sem perda de texto, prévia privada, mobile e não exposição de rascunhos.
Capturas/relatórios locais em test-results e playwright-report; dados exclusivamente sintéticos.

## Limites explícitos

- Consumo por consulta: disponibilidade por canal não confirma recebimento pelo app/site.
  Aplicativo externo deve integrar o contrato v1 no próprio repositório. Não há push automático.
- Retirada agendada aponta publicação já existente. Publicação nova invalida retirada antiga.
- URLs de imagens já assinadas duram no máximo 300 segundos; novas consultas revalidam tudo.
- Nenhum provedor de embed/vídeo habilitado; texto, listas, títulos e imagens estão disponíveis.
- Pendências institucionais anteriores T089 (retenção aprovada) e T095 (DEV → main) pertencem
  à fundação/governança. Esta entrega não define política de retenção nem altera main.

## Implantação e rollback

### Correção do CI no PR #12 — 09/09/2026

As execuções 34385106875 (push) e 34385576315 (pull_request) passaram quality/security,
mas browser parou antes dos testes: apt-get retornou Hash Sum mismatch no índice
dl.google.com/linux/chrome-stable/deb. O runner agora desabilita somente a fonte APT
google-chrome.list, desnecessária para o Chromium baixado pelo próprio Playwright.
Mantidos --with-deps, verificação de integridade dos pacotes e todos os testes/gates.
Correção confirmada no commit 6488cac: execuções 34388475476 e 34388480631 passaram
browser, quality e security (todos os seis checks verdes).

### Validação por campo — solicitação de 09/09/2026

FR-012 adicionada à mesma spec. Campos inválidos recebem aria-invalid, contorno vermelho,
mensagem específica em português e aria-describedby. Foco no primeiro erro; erros de publicação
retornam paths/codes seguros pela API para marcar título, endereço, corpo e mídia. Agenda indica
horário inválido no controle; digitação limpa a indicação anterior. Texto preservado em falhas.
Typecheck web, lint do escopo e 12 testes unitários passaram localmente. Novo E2E verifica
erros simultâneos em endereço/tags/ordem, borda computada, foco, correção, erros de publicação
vindos do servidor e axe em 390px. Resultado remoto desta ampliação deve ser consultado no PR.

Aplicar migrations 0007–0009 pelo executor existente antes de iniciar web/worker atualizados.
Storage privado, antivírus e worker devem estar ativos para imagens e agenda. CI provisiona
storage/antivírus e usa contas/dados sintéticos. Para rollback, retornar web/worker ao commit
anterior e preservar as tabelas/versões/arquivos; não executar DROP nem apagar histórico.
Os jobs novos ficam sem consumidor até restabelecer versão compatível; impedir novas publicações
durante manutenção. Reativar worker após corrigir causa e usar retry/cancelamento auditado.

Checklist de qualidade da spec: 16/16; marcadores preservados. Sem .specify/extensions.yml,
portanto não há hooks de pós-implementação registrados.

### Listagem, rascunhos, filtros e botões — 09/09/2026

FR-013–FR-018 implementadas na mesma spec/PR: miniatura privada com fallback, resumo de duas
linhas, revisão no detalhe, busca automática de 350ms e filtros combináveis com ordenação.
`/news/drafts` contém notícias nunca publicadas; `/news` contém as com publicação no histórico,
sem duplicar edições posteriores. Cabeçalho compacto e filtros adicionais expansíveis permitem
ver a primeira linha antes de 450px no viewport desktop testado. Botões maiores, preenchidos e
com borda marcada; contraste verificado nos temas claro e escuro. Campos esperam a interface
estar interativa antes de permitir digitação, corrigindo perda de entrada anterior à hidratação.

Validação local deste incremento: 50 testes unitários/contratuais e 25 testes de integração
PostgreSQL passaram. Cobrem consulta JSONB, filtros combinados, ordenação entre páginas,
período, separação das coleções e conservação de histórico após editar/arquivar publicação.
Typecheck web, lint do escopo, Prettier e diff check passaram.

Jornada Playwright executada no localhost em execução, sem seed/reset do banco: criou um
rascunho sintético, verificou exclusão da lista principal, busca/foco/URL, resumo, opções
combinadas, persistência após reload, falha 503/retry, limpeza e arquivamento. Axe sem violações
em 390px, nos temas claro e escuro; sem rolagem horizontal. Capturas `news-list-desktop.png`,
`news-list-mobile.png` e `news-list-dark.png` no diretório de resultados local. O E2E de publicação
também passa a conferir a miniatura real liberada pelo antivírus; sua execução é parte do CI.
Os checks remotos do novo commit devem ser consultados no PR, sem confundir com os checks
verdes dos commits anteriores citados acima. Nenhuma migration adicional neste incremento.

Operação do localhost: a capa de teste ficou em `uploaded/pending` porque o worker estava
parado; PostgreSQL, storage e ClamAV estavam saudáveis. Worker reativado em 09/09/2026 e
estado confirmado como `available/clean`, sem reenviar imagem ou ignorar a verificação.
Manter web e worker ativos durante testes de imagens e agenda.
