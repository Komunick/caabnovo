# Histórico do caderno de trabalho — 23/09/2026

Arquivo encerrado, preservado por CODEX a pedido de mafaltti. Não é fila de execução nem estado
atual. As assinaturas originais foram mantidas; nenhuma autoria desconhecida foi inferida. Os
pedidos de produto foram encaminhados às tarefas do programa 002. Caminhos locais e checkpoints
abaixo são históricos. A auditoria registrada aqui foi tratada pela revisão documental de
23/09/2026.

# Memória de trabalho do agente

Memória operacional dos pedidos e trabalhos do projeto CAAB. As instruções de trabalho ficam no
[AGENTS.md](../../AGENTS.md); regras de produto e critérios técnicos ficam nas specs e na stack.
Atualizado em **23/09/2026**. Caminho canônico:
`docs/agentcache.md (relativo à raiz do repositório)`.

Leia primeiro o AGENTS.md e depois o estado atual e a fila relacionados à tarefa. Consulte as specs
para detalhes técnicos. Registros históricos não autorizam retomar ações já concluídas nem
substituem a conferência dos arquivos e do repositório remoto.

## Correção documental e caderno temporário-CODEX-mafaltti

**Estado:** em andamento. **Pedido:** corrigir a auditoria e tornar o agentcache temporário. **Em
execução:** preservar fontes, conciliar regras/rotas e retirar registros concluídos. **Próximo
passo:** corrigir documentos, conferir links e formato, transferir informação durável para suas
fontes e remover esta anotação ao concluir. Sem autorização para abrir PR ou publicar.

## Identidade verificada nesta sessão-CODEX-mafaltti

- **IA autora:** CODEX.
- **Solicitante pelo perfil GitHub:** mafaltti.
- **Login autenticado:** Danilo-Komunick.
- **ID GitHub:** 299503820.
- **Fonte:** integração GitHub conectada; consultas autenticadas de perfil e login.
- **Verificação:** 23/09/2026, nesta sessão; reutilizar durante toda esta sessão. Consultar
  novamente apenas no início de uma nova sessão, usando a conta conectada naquele computador.
- **Formato:** `descrição-IA-solicitante`; exemplo desta sessão: `Atualizar AGENTS-CODEX-mafaltti`.
- **Leitura:** cada título assina seu bloco; cada linha de tabela possui assinatura própria.
- **Histórico:** solicitante não verificado não equivale ao perfil atual. A autoria CODEX é indicada
  apenas nos blocos/linhas cuja redação foi produzida nesta conversa; a frente de Colaboradores foi
  recebida de outra conversa e permanece com autoria não identificada.
- **Limite:** a consulta confirma a conta GitHub conectada, não a identidade civil de quem opera uma
  conta compartilhada. Nenhum pedido antigo foi reatribuído por essa consulta.

## Revisão da função dos documentos: verificação concluída-CODEX-mafaltti

**Pedido:** conferir se cada documento cumpre sua função na organização atual. **Data:** 23/09/2026.
**Autoria/solicitante:** CODEX/mafaltti; identidade já consultada nesta sessão.

**Escopo e evidência:** leitura dos documentos centrais e comparação dirigida com manifests, código
de autenticação e tarefas. Conferência estrutural das dez specs: todas contêm spec, plan e tasks.
Verificação automática em 199 arquivos Markdown encontrou 716 links locais em sintaxe inline, sem
destino ausente. Não valida âncoras, URLs externas, todas as formas de Markdown, conformidade
funcional de cada requisito, ambiente remoto ou execução dos testes de produto.

**Achados pendentes:**

- AGENTS cumpre a função de entrada e regras, mas está ignorado pelo Git. Agentcache e guia de
  design estão presentes em docs e ainda sem commit: esta organização não é distribuída a outro
  computador por um clone da versão atual do repositório.
- Agentcache preserva pedidos e assinaturas, mas acumula checkpoints concluídos e indicações antigas
  de pasta limpa/localização do guia. Separar estado corrente de histórico; o Git agora mostra
  agentcache e caab-design como arquivos novos, ainda sem commit.
- DELIVERY-WORKFLOW manda abrir PR quando pronto (linhas 33, 67 e 122), sem a condição de pedido
  explícito do AGENTS; aponta limites locais para AGENTS, embora estejam no agentcache.
- PRD exige motivo no fluxo de remarcação/cancelamento (linha 263), enquanto AGE-006 dispensa
  justificativa (linha 322). PRD/STACK também generalizam dispensa de motivos, sem refletir a
  exceção vigente para exclusão de Colaboradores/Associados na constituição 2.1.0.
- MODULES ainda lista cadastro público, conflitos de rascunho e cargos como pendentes. T096/T097 e
  T103 estão concluídas em 001; auth-factory.ts contém disableSignUp: true. Atualizar o mapa atual,
  preservando a data e as evidências dos inventários históricos.
- STACK mistura planejamento e estados de produto com arquitetura; resumo lista TanStack apesar da
  ressalva de não adoção e dos manifests atuais. FullCalendar aparece adotado e condicional. A seção
  de testes precisa ligar tipos de alteração às suítes/comandos e fontes executáveis.
- caab-design cumpre seu papel, mas sua evidência depende de arquivo local em .cache. UI-BUTTONS
  continua apresentando medidas antigas como instrução de uso sem remeter ao guia. PRD, STACK,
  TOOLING, PRINCIPLES e DELIVERY-WORKFLOW ainda não encaminham ao guia principal.
- TOOLING, constituição, EXPORT-STANDARD e documentos especializados preservam funções claras; há
  conteúdo histórico que precisa continuar distinguido de estado atual. Specs mantêm
  requisitos/plano/tarefas, sem avaliação integral de aderência ao código nesta revisão.

**Próximo passo:** conciliar os pontos acima preservando regras vigentes e evidências. Esta
solicitação foi uma verificação: os documentos auditados não foram reescritos; apenas este registro
de resultados foi acrescentado. Não houve commit, PR, deploy ou teste de aplicação.

## Guia de design em docs: concluído-CODEX-mafaltti

**Pedido:** disponibilizar o guia de design na pasta `docs` da cópia principal do projeto.

**Estado:** guia disponível em [docs/caab-design.md](../caab-design.md), com o nome canônico já
estabelecido. AGENTS e referência ativa desta memória apontam para esse arquivo. As regras de UI/UX
foram preservadas; o link da evidência histórica aponta para a entrega original, que continua
preservada em `.cache/pr-design-guide-20260922`. Este caminho substitui as indicações anteriores de
guia disponível somente na worktree.

**Identidade:** CODEX; solicitante mafaltti, reutilizando a consulta GitHub desta sessão.

**Próximo passo:** usar `docs/caab-design.md` ao planejar e revisar qualquer alteração de UI/UX.
Arquivo disponibilizado localmente, sem commit, PR ou publicação nesta tarefa.

## Agentcache em docs: concluído-CODEX-mafaltti

**Pedido:** manter o agentcache em `docs/agentcache.md`, junto aos demais documentos.

**Estado:** arquivo transferido de `.cache` para `docs`, preservando os registros e suas
assinaturas. Referências do AGENTS e links internos ajustados para a nova localização. A cópia
antiga deixa de existir como arquivo ativo; backups permanecem em `.cache/local-backups`.

**Identidade:** reutilizada a conta GitHub já verificada nesta sessão, sem nova consulta.

**Próximo passo:** ler e atualizar somente `docs/agentcache.md` na pasta principal. Esta
movimentação é local, sem commit ou publicação; o arquivo em `docs` fica disponível para inclusão no
versionamento quando houver uma entrega autorizada.

## Identificação dos registros concluída-CODEX-mafaltti

**Pedido:** identificar cada registro do agentcache pela IA autora e pelo nome do solicitante obtido
da conta conectada ao GitHub, no formato descrição-IA-solicitante.

**Estado:** regra acrescentada ao AGENTS; novos registros assinados. Registros anteriores
identificados por bloco/linha sem atribuir a conta atual a pedidos históricos.

**Validação:** perfil autenticado retornou nome `mafaltti`; consulta independente ao login retornou
`Danilo-Komunick`, com o mesmo ID de conta. A CLI local respondeu HTTP401; a identidade foi obtida
pela integração GitHub conectada, não por configuração Git.

**Próximo passo:** aplicar a convenção aos próximos registros, reutilizando a identidade já
consultada nesta sessão. Uma nova sessão exige nova consulta, sem herdar a conta deste computador. A
origem humana dos pedidos antigos permanece não verificada; consultar evidências antes de completar
atribuições.

## Localização e restrições operacionais conferidas em 23/09/2026-CODEX-SOLICITANTE_NAO_VERIFICADO

- Pasta principal atual: `C:/Projetos/caabnovo`; a pasta antiga do Desktop não existe.
- Principal em dev89d2356, limpa e sincronizada por fetch/fast-forward nesta rodada.
- O Git ainda registra worktrees com os caminhos antigos, marcadas como prunable. Há arquivos das
  worktrees na nova pasta `.cache`, mas o vínculo Git precisa ser conferido antes de utilizá-las.
  Não foi feito repair, prune nem exclusão nesta tarefa.
- Localhost permanece desautorizado; não ativar serviços. Quando autorizado, preservar
  preview3107/banco e limites locais já registrados: Node384 MB/duas CPUs/prioridade baixa;
  PostgreSQL256 MB/uma CPU; WSL768 MB/duas CPUs; worker/scanner pausados. Não compilar nem executar
  E2E com preview ativo e pouca memória livre; preferir CI.
- O guia ainda disponível está em `.cache/pr-design-guide-20260922/docs/caab-design.md`. Caminho
  canônico planejado: `docs/caab-design.md`. Conferir localização antes de UI/UX.
- O mapa e checkpoints datados de22/09 abaixo são históricos; esta localização prevalece.

## Colaboradores: decisão sobre cargo base — 22/09/2026-IA_NAO_IDENTIFICADA-SOLICITANTE_NAO_VERIFICADO

**Pedido/correção:** o usuário questionou a opção “Sem cargo”, pois Colaborador já é o cargo base, e
determinou que decisões desse tipo sejam consultadas antes de implementar.

**Estado:** orientação registrada; correção de produto aguardando definição do alcance. O agente
introduziu a opção para preservar contas sem cargo permitidas anteriormente, sem confirmar a decisão
de produto. Isso não deve se repetir. Colaborador é o cargo base confirmado pelo usuário; “Sem
cargo” foi considerado redundante.

**Verificação desta rodada:** a opção existe em `apps/web/modules/users/ui/role-options.tsx`. Nenhum
código, banco ou PR foi alterado. O registro central informa PR39 integrado; não reutilizar sua
branch nem alterar seus metadados para a eventual correção.

**Próximo passo:** confirmar se Colaborador deve ser o cargo mínimo obrigatório também para contas
que hoje estão sem cargo. Após resposta, registrar o alcance e implementar somente o autorizado,
preservando acessos individuais e histórico.

## Estado conferido e mapa das pastas-CODEX-SOLICITANTE_NAO_VERIFICADO

Conferência em 22/09/2026: principal em `dev`, commit `89d2356`, limpa e sincronizada com
`origin/dev` por fetch e fast-forward. O histórico Git confirma as integrações dos PRs 34, 35, 36,
37 e 39. Seus checkpoints antigos de “aberto” ou “aguardando CI” não são pendências atuais. A
consulta de PRs pela CLI retornou HTTP 401 nesta sessão; metadados e checks remotos não foram
revalidados por essa consulta.

Todos os caminhos abaixo são relativos à pasta principal daquela sessão (caminho local omitido).
Worktrees e commits conferidos por Git nesta sessão.

| Pasta                                         | Branch e commit                                      | Uso na retomada                                                                                     | Assinatura                                                                     |
| --------------------------------------------- | ---------------------------------------------------- | --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Pasta principal                               | `dev` · `89d2356`                                    | Base integrada; não implementar diretamente aqui.                                                   | `Pasta principal-CODEX-SOLICITANTE_NAO_VERIFICADO`                             |
| `.cache/pr-design-guide-20260922`             | `docs/design-guide-20260922` · `ab643a5`             | Guia UI/UX; limpa, três commits à frente da referência remota local. Publicação aguarda orientação. | `.cache/pr-design-guide-20260922-CODEX-SOLICITANTE_NAO_VERIFICADO`             |
| `.cache/pr-single-collaborator-role-20260922` | `fix/single-collaborator-role-20260922` · `21b5bc6`  | Entrega do PR39 integrada; preservar, não reutilizar para trabalho novo.                            | `.cache/pr-single-collaborator-role-20260922-CODEX-SOLICITANTE_NAO_VERIFICADO` |
| `.cache/pr-access-export-foundation-20260921` | `feature/collaborators-contact-20260921` · `71a6602` | Entrega do PR37 integrada; preservar, não reutilizar para trabalho novo.                            | `.cache/pr-access-export-foundation-20260921-CODEX-SOLICITANTE_NAO_VERIFICADO` |
| `.cache/pr-project-clarify-20260921`          | `docs/project-clarify-20260921` · `c63786b`          | Entrega do PR35 integrada; referências antigas são históricas.                                      | `.cache/pr-project-clarify-20260921-CODEX-SOLICITANTE_NAO_VERIFICADO`          |
| `.cache/preview-latest`                       | `preview/local-latest` · `2515ef3`                   | Preview histórico; não representa a versão atual nem autorização para ligá-lo.                      | `.cache/preview-latest-CODEX-SOLICITANTE_NAO_VERIFICADO`                       |

A branch local `codex/novo-ciclo-20260922` existe, criada a pedido em 22/09; o registro anterior não
define escopo para ela. Conferir sua base e adequação antes de usá-la.

Localhost permanece desautorizado. O último registro operacional informa desligamento; nenhum
serviço foi iniciado nem seu estado atual auditado nesta consolidação. O arquivo
`.cache/local-backups/caab-before-preview-20260922.dump` foi registrado como parcial/não validado:
**não tratá-lo como backup restaurável**. Dados e volumes preservados.

## Pedidos e pendências de produto-CODEX-SOLICITANTE_NAO_VERIFICADO

Fila consolidada a partir das decisões e tarefas existentes. Não é uma nova autorização para
executar todas as funcionalidades. Confirmar escopo já autorizado e estado da spec antes de retomar;
tarefas técnicas detalhadas continuam nas specs de cada função.

| Assunto                                | Estado e próximo passo                                                                                                                                                                                                                                                         | Fonte                                                                                                                                                                        | Assinatura                                                                |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Guia principal de UI/UX                | Documento concluído localmente; revisar/publicar somente conforme orientação. PR38 constava fechado no último registro; não reabrir automaticamente.                                                                                                                           | [Guia](../caab-design.md) e evidência (referência local histórica: `../../.cache/pr-design-guide-20260922/specs/001-project-foundation/evidence/design-guide-2026-09-22.md`) | `Guia principal de UI/UX-CODEX-SOLICITANTE_NAO_VERIFICADO`                |
| FormField                              | Correção futura registrada: texto incompleto e CPF mostram erro antes de blur/submit. Duas verificações reproduziram a divergência; não corrigida pela auditoria.                                                                                                              | Evidência do guia acima                                                                                                                                                      | `FormField-CODEX-SOLICITANTE_NAO_VERIFICADO`                              |
| TableContainer                         | Revisão assistiva pendente: div focável com aria-label sem role explícito; Axe pediu revisão manual. Conferir teclado, nome e semântica no uso real.                                                                                                                           | Evidência do guia acima                                                                                                                                                      | `TableContainer-CODEX-SOLICITANTE_NAO_VERIFICADO`                         |
| Tema Cores Legado                      | Pedido pendente: planejar e implementar vermelho/branco do site antigo nos mesmos elementos e disposição. Conferir referência, manter CAAB padrão; opção secundária discreta nas Configurações, acessível também no escuro. Atualizar spec/plano/tarefas antes de implementar. | Decisão de 21/09, substitui tema inspirado no clube                                                                                                                          | `Tema Cores Legado-CODEX-SOLICITANTE_NAO_VERIFICADO`                      |
| Exportações por módulo                 | Base compartilhada integrada; adaptar e validar os módulos restantes, com filtros, três formatos, seleção/ordem de colunas e permissões. Tarefas antigas podem exigir conciliação com o código já entregue, especialmente Colaboradores.                                       | [Programa 002](../../specs/002-integrated-modules/tasks.md), EXP01–EXP07; tarefas EX/DX nas specs001/003–010                                                                 | `Exportações por módulo-CODEX-SOLICITANTE_NAO_VERIFICADO`                 |
| Acesso a Notícias/Agendamentos         | AC01–AC03 ainda abertos nas specs; conferir catálogo/guardas e revogação, worker e visibilidade no Início. Não recriar permissões já existentes.                                                                                                                               | [Notícias](../../specs/004-news-publishing/tasks.md), [Agendamentos](../../specs/008-scheduling-management/tasks.md)                                                         | `Acesso a Notícias/Agendamentos-CODEX-SOLICITANTE_NAO_VERIFICADO`         |
| Auditoria e Relatórios                 | Adequar autorização da cadeia de exportação/download; Relatórios também exige consulta a Agendamentos nos dados de reservas. Conferir downloads antigos e proteger escopo desconhecido.                                                                                        | [Auditoria](../../specs/003-audit-operations/tasks.md), EX01/EX02; [Relatórios](../../specs/010-reports-analytics/tasks.md), EX/DX/T025                                      | `Auditoria e Relatórios-CODEX-SOLICITANTE_NAO_VERIFICADO`                 |
| Dependentes/documentos                 | POL01: falta responder quais alterações exigem nova análise. POL02: aplicar a matriz documental confirmada, com análise manual e preservação do legado.                                                                                                                        | [Decisões P01](../../specs/005-members-management/open-decisions.md), [tarefas005](../../specs/005-members-management/tasks.md)                                              | `Dependentes/documentos-CODEX-SOLICITANTE_NAO_VERIFICADO`                 |
| Calendário de Agendamentos             | CAL01–CAL05 integrados; CAL06 ainda consta aberto para revisão final e evidências. Conferir a entrega antes de repetir validações.                                                                                                                                             | [Tarefas008](../../specs/008-scheduling-management/tasks.md)                                                                                                                 | `Calendário de Agendamentos-CODEX-SOLICITANTE_NAO_VERIFICADO`             |
| Agendamentos: próximos incrementos     | Pendentes conflito por beneficiário, aviso de bloqueio em reservas e demais incrementos de horários/exceções, faltas, avaliações e comunicações. Reconciliar tarefas com o que já existe e seguir a ordem aprovada. Salas/equipamentos continuam sugestões.                    | Specs008 e programa002, incluindo T021/T023/T024 e AG-B/AG-R                                                                                                                 | `Agendamentos: próximos incrementos-CODEX-SOLICITANTE_NAO_VERIFICADO`     |
| App/site                               | Primeira interface ainda depende de jornadas, identidade, telas e contratos próprios antes de implementação. A prioridade posterior do calendário administrativo substituiu a ordem anterior de começar pelo app/site.                                                         | Programa002 UI01/UI02 e spec008 T022                                                                                                                                         | `App/site-CODEX-SOLICITANTE_NAO_VERIFICADO`                               |
| Mensagens                              | Finalidade definida; M016 exige avaliar aderência do protótipo e registrar decisão de continuidade antes de nova construção. Envio real/M009/M010 adiados; testes antigos não homologam o produto.                                                                             | [Tarefas009](../../specs/009-messaging/tasks.md)                                                                                                                             | `Mensagens-CODEX-SOLICITANTE_NAO_VERIFICADO`                              |
| SMTP externo                           | Transporte implementado; homologação real de recuperação de senha/troca de e-mail depende de ambiente e destinatários autorizados.                                                                                                                                             | [Tarefas006](../../specs/006-account-settings/tasks.md), T025                                                                                                                | `SMTP externo-CODEX-SOLICITANTE_NAO_VERIFICADO`                           |
| Métricas externas                      | Instrumentar e homologar consumidores quando app/site forem retomados; endpoint já existente.                                                                                                                                                                                  | Spec010 T026                                                                                                                                                                 | `Métricas externas-CODEX-SOLICITANTE_NAO_VERIFICADO`                      |
| OAB-BA publicada                       | Configuração/homologação positiva adiada; última tentativa registrada retornou OAB_NOT_CONFIGURED. Não repetir sem mudança de configuração. Código/resultado já entregues, sem nova flag de ativação.                                                                          | Spec005 T028; histórico de 16/09                                                                                                                                             | `OAB-BA publicada-CODEX-SOLICITANTE_NAO_VERIFICADO`                       |
| Retenção/privacidade                   | Definição institucional pendente; manter descarte automático desligado e gates existentes. Não inventar prazos/aprovadores.                                                                                                                                                    | [Tarefas001](../../specs/001-project-foundation/tasks.md), T089                                                                                                              | `Retenção/privacidade-CODEX-SOLICITANTE_NAO_VERIFICADO`                   |
| Proteções remotas                      | T095 continua aberta para evidências remotas. Não realizar push proibido para testar proteção.                                                                                                                                                                                 | Spec001 T095                                                                                                                                                                 | `Proteções remotas-CODEX-SOLICITANTE_NAO_VERIFICADO`                      |
| Aceite transversal                     | Conciliar tarefas e validar jornadas/contratos/evidências conforme conclusão dos módulos; não tratar módulos futuros como prontos.                                                                                                                                             | Programa002 T055–T057 e T098–T108                                                                                                                                            | `Aceite transversal-CODEX-SOLICITANTE_NAO_VERIFICADO`                     |
| Portal de parceiros / Meu trabalho     | Portal depende de definição/implementação própria; Meu trabalho tem base parcial e pendências operacionais, não é módulo inteiramente inexistente.                                                                                                                             | Programa002 T046–T053                                                                                                                                                        | `Portal de parceiros / Meu trabalho-CODEX-SOLICITANTE_NAO_VERIFICADO`     |
| Login com provedores externos          | Ideia futura registrada: Google, Apple ID e outros a definir; planejar vínculo com contas existentes e primeiro acesso, separando autenticação da autorização para criar conta. Sem integração/credenciais definidas.                                                          | Decisão de 17/09; identidade externa D02                                                                                                                                     | `Login com provedores externos-CODEX-SOLICITANTE_NAO_VERIFICADO`          |
| Conversa interna / suporte por tickets | Duas possibilidades futuras separadas; pesquisar uso e funcionamento antes de nomear/especificar/construir.                                                                                                                                                                    | Programa002 FUT01/FUT02                                                                                                                                                      | `Conversa interna / suporte por tickets-CODEX-SOLICITANTE_NAO_VERIFICADO` |
| Recursos Humanos / CAASSH-Créditos     | RH sem finalidade/escopo autorizado. CAASSH/Créditos segue suspenso e desativado; não reativar por estar no backlog.                                                                                                                                                           | Programa002 e decisões de 17/09                                                                                                                                              | `Recursos Humanos / CAASSH-Créditos-CODEX-SOLICITANTE_NAO_VERIFICADO`     |

**Itens antigos retirados da fila ativa:** cadastro público T096, preservação de conflitos T097,
base de permissões/exportação T098–T120, ciclo de vida T121–T123, cadastro/filtros/ações T124–T132 e
cargo único/promoção T139–T142 constam concluídos na spec001 e nas integrações da dev. Relatórios e
calendário iniciais também foram integrados. Não confundir código integrado com homologação
institucional ou implantação.

**Escopo remoto já resolvido/reduzido:** criação/edição/reabertura de rascunho com imagem no DEV foi
validada no registro de 16/09. A inspeção dos serviços VM/MinIO foi dispensada pelo usuário, assim
como migrar dois arquivos de teste; não voltar a cobrar SSH ou essa inspeção como pendência. Não
afirmar estado atual da VM.

## Histórico, preservação e documentos substituídos-CODEX-SOLICITANTE_NAO_VERIFICADO

Índice do histórico e dos backups (referência local histórica:
`../../.cache/archive/agentcache-consolidation-20260922.md`). As versões completas anteriores foram
copiadas e conferidas por SHA-256 antes de qualquer remoção. WORKSPACE.md e TASKS.md deixam de ser
fontes ativas; fila atual e mapa ficam neste arquivo. Regras e direções ficam no AGENTS.md. O índice
histórico registra a consolidação anterior, corrigida pelo usuário nesta sessão.

Referências antigas a `.cache/WORKSPACE.md` ou `.cache/TASKS.md` em evidências/versionados devem ser
interpretadas pelo índice histórico acima. Não reescrever evidências de entregas integradas nem
recriar esses arquivos como nova fonte concorrente.

Relatórios datados, inventários antigos e descrições de PR não são filas atuais. Conservar suas
evidências; eles não autorizam executar listas antigas novamente. Esta consolidação não remove
worktrees, runtimes, dependências, bancos, `.env` ou backups.
