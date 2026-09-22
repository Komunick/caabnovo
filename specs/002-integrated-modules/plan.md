# Implementation Plan: Coordenação da entrega após clarify

## Complemento P01 — documentos definidos, 21/09/2026

Titular/cônjuge/filho/enteado têm documentação definida pelo usuário, com limite de até 25 anos para
filhos/enteados. Fonte vigente: [matriz de Associados](../005-members-management/open-decisions.md).
Substitui o adiamento integral de Q11; apenas alterações que exigem nova análise permanecem sem
resposta (POL01). Planejamento/implementação em 005 POL02, sem execução nesta atualização. Preservar
decisões independentes de retenção, identidade externa, análise manual, bloqueio e reserva; não
marcar implementação concluída.

Resumo da entrega: [plan/tasks e dependências](plan-tasks-result-2026-09-21.md).

**Branch da entrega**: `docs/project-clarify-20260921` | **Data**: 2026-09-21 **Spec**:
[spec.md](spec.md) | **Estado**: desenho concluído; implementação/validação pendentes.

## Summary

Ordenar as adequações de todas as funções, manter escopo institucional adiado e rastrear validações
por módulo sem reconstruir funções aceitas.

US1 Auditoria, US2 Notícias, US3 Associados, US4 Agendamentos, US5 Parceiros, US6 Colaboradores, US7
Mensagens e US10 Relatórios. US8 CAASSH e US9 portal não são reativadas.

## Technical Context

TypeScript 6.0.3, Node 24, Next 16.3.4, React 19.2.8, Zod 4.5.4 e pg8.23.0 do checkout; PostgreSQL
18 no CI. Monólito modular; banco também armazena arquivos legados. Sem S3/MinIO novo. Testes Vitest
4.1.11, Playwright 1.62.1 e Axe existentes. UI desktop/390 px, temas, teclado e tokens
compartilhados. Exportação incremental com pg-cursor/ExcelJS propostos e PDFKit existente, sujeitos
a spike/versão fixada no código; nenhum pacote instalado agora.

**Performance/escala**: preservar p95 de 2s das telas comuns; não aplicar esse alvo a transferência
integral arbitrária. Exportações não têm teto funcional de registros/período. Aplicar o
[perfil C1 de100 registros](../002-integrated-modules/export-validation-100.md): medir
tempo/recursos e validar integridade, resposta do painel e recuperação. Sem prova de estresse/grande
volume nesta rodada; manter produto sem teto funcional de registros. **Restrições**: banco único,
autorização atual por ação; sem localhost, deploy, seed real, limpeza de dados ou implementação
nesta fase. Q10/Q11 e módulos futuros continuam adiados.

## Constitution Check

Pré-pesquisa: escopo decorre de Q1–Q11 e complementos, sem política institucional inferida.
Pós-desenho: monólito/fonte única, negação por padrão, auditoria mínima, integridade no PostgreSQL e
UI compartilhada preservados. Constituição 2.0.0 concilia justificativas já retiradas; autenticação
continua sem MFA. Abstração de exportação cobre oito consumidores reais, sem CRUD genérico. Não há
violação de desenho sem justificativa. Aprovações institucionais/produção permanecem pendentes;
compatibilidade do desenho não é execução de gates.

## Phase 0 — Research

Decisões, alternativas e fontes em [research.md](research.md), com pesquisa transversal
[de 21/09](../002-integrated-modules/research-2026-09-21.md). Leitura estática conclui as escolhas
necessárias para este recorte; limitações operacionais viram validações de implementação, não
requisitos indefinidos. Sem consulta a contas/dados de produção.

## Phase 1 — Design

Decisão I1: aplicar os três cargos de [001](../001-project-foundation/contracts/roles.md).
Administrador tem todo o catálogo disponível; Gestor tem consulta global, exportação geral e
Relatórios completos; concede alterações de outros módulos a terceiros sem ampliá-las para si;
Colaborador não concede. Isso resolve a concessão inicial de Agendamentos. Nenhuma conta é alterada
pelo planejamento.

- Consulta OAB está excluída dos botões/datasets de exportação por decisão explícita do usuário em
  21/09/2026; spec005 e contrato transversal refletem essa exceção.
- Fundação 001 fornece catálogo/migrações/streaming/UI compartilhada; cada função mantém seu
  adaptador, autorização e cenário de aceite. Coordenação 002 valida cobertura, sem assumir a
  propriedade das tabelas de domínio.
- Primeiro entregar invariantes de permissões e descoberta; em seguida infraestrutura comum e prova
  vertical em Relatórios. Expandir para
  Auditoria/Colaboradores/Notícias/Associados/Parceiros/Agendamentos, cada um com todos os três
  formatos. Mensagens depende da revisão M016 antes de nova construção.
- Em paralelo à infraestrutura, concluir Q1/Q2 na spec 008 e regressão de vínculo/bloqueio005,
  respeitando lock e migração de dados conflitantes. Validação pendente CAL06 usa evidência do PR34
  já integrado; nunca editar PR mergeado.
- Preservar tasks históricas e correspondência dos IDs provisórios AX/EX/DX/AC/BEN/BLQ/EXP para
  tarefas sequenciais novas. Pendências antigas não entram automaticamente no escopo ativo.
- DOC01 inclui conciliação normativa e contratos derivados, não reexecução de remoção de MFA ou
  justificativas. Constituição 2.0.0 documenta a retirada já decidida; sem templates alterados.
- Reservar nomes de migração na mesma entrega: 0025 concessões gerais, 0026 acesso explícito, 0027
  operações de exportação, 0028 sobreposição. Conferir último número antes de implementar; não
  editar migrations aplicadas.

Modelo em [data-model.md](data-model.md), interface em [contracts/exports.md](contracts/exports.md)
e [contrato comum](../002-integrated-modules/contracts/direct-exports.md). UI preserva
rascunhos/filtros e dados em falhas, sem exigir justificativa. Catálogo de colunas é allowlist por
função; servidor não confia no catálogo antigo do navegador.

## Project Structure

- `docs/EXPORT-STANDARD.md` (existente).
- `docs/MODULES.md` (existente).
- `docs/STACK.md` (existente).
- `.specify/memory/constitution.md` (existente).
- `.github/workflows/ci.yml` (existente).

## Rollout, migração e rollback

Uma entrega/worktree; mudanças SQL aditivas e numeradas coordenadas pela spec001. Preparar
compatibilidade de leitura de chaves/snapshots antes de ativar migrações e novos botões. Conta sem
acesso não ganha concessão para preservar conveniência. Diagnosticar conflitos antes da
restrição008; parar sem corrigir registros automaticamente. Rollback da UI/API deve preservar grants
convertidos, dados e arquivos; não publicar binário antigo que dependa exclusivamente de
audit:export/reports:export após conversão. Preferir correção compatível para frente; reversão SQL
exige plano e evidência próprios.

## Validation e próximo passo

Percorrer a matriz de módulos/subáreas, três formatos, zero descoberta sem acesso, dados completos e
campos autorizados; reconciliar tarefas/evidências por função e políticas adiadas sem marcar
homologação ausente.

Executar roteiro [quickstart.md](quickstart.md) na implementação. Evidência anterior nunca conclui
tarefa nova. Pesquisa/plan encerrados; próximo comando desta solicitação: speckit-tasks, organizado
por história, com dependências e critérios independentes.

## Complexity Tracking

Núcleo comum necessário para aplicações repetidas em oito funções; adaptadores mantêm as regras dos
domínios. Sem microserviço, linguagem nova ou nova fonte de verdade. Estado operacional serve
somente à transferência atual; não é fila/histórico obrigatório.

## Histórico anterior — referência, não sequência executável atual

O conteúdo abaixo preserva decisões/evidências anteriores. Em caso de divergência, valem o desenho
de 21/09 acima e a spec vigente; não reabrir branches/PRs já integrados.

<details>
<summary>Plano anterior preservado</summary>

# Implementation Plan: Módulos integrados CAAB

**Decisão vigente — 21/09/2026:** a finalidade de Mensagens foi confirmada: comunicados e campanhas
aos associados, com seleção de público e programação. O código existente continua sendo um
protótipo, sem homologação do produto. A definição de finalidade substitui a pendência de 17/09;
revisão de aderência do protótipo e critérios de continuidade permanecem em M016. Meios, provedores
e envio real continuam adiados. Conversa interna do painel e suporte por tickets do app/site são
possibilidades de módulos futuros separados, com nomes e funcionamento sujeitos a pesquisa
posterior; não estão em implementação.

Colaboradores é a gestão atual de contas e permissões, nas rotas `/users`; não há cadastro separado
de RH. Um módulo futuro chamado **Recursos Humanos** permanece como possibilidade, pendente de
definição de finalidade, escopo e autorização de construção. Essa possibilidade não reativa os
requisitos antigos COL-001–COL-005 nem autoriza duplicar contas ou permissões.

**Branch**: `feature/product-direction` | **Date**: 2026-09-09 | **Spec**: [spec.md](spec.md)
**Input**: Todos os módulos no escopo, reutilização da fundação e início imediato por US1.

## Summary

Revisão de integração da spec 008 em 15/09/2026: retirar Agendamentos das áreas futuras da home,
incluir seu título no cabeçalho e manter cor/fundo do menu da conta no mesmo tema. Preservar
transição de borda; ampliar o teste de contraste durante a troca de temas com os textos do perfil,
além do Axe da jornada.

Escopo integrado em monólito modular. PRs acompanham funções/specs concluídos, conforme orientação
de 09/09/2026. Começar pela fusão de navegação Auditoria/Processamentos, sem migração nem ampliação
de permissões. Demais domínios seguem dependências e regras institucionais definidas, nunca
inventadas.

## Technical Context

**Language/Version**: TypeScript 6, Node.js 24, SQL PostgreSQL. **Primary Dependencies**: Next.js
16.3.4, React 19, Better Auth, Zod, pg, pg-boss, Radix e Lucide existentes. Payload/Lexical
permanecem previstos; compatibilidade/integração são tarefa de US2. **Storage**: PostgreSQL, storage
armazenamento PostgreSQL bytea, ClamAV e worker existentes. **Testing**: Vitest, contratos,
PostgreSQL descartável, Playwright e Axe. **Target Platform**: Web desktop/tablet/móvel; servidor e
worker; DEV sintético. **Project Type**: Administrativo e portal restrito com contratos versionados.
**Performance Goals**: Alvo do PRD de p95 de 2s em telas comuns; paginação server-side e jobs para
trabalho demorado. **Constraints**: Sem legado, cadastros/serviços duplicados, permissão ampliada,
produção ou PR preliminar. **Scale/Scope**: Dez histórias; volumes reais ainda não fornecidos.
[MODULES.md](../../docs/MODULES.md) define responsabilidades.

## Constitution Check

- KISS/DRY: catálogo de áreas centraliza três repetições reais (menu, busca, dashboard); sem CRUD
  universal.
- Domínios separados: fusão visual não mistura eventos imutáveis com execução de jobs.
- PostgreSQL: transações/idempotência/constraints para reservas, lotes e créditos.
- Segurança: guardas por operação; documentos por proprietário; portal por organização.
- Auditoria/privacidade: mesma trilha append-only; descarte depende de T089.
- Integrações: contratos explícitos; estado desconhecido não vira decisão institucional.
- Acessibilidade: testes das mudanças efetivas; sem repetição da validação manual do PR #10.
- Entrega: uma branch/worktree por entrega; funções mantêm documentação/testes próprios no mesmo PR
  enquanto aberto. PR mergeado não pode ser alterado; main fora do escopo.

Resultado antes/depois do desenho: compatível. US1 pronta para início. Histórias de negócio têm
tarefas de definição institucional antes das operações dependentes; não se presume aprovação.

## Project Structure

### Documentation (this feature)

`specs/002-integrated-modules/`: spec, plan, research, data-model, contracts, quickstart, tasks e
checklist.

### Source Code

```text
apps/web/modules/
  workspace/                         # catálogo único
  auth/ users/ files/ audit/ jobs/    # reaproveitados
  news/ members/ scheduling/ partners/ employees/
  messaging/ credits/ partner-portal/ reports/
apps/web/app/(admin)/audit/jobs/[jobId]/
apps/web/app/(admin)/operations/jobs/[jobId]/ # compatibilidade
apps/web/app/(partner)/              # portal planejado, escopo próprio
apps/web/app/api/v1/                 # contratos versionados
apps/worker/src/jobs/                # handlers por domínio, mesma fila
packages/contracts/src/              # schemas/OpenAPI
packages/db/migrations/              # migrations aditivas
packages/db/src/repositories/        # persistência por domínio
```

**Structure Decision**: Reutilizar estrutura real; diretórios novos são destinos planejados, não
módulos já implementados. Sem packages ou tabelas genéricas para antecipar abstrações.

## Implementation Sequence

### Sequência histórica de 15/09/2026 — prioridade alterada em 18/09

Após concluir e validar a primeira versão funcional do módulo de Agendamentos no painel (etapa 1 da
spec 008), o próximo passo será a **primeira versão da interface do usuário no app e no site**. Essa
etapa tem prioridade sobre as demais expansões de Agendamentos e sobre Mensagens, Créditos, Portal
do Parceiro e Relatórios.

A interface do usuário terá spec, plano, tarefas e critérios de aceite próprios antes da
implementação, reutilizando os dados e serviços do painel. O recorte de telas, jornadas,
identidade/autenticação e contratos dos dois canais será definido nessa preparação; a integração de
reservas permanece coordenada com a spec 008. Não é necessário concluir toda a equivalência com o
legado para iniciar essa etapa. Em 18/09 o usuário priorizou o calendário administrativo. Ele já tem
código integrado; CAL06 ainda exige encerramento de revisão. App/site continuam pendentes, sem nova
implementação autorizada por esta revisão documental. CAASSH permanece desativado e pendente de
revisão.

### Agendamentos — direção vigente em 15/09/2026

**Atualização posterior:** planejamento próprio na [spec 008](../008-scheduling-management/plan.md)
com três etapas e primeira entrega administrativa confirmada pelo usuário. Ver
[tarefas](../008-scheduling-management/tasks.md); não executar T022–T026 antigas. Spec e primeira
versão administrativa implementadas; gates finais em validação. As instruções de brainstorming
abaixo são histórico das etapas posteriores.

Separar funcionalidades comprovadas no legado de sugestões novas; o usuário citou controle de salas
como sugestão. Não promover opções da pesquisa a requisitos. Detalhar gerenciamento de horários a
partir do [inventário](horarios-legado-2026-09-15.md), conferindo diferenças entre configuração,
cálculo de horários e confirmação da reserva.

Brainstorming/pesquisa: CAAB administra pelo painel a oferta de reservas do app/site. Q8 de 21/09
exige sessão válida e acesso concedido a Agendamentos para consultas e alterações. Cadastro de
unidades com vários serviços, profissionais, procedimentos, funcionamento e gestão de avaliações são
parte do escopo confirmado. Não pressupor portal administrativo independente para
profissionais/negócios.

Próximos passos: revisar a [pesquisa complementar](pesquisa-gestao-agendamentos-2026-09-15.md),
validar serviço/procedimento e vínculos, detalhar horários/exceções, ações de avaliações, consumo no
app/site, público elegível e preservação de dados. Depois consolidar spec própria, plano, tarefas e
critérios de aceite. As tarefas de implementação antigas permanecem suspensas; não definir prazos,
multas, bloqueios ou telas como aprovados.

Avaliar solução própria com a base existente. Cal.com é somente referência e não deve ser integrado
salvo se nenhuma outra possibilidade for encontrada. Registrar alternativas e impedimentos concretos
caso essa condição venha a ser investigada. Não criar integração, dependência ou serviço nesta
pesquisa.

### Prioridade vigente — 14/09/2026

Histórico; aplicar as decisões de 15/09 acima onde houver divergência.

Etapa atual limitada a pesquisa de mercado e documentação por solicitação expressa. Recorte:
barbearia, medicina, futevôlei, fisioterapia, psicologia, spa e zumba; restaurantes somente como
possibilidade futura. Consultar o relatório de pesquisa antes de retomar o brainstorming. Não
produzir implementação durante esta etapa.

Reabrir o levantamento de **Agendamentos** antes de produzir sua spec funcional ou código. As
propostas anteriores de US4 não definem a grande evolução solicitada pelo usuário. Registrar fluxo
atual, problemas e decisões no brainstorming deste programa; depois consolidar uma spec própria com
plano, tarefas e critérios de aceite.

**CAASSH: desativado — pendente de revisão.** Suspender US8/T041–T045 e suas dependências de
crédito. Atualizar apenas a indicação no painel e o planejamento; não existem operações
implementadas para desligar. Preservar o contrato de leitura de Associados como referência
histórica. Não há migration ou exclusão de dados.

As alterações permanecem na única branch ativa, ainda sem PR. Otimização da navegação continua
registrada separadamente; o brainstorming definirá o escopo de Agendamentos.

Cada funcionalidade possui spec próprio, plano e tarefas antes do código. Este é o mapa geral de
dependências, não um spec único para todas as implementações. A fusão inicia em
[003-audit-operations](../003-audit-operations/plan.md). Correções e melhorias, inclusive
paginação/filtros de jobs e pré-condição de reenvio, atualizam o spec existente da função. Notícias
é uma função nova, detalhada em [004-news-publishing](../004-news-publishing/plan.md).

1. Consolidar escopo/reaproveitamento e iniciar US1: catálogo, subnavegação, rotas canônicas de
   jobs, compatibilidade e testes. Serviços e APIs existentes mantidos.
2. US2 e US6: Conteúdo e Equipe reaproveitam autenticação/arquivos; verificar CMS e política
   editorial.
3. US3 e US5: Pessoas e Benefícios estabelecem identidades, vínculos e condições.
4. US4/spec 008: concluir e validar a primeira versão funcional de Agendamentos no painel.
5. Primeira versão da interface do usuário no app/site: próximo passo imediato, com especificação
   própria e integração aos mesmos dados e serviços.
6. Retomar demais expansões de Agendamentos e US7/US9 (Mensagens e Portal) conforme prioridades e
   regras confirmadas; US8/Créditos permanece suspensa até nova decisão.
7. US10: Pendências e relatórios dos registros reais dos domínios.
8. Validar cada função antes do seu PR; concluir validação cruzada das funções liberadas.

Cada história segue contrato/modelo → testes de invariantes → serviço → UI → integração → evidência.
O usuário autorizou começar a implementação enquanto o plano completo é mantido, sem aguardar regras
de módulos independentes. Não tratar navegação vazia como entrega funcional.

## Complexity Tracking

Nenhuma exceção arquitetural. O tamanho da entrega foi solicitado; tasks.md preserva
rastreabilidade.

# Colaboradores, Usuários e Parceiros: decisão de escopo

Confirmado pelo usuário em 11/09/2026: Colaboradores no sistema antigo corresponde à atual gestão de
Usuários. Parceiros representa externos, como estabelecimentos e conveniados. Não há módulo separado
de equipe interna/RH no escopo atual. Recursos Humanos é uma possibilidade futura, pendente de
definição e autorização (17/09/2026).

A interpretação anterior de Colaboradores como cadastro de setor, cargo e situação funcional foi
descartada. COL-001–COL-005 e T032–T035 do programa 002, como definidos para RH, foram retirados do
escopo; não são tarefas implementadas.

A interface adota **Colaboradores** na mesma gestão de contas, rotas `/users`, identificadores e
permissões existentes. Menu, catálogo, busca, cabeçalho, página, ações e mensagens usam o nome
Colaboradores. A busca também reconhece o termo Usuários. Não há novo cadastro, API ou migration
para essa renomeação.

Esta decisão substitui as propostas anteriores de cadastro funcional separado no programa 002 e no
PRD. Dependências de US6 usam a gestão de contas/RBAC existente.

## Regra vigente: nenhuma justificativa obrigatória — 14/09/2026

Atualizar contratos e serviços desta função para aceitar omissão/vazio; manter o campo opcional no
contrato para compatibilidade com clientes antigos. Retirar entradas, estados e bloqueios de
justificativa das telas. Normalizar ausência para vazio nas colunas históricas não nulas e para null
na auditoria; preservar autoria, resultado e datas. Migration aditiva de política retira somente
restrições de texto obrigatório, mantendo consistência das decisões. Não são necessários estados
especiais de criação de notícia. Cobrir ausência em contratos, autorização, integração e E2E;
executar banco/navegador/build no CI com serviços locais desligados.

## Plano da homologação — 16/09/2026

1. Conferir DEV, permissões GitHub, configuração versionada e entradas institucionais.
2. Validar as jornadas autorizadas com registros sintéticos isolados; nunca publicar a notícia de
   teste.
3. Corrigir lacunas técnicas em uma única branch, com testes dos controles e CI remoto.
4. Registrar resultados por ambiente, pendências externas e limites; abrir PR para dev sem merge ou
   aprovação.

## Execução de US7 — 16/09/2026

Protótipo de preparação de Mensagens registrado no [plano 009](../009-messaging/plan.md), no mesmo
ciclo/PR ativo. Adapters e entrega real foram adiados expressamente; não bloqueiam campanhas,
modelos, públicos e programação preparatória. Reutiliza associados, RBAC, auditoria, worker e shell.

## Decisão transversal — exportação em todos os módulos — 18/09/2026

Todos os módulos existentes e futuros deverão permitir baixar/exportar os dados consultados, com
ação visível, filtros/período/ordenação/colunas preservados, permissões revalidadas e exportação
além da página da tabela. Q6 de 21/09 define Excel, CSV e PDF em todos os módulos, inclusive
Relatórios (spec 010), substituindo a escolha anterior de formatos por função. “Exportar [módulo]”
abre filtros; o botão do formato inicia diretamente o download, sem histórico para buscar depois.
Demais módulos ganham tarefas próprias quando implementados; esta regra não reativa CAASSH nem
autoriza funções futuras suspensas.

## Clarify transversal — 21/09/2026

Aplicar uma única permissão geral de exportação, combinada com as permissões de leitura do módulo e
dos dados, na solicitação, geração e download. Substituir os controles específicos de exportação em
Auditoria/Relatórios; preservar acesso de consulta próprio de Relatórios e dos domínios. Q4:
converter automaticamente quem já possui alguma permissão de exportação na geral, sem mudar acesso
aos módulos nem conceder a quem não tinha exportação; repetição sem duplicidade. Fundação (001)
mantém catálogo, gestão da permissão e ocultação em barra lateral, busca e Início; funções mantêm
seus fluxos e testes. Sem código ou concessões alterados neste clarify. Checkpoint: Q3/Q4 e
complemento de visibilidade integrados; EXP04/EXP05 e AX01–AX03 pendentes. Ocultar não substitui
autorização de URL/API. Não reativar suspensos.

## Comunicação — finalidade e possibilidades futuras — 21/09/2026

Mensagens (009) permanece voltado a comunicados/campanhas aos associados; finalidade confirmada em
Q5. M016 revisará aderência do protótipo; envio real continua adiado. Registrar duas possibilidades
independentes, sem nome definitivo ou implementação:

- Conversa interna entre usuários do painel administrativo.
- Suporte do app/site: usuário abre ticket, conversa com a equipe e recebe atendimento até a
  resolução do problema.

Pesquisar posteriormente como cada um será feito e usado: jornadas, participantes, acesso,
privacidade/histórico, responsabilidades de atendimento e integração entre canais; avaliar
alternativas técnicas e nomenclaturas com referências oficiais, data e limites da pesquisa. Essas
dimensões são perguntas de pesquisa, não requisitos já decididos (sem presumir SLA, filas, anexos ou
fornecedor). Apresentar conclusões para definição de escopo; criar specs próprias somente quando
houver construção autorizada. FUT01/FUT02 registram pesquisa futura; nenhuma pesquisa nova
executada.

## Exportação direta — Q6 de 21/09/2026

Complemento explícito do usuário: Excel, CSV e PDF são padrão obrigatório de todas as exportações,
atuais e futuras; aplicar [EXPORT-STANDARD](../../docs/EXPORT-STANDARD.md).

Fluxo alvo transversal: “Exportar [módulo]” → tela com filtros pertinentes (datas, ordenação, ações,
áreas, nomes etc.) → Excel/CSV/PDF → download direto. Todos os resultados autorizados dos filtros,
sem teto de linhas/páginas/período e sem prazo de disponibilidade do arquivo. Não exigir
acompanhamento de job ou retorno a um histórico para baixar. Mostrar andamento da operação e erro
recuperável mantendo filtros, sem prometer geração instantânea. Preservar auditoria, acesso e dados.
Planejamento técnico deverá pesquisar geração incremental, memória, interrupção e restrições dos
formatos para atender grandes volumes integralmente; não introduzir limite funcional como substituto
do requisito. Nenhuma arquitetura ou tempo de resposta novo foi validado neste clarify.
Arquivos/dados antigos não serão apagados por esta decisão. Cada função terá especificação e tarefas
próprias na implementação. Checkpoint: Q6 registrada, EXP06/EXP07 e ajustes 003/010 pendentes;
nenhum código/teste.

## Colunas na exportação — Q7 de 21/09/2026

Na tela de exportação de cada módulo, permitir selecionar e reordenar campos autorizados, com
seleção inicial adequada ao módulo. Os três formatos usam a mesma seleção e ordem; ordenar colunas
não muda a ordenação dos registros. Revalidar campos no servidor e preservar configuração após erro.
Regra no EXPORT-STANDARD; detalhes de apresentação por formato serão planejados sem omitir campos
escolhidos. Somente documentação; EXP06/EXP07 e tarefas DX dos módulos continuam pendentes.

## Acesso a Notícias e Agendamentos — Q8 de 21/09/2026

Remover exceções de sessão suficiente nas duas funções, usando catálogo/gestão de acessos existentes
e a ocultação transversal em barra lateral/busca/Início. Fundação coordena concessões; specs 004/008
definem guardas/testes próprios. Preservar leitura pública de notícias e regras de reservas; nenhum
acesso externo novo autorizado. Q9 preserva consulta/alteração separadas; planejar a transição
técnica em AC01. Notícias já tem controles (validar/preservar); Agendamentos tem lacuna a adequar.
Sem código, concessão real ou teste novo neste clarify.

## Retenção — Q10 de 21/09/2026

Definição institucional dos prazos de cadastros, documentos e auditoria adiada; manter descarte
automático desligado. Responsável técnico: 001 FR-030/T089 e docs/privacy/retention-policy.md. Não
criar prazo por módulo ou confundir exportação direta sem prazo de download com aprovação de
retenção permanente.

## Regras de dependentes e documentação — Q11 de 21/09/2026

P01 da spec 005 está parcialmente definida: documentos, vínculos e limite etário confirmados na
matriz de 005/open-decisions.md. T017 coordena POL02 para aplicação futura; POL01 preserva a
pergunta 4 sobre reanálise. Manter análise manual e dados existentes, sem automações presumidas.
Nenhuma construção realizada neste registro.

Rodada de clarify encerrada em 21/09/2026: 11 perguntas respondidas e complementos registrados.
Decisões suficientes para atualizar o planejamento do recorte atual; políticas adiadas e
implementação continuam pendentes. Ver [relatório de encerramento](clarify-result-2026-09-21.md),
cobertura e checklists.

## Checkpoint de revisão de código — 21/09/2026

Clarify encerrado. Início já possui rascunhos e cadastros sem análise; Meu trabalho é parcial.
Relatórios inicial está implementado em 010. T022–T026 são históricas; T051/T052/T054 remetem à
execução inicial de 010. Novas exportações, permissões, app/site, portal e validação integrada
continuam pendentes. DOC01 cobre a conciliação documental desta revisão.

Revisão estática da base `ed31baf`; nenhum teste de aplicação ou homologação nesta etapa. Evidências
e limites: [revisão transversal](../002-integrated-modules/code-audit-2026-09-21.md).

Executar adequações e seus testes em retomada de implementação. Preservar dados e decisões adiadas;
a revisão atual altera somente documentação.

</details>
