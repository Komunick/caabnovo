# Implementation Plan: Agendamentos: acesso, integridade por pessoa e exportação

**Branch da entrega**: `docs/project-clarify-20260921` | **Data**: 2026-09-21 **Spec**:
[spec.md](spec.md) | **Estado**: desenho concluído; implementação/validação pendentes.

## Summary

Exigir acesso concedido, impedir sobreposição da mesma pessoa, sinalizar reservas mantidas após
bloqueio e exportar a agenda/oferta.

US1 configuração/reserva, US2 operação, US4 exportação. US3 expansões/app/site não entra neste
recorte; preservar FullCalendar já integrado.

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

- Guardas conferem scheduling:read e write (com read) no banco, inclusive após espera por lock.
  Catálogo/busca/páginas/HTTP/UI usam mesmas dependências; visitante com apenas read não muta
  oferta, horários, reservas ou arquivo.
- Preservar projeção mínima de beneficiário autorizada pela agenda; reports.bookings passa a exigir
  scheduling:read. Não conceder members:read por efeito colateral.
- Pré-diagnóstico SQL lista pares scheduled com mesmo member_id e ranges sobrepostos, inclusive
  datas passadas. Migração 0028 adiciona EXCLUDE USING gist(member_id WITH =,
  tstzrange(starts_at,ends_at,'[)') WITH &&) WHERE(status='scheduled'); preservar constraint
  profissional. Se houver conflitos, parar sem alterar dados e pedir decisão sobre casos concretos.
- Criar/remarcar revalida disponibilidade e ambos conflitos na transação; mapear constraint/SQLSTATE
  para mensagem recuperável. Disponibilidade aceita beneficiário selecionado e retira intervalos
  ocupados; constraint é garantia final. Remarcação falha mantém reserva original.
- Projetar eligibilityWarning: blocked|null em lote em lista/calendário/detalhe, usando
  vínculos/lock existentes. Aviso desaparece ao cessar bloqueio efetivo. Não mudar status, versão,
  horário, histórico ou ocupação da reserva; cancelamento manual autorizado permanece possível.
- Exportação usa mesma projeção com aviso e intervalo solicitado, independente de limites visuais do
  calendário. Oferta e horários são datasets próprios; não fabricar agenda de funcionamento futuro
  sem reservas.

Modelo em [data-model.md](data-model.md), interface em [contracts/exports.md](contracts/exports.md)
e [contrato comum](../002-integrated-modules/contracts/direct-exports.md). UI preserva
rascunhos/filtros e dados em falhas, sem exigir justificativa. Catálogo de colunas é allowlist por
função; servidor não confia no catálogo antigo do navegador.

## Project Structure

- `apps/web/modules/scheduling/access.ts` (existente).
- `apps/web/modules/scheduling/booking-service.ts` (existente).
- `apps/web/modules/scheduling/availability-service.ts` (existente).
- `apps/web/modules/scheduling/beneficiary-service.ts` (existente).
- `packages/contracts/src/scheduling.ts` (existente).
- `apps/web/modules/scheduling/ui/booking-detail.tsx` (existente).
- `packages/db/src/repositories/members.ts` (existente).
- `apps/web/modules/scheduling/export-adapter.ts` e `export-adapter.test.ts` (novos planejados).
- `apps/web/app/(admin)/scheduling/exportar/page.tsx` (nova planejada).

## Rollout, migração e rollback

Uma entrega/worktree; mudanças SQL aditivas e numeradas coordenadas pela spec001. Preparar
compatibilidade de leitura de chaves/snapshots antes de ativar migrações e novos botões. Conta sem
acesso não ganha concessão para preservar conveniência. Diagnosticar conflitos antes da
restrição008; parar sem corrigir registros automaticamente. Rollback da UI/API deve preservar grants
convertidos, dados e arquivos; não publicar binário antigo que dependa exclusivamente de
audit:export/reports:export após conversão. Preferir correção compatível para frente; reversão SQL
exige plano e evidência próprios.

## Validation e próximo passo

Duas reservas concorrentes da mesma pessoa em profissionais/unidades distintos: uma aceita;
titular/dependentes distintos podem coincidir. Bloqueio mantém reserva/vaga e mostra aviso. Sem read
some/nega; só read não altera. Exportação não herda teto visual.

Executar roteiro [quickstart.md](quickstart.md) na implementação. Evidência anterior nunca conclui
tarefa nova. O incremento T025–T039 já possui tarefas geradas e continua sem execução. O desenho 2C abaixo é
apenas documental; requer decisões de produto, contrato externo e tarefas próprias antes de código.

## Complexity Tracking

Núcleo comum necessário para aplicações repetidas em oito funções; adaptadores mantêm as regras dos
domínios. Sem microserviço, linguagem nova ou nova fonte de verdade. Estado operacional serve
somente à transferência atual; não é fila/histórico obrigatório.

## Continuação do plano — incremento 2C app/site (23/09/2026)

**Estado:** planejamento preliminar da parte de Agendamentos na primeira experiência externa,
conforme [US3/2C na spec](spec.md) e [pesquisa atual](research.md). Este texto não altera o
recorte ativo T025–T039, não conclui T022 e não autoriza implementação ou publicação.
A interface completa do app/site terá especificação própria no programa 002. Uma vez
resolvidas as decisões de produto, reconciliar os dois documentos antes de gerar tarefas.

### Dependências e ordem

1. Concluir ou incorporar no mesmo incremento as garantias de consulta/alteração,
   conflito por beneficiário e sinalização de bloqueio descritas em AC/BEN/BLQ. A
   exportação DX01 tem entrega própria e não é pré-requisito técnico para a reserva externa.
   CAL06 é revisão da interface administrativa, sem alterar o núcleo de vagas.
2. Vincular cada identidade externa ao cadastro individual em Associados e aplicar a decisão de
   23/09: titular reserva para si e seus dependentes; dependente reserva somente para si.
   Fechar visibilidade do histórico e revogação de acesso antes do contrato. Não usar conta
   administrativa como conta do app/site nem expor a seleção administrativa de beneficiários
   como API pública.
3. Inventariar reservas, contas e identificadores do legado antes de definir coexistência,
   migração ou corte. Sem correspondência confiável, não criar contas ou reservas duplicadas.
4. Aplicar a decisão de 23/09: serviços publicados para o canal ficam visíveis antes do login;
   vagas exigem autenticação. Definir políticas externas de antecedência, confirmação,
   remarcação e cancelamento. Regras sem decisão permanecem bloqueadoras do contrato externo,
   sem default copiado de fornecedores.
5. Após essas decisões: atualizar spec/contrato/modelo/quickstart, produzir tarefas e
   executar análise cruzada. Código, CI e ativação dos canais pertencem a uma etapa posterior.

### Arquitetura candidata e fronteiras

- O módulo scheduling continua proprietário da oferta, disponibilidade, reservas e histórico no
  PostgreSQL. Painel e canais externos chamam os mesmos serviços de domínio; a API externa tem
  contrato versionado e projeções próprias, sem compartilhar endpoints/sessão administrativos.
  Nenhum SDK, iframe ou banco de fornecedor é fonte de verdade.
- O domínio Associados resolve a pessoa atendida e o direito vigente do ator externo de agir por
  ela. A fronteira recebe identificadores mínimos e resultado autorizado; documentos, finanças,
  papéis e dados de titular não são copiados para Agendamentos.
- Separar ator, beneficiário e origem do comando. Antes de escolher migration, conferir se
  created_by e eventos atuais exigem FK de usuário administrativo; uma identidade externa não
  pode ser gravada falsamente como colaborador nem como beneficiário autor. Planejar adaptação
  aditiva de autoria/auditoria com compatibilidade para eventos antigos.
- Visibilidade por canal deve ser explícita e aplicada nas leituras e comandos. Antes do login,
  expor somente serviços publicados para o canal, com projeção mínima; nunca o catálogo
  administrativo inteiro, dados privados ou horários disponíveis. Consultas de vagas exigem
  identidade externa validada. Delimitar cache por tipo de resposta; respostas privadas não
  recebem cache compartilhado.
- Continuar com datas UTC, intervalos [início, fim) e apresentação em America/Bahia. A consulta
  de vagas usa as regras existentes e as políticas externas aprovadas; a confirmação revalida
  tudo na transação. A constraint de profissional e a proteção por beneficiário garantem conflitos
  sob concorrência. Uma prévia ou calendário externo não reserva a vaga.
- Criação, remarcação e cancelamento mantêm idempotência, versão, histórico e auditoria; falha
  de confirmação não altera a reserva anterior. Nenhum status de comparecimento ou avaliação é
  inferido do horário.

### Contratos a detalhar depois das decisões

Preparar contrato externo versionado para: oferta visível por canal; consulta de vagas por
procedimento/unidade/profissional e beneficiário quando necessário; confirmação; próximas e
históricas próprias; detalhe; remarcação; cancelamento. Definir autenticação, autorização,
campos mínimos, paginação/limites de consulta, fuso, códigos de conflito e sessão revogada.
Não fixar caminhos, payloads ou estado inicial antes de decidir identidade e políticas.
Manter o contrato administrativo em [contracts/admin.md](contracts/admin.md) e criar
contrato externo responsável sem substituir consumidores do painel.

### Experiência e acessibilidade

O planejamento de navegação externa cobre descoberta de serviços antes do login e, depois de
autenticar, identificação do beneficiário, seleção de vaga, revisão/confirmação e “Minhas reservas”,
com recuperação de conflito sem
perder escolhas. O painel mantém Lista/Dia/Semana/Mês e ações existentes. A pesquisa identifica
padrões, mas não define aparência: ler o guia canônico docs/caab-design.md da pasta principal
e a spec da interface app/site antes de desenhar telas. O guia local estava inacessível nesta
revisão remota; nenhuma conformidade visual foi presumida. Validar teclado, foco, mensagens de
estado, tela móvel e WCAG 2.2 AA em protótipo e na entrega.

### Validação planejada

- Contratos: visitante sem login consulta apenas serviços publicados para o canal, sem dados
  privados/rascunhos; consulta anônima de vagas é negada. Identidade revogada não consulta vagas
  ou reservas; ator sem vínculo não enumera nem lê reserva de terceiro.
- Integração em PostgreSQL descartável: painel versus app/site disputam mesma vaga; mesmo
  beneficiário em unidades/profissionais distintos não sobrepõe; titular e dependente distintos
  podem coincidir; retry não duplica; remarcação recusada conserva vaga/histórico.
- Jornada com identidades sintéticas: titular reserva para si e dependente; dependente reserva
  para si e é negado ao tentar reservar para titular ou outro dependente. Recarregar painel e canal
  externo, consultar histórico autorizado, remarcar, cancelar, revogar vínculo/sessão e revalidar
  bloqueio. Testar
  horário com navegador em outro fuso e mudança de oferta entre prévia e confirmação.
- Interface: estados vazio/carregamento/erro, recuperação, teclado, 390 px, temas e revisão
  pelo guia CAAB; evidências por versão e canal. Medir tempo para encontrar vaga, conflito
  recuperável e trabalho manual, sem inventar metas antes de medir a linha de base.
- Gates do workflow e homologação dos consumidores externos só depois do contrato e ambiente
  autorizados. Usar dados sintéticos; não ativar localhost, seed real ou serviço pausado
  por este plano.

### Transição e rollback

Planejar compatibilidade de leitura dos consumidores e migração verificável de reservas/contas
que precisem sobreviver ao corte. Não fazer escrita dupla cega entre legado e CAAB. Definir
responsável, janela de corte, deduplicação, reconciliação e retorno antes de publicar o canal.
Rollback do cliente/API preserva reservas, autores e histórico; não remover migrations ou
dados para desfazer uma interface. A ativação em produção depende de evidências e autorização
do fluxo de entrega.

### Decisões ainda bloqueadoras

Mecanismo de identidade externa, gestão do vínculo e visibilidade do histórico de dependentes;
profissional opcional; política por canal para antecedência/remarcação/cancelamento; estado inicial
e eventual confirmação humana; mensagens reais; contas e reservas do legado. Até resolvê-las,
o plano pode orientar contratos e protótipos, mas não serve como ordem de implementação.

## Histórico anterior — referência, não sequência executável atual

O conteúdo abaixo preserva decisões/evidências anteriores. Em caso de divergência, valem o desenho
de 21/09 acima e a spec vigente; não reabrir branches/PRs já integrados.

<details>
<summary>Plano anterior preservado</summary>

# Implementation Plan: Agendamentos em três etapas

**Branch**: `feature/scheduling-management-20260915` | **Date**: 2026-09-15 **Spec**:
[spec.md](spec.md) **Status**: etapa 1 (US1 + US2) implementada e validada; resultados em
[evidence/release-review.md](evidence/release-review.md). O setup-plan resolveu os caminhos da spec;
seu campo BRANCH inferiu o nome da pasta. A branch real foi conferida com git e é a indicada acima.

## Summary

### Continuidade vigente — 18/09/2026

Entrega original do calendário: `feature/reports-analytics-20260918` (PR34 integrado); PR34 ainda
aberto. Incremento CAL-F01–CAL-F06: FullCalendar Standard 7.1.0/React e temporal-polyfill 1.0.1,
importação dinâmica somente ao abrir a grade. Plugins daygrid/timegrid e tema classic adaptado aos
tokens; locale pt-BR e America/Bahia. Toolbar com Button/Link existentes, visualização/data
controladas pela URL. Novo GET /api/v1/scheduling/calendar, limites 42 dias/1.000 registros e mesmas
guardas. Nenhuma migration ou alteração dos comandos transacionais. Carregamento abortável pela
infraestrutura existente; limpar eventos anteriores ao trocar consulta/erro. Testar contratos,
limites/isolamento no banco, navegação, fuso e ações no navegador. Consolidar
implementação/testes/documentação antes dos checks locais e CI final. App/site permanece posterior;
não executar automaticamente o restante do roadmap.

### Implementação autorizada em 15/09/2026

Branch atual feature/scheduling-management-20260915, mesma worktree do planejamento. T001–T020
autorizadas pelo pedido de execução. Hipóteses da primeira versão mantidas conforme recorte
apresentado: lista diária, reservas individuais futuras, Agendado/Cancelado. Migration0020;
envelopes de erro seguem padrão existente (validação422, não400). Escritas da agenda e mudanças de
elegibilidade usam o advisory lock transacional5010/1, já existente para vínculos de Associados,
antes de locks de linhas. Esta primeira versão serializa escritas curtas para eliminar corridas
entre catálogo, horários, titulares e reservas; leituras continuam concorrentes. GiST impede
sobreposição também no banco. Otimização por profissional só se medição posterior justificar
complexidade. Horários semanais têm uma faixa por dia; almoço divide a jornada e reinicia a grade de
vagas pela duração do procedimento. Alterar pai de um cadastro existente é recusado; criar
vínculo/cadastro novo preserva referências e histórico. Busca mínima de pessoas retorna nome, ano de
nascimento e OAB quando disponível, sem CPF/contato/documentos.

Primeiro entregar catálogo mínimo + horários + lista diária + criar/consultar/remarcar/ cancelar no
painel. Após essa primeira versão validada, o próximo passo do produto será a primeira versão da
interface do usuário no app/site, com especificação própria e integração de reservas coordenada
nesta spec. Depois retomar os demais incrementos até o legado e, por último, selecionar sugestões
novas. [Roadmap e limites](roadmap.md).

## Technical Context

- **Language/Version**: TypeScript 6, Node 24, versões da base atual.
- **Primary Dependencies**: Next.js 16.3.4/React 19, pg, Zod, formulários e componentes existentes.
  Não instalar Cal.com. Lista inicial com componentes existentes; decisão documentada de adiar
  FullCalendar apesar da referência anterior em STACK.
- **Storage**: PostgreSQL, migrations aditivas; nenhuma migration escrita nesta fase.
- **Testing**: Vitest para contratos/unidade/integração real, Playwright e axe.
- **Target Platform**: painel web desktop/mobile; serviços locais desligados.
- **Project Type**: monólito modular; scheduling é domínio próprio.
- **Performance Goals**: lista diária paginada (25 padrão/100 máximo), sem carregar
  catálogo/histórico inteiro; alvo de primeira resposta útil em 2s em ambiente de validação com 10
  mil reservas sintéticas. É alvo proposto, não SLA comprovado.
- **Constraints**: UTC persistido, America/Bahia exibido; Q8 exige acesso concedido a Agendamentos.
  Sem motivo obrigatório, dados clínicos ou créditos.
- **Scale/Scope**: várias unidades e serviços; uma pessoa e um profissional por reserva na primeira
  entrega. Um profissional pode ter vínculos válidos em várias unidades, mantendo prevenção global
  de conflito para sua identidade.

## Constitution Check

Pré/pós-design: solução coesa no monólito, PostgreSQL como autoridade, contratos versionados,
auditoria, minimização e acessibilidade. Sem nova infraestrutura. Decisões explícitas do usuário
prevalecem sobre trechos históricos locais: Q8 de 21/09 exige acesso concedido a Agendamentos além
da sessão administrativa; motivos não são obrigatórios. Não ampliar permissões de outros módulos.
Branch feature vigente conforme instrução do ambiente; exceção de Processamentos em outra branch
está registrada no mapa local. Gates de implementação continuam exigidos; planejamento não equivale
a aprovação de CI, teste, merge ou deploy. Nenhuma integração Cal.com necessária identificada.

## Project Structure

Documentação em specs/008-scheduling-management: spec, plan, research, roadmap, data-model,
contracts/admin.md, quickstart, tasks e checklists/requirements.md.

Estrutura implementada:

- apps/web/modules/scheduling/ — catálogo, horários, disponibilidade, comandos e UI.
- apps/web/app/(admin)/scheduling/ — lista, configuração e detalhes.
- apps/web/app/api/v1/scheduling/ — endpoints autenticados do painel.
- packages/contracts/src/scheduling.ts — contratos.
- packages/db/migrations/ — 0020_scheduling.sql.
- packages/db/src/repositories/members.ts — leitura mínima e coerente da elegibilidade.
- apps/web/modules/members/ — coordenação de bloqueios/vínculos com confirmação.
- apps/web/modules/workspace/ — navegação e busca.
- apps/web/modules/audit/ — descrições humanas dos eventos.
- apps/web/tests/integration/scheduling.test.ts e tests/e2e/scheduling.spec.ts.

**Structure Decision**: reaproveitar componentes/auth/auditoria e cadastro de associados. Unidades
da agenda não são automaticamente unidades de Parceiros; profissionais não são contas de login. Não
antecipar motor genérico de recursos, turmas ou pagamentos.

## Sequência da entrega

1. Contratos/modelo, migrations e testes de integridade.
2. US1: catálogo mínimo, autorização e horários, busca de beneficiário e criar reserva.
3. US2: lista/detalhes, remarcação/cancelamento, integração com auditoria e navegação.
4. Executar roteiro, CI e revisão visual; abrir PR somente quando a entrega for funcional.
5. Após validar a primeira entrega, priorizar a primeira interface do usuário no app/site: preparar
   seu spec/plano/tarefas próprios e detalhar a integração de reservas nesta spec (incremento
   2C/T022), antes dos demais incrementos da etapa 2.
6. Entregar e validar o recorte definido para app/site; depois retomar os demais incrementos de
   Agendamentos, atualizando esta spec.
7. Novidades só após seleção explícita; não executar roadmap como backlog já autorizado.

## Integridade e concorrência

- Decisão de 20/09/2026 (FR-017; implementação pendente): bloqueio administrativo não modifica
  reservas existentes nem libera ocupação. Consultas de agenda/detalhes devem projetar a sinalização
  do impedimento próprio ou de titular vigente com a mesma regra de elegibilidade dos comandos, sem
  copiar o status para dependentes. Preservar Agendado/Cancelado e a auditoria; não criar rotina
  automática de cancelamento. Validar lista/calendário/detalhes e cancelamento manual com pessoas
  sintéticas.

- Intervalos [início,fim); exclusion constraint GiST por profissional e intervalo para status
  scheduled. Extensão btree_gist aplicada pela migration.
- Decisão de 20/09/2026 (FR-016; implementação pendente): acrescentar proteção transacional e
  restrição no PostgreSQL por member_id e intervalo para scheduled, preservando a restrição por
  profissional. member_id identifica a pessoa atendida; nunca usar o titular para agrupar
  dependentes nem user.id do operador. Antes de aplicar nova migration, diagnosticar sobreposições
  preexistentes e exigir resolução explícita, sem cancelar, apagar ou remarcar dados
  automaticamente. Criar/remarcar deve revalidar ambos os conflitos; a própria reserva fica excluída
  da comparação ao remarcar. Canceladas não ocupam intervalo; limites são [início,fim). Cobrir
  concorrência, rollback e independência de titular/dependentes em banco descartável e na jornada da
  interface quando a implementação for retomada.
- Criar/remarcar em transação, com lock de configuração/identidades e releitura. Escritas em
  horários/catálogo usam a mesma ordem de locks. Erro na remarcação faz rollback.
- Mudanças em bloqueio/vínculo de dependência precisam participar do mesmo protocolo. Apenas reler o
  associado não elimina corrida; cobrir criação/encerramento de vínculos e bloqueio de titular em
  testes de integração da spec005 também.
- Repetição: idempotency key por ator/operação, hash do pedido e resultado persistidos junto da
  alteração. Chave reutilizada com outro conteúdo retorna conflito.
- Edição: versionamento otimista; datas, duração e vínculo definidos no servidor.
- Busca mínima de beneficiários sob autorização de Agendamentos retorna apenas id/nome/indicação
  suficiente para seleção; não exige members:read nem libera o cadastro completo de Associados.
  Validar contra nomes iguais e dados sensíveis.

## Rollout, migração e rollback

Primeira entrega independente do legado, uso administrativo; sem sincronização, seed real ou
migração automática. Preservar dados de qualquer preview existente. Mudanças aditivas no schema;
rollback da aplicação preserva registros gravados. Antes da conexão app/site, documentar contrato,
autenticação de beneficiário, ambiente, mapeamento de identidades/dados e corte de escrita para
evitar duas agendas concorrentes. Homologação com dados sintéticos; nenhum tráfego público muda
nesta etapa.

## Gates e próximos passos

Format/lint/types, contratos, integração real concorrente, E2E, a11y, build, segurança e revisão
humana conforme DELIVERY-WORKFLOW. Executar no CI quando houver código; não reativar localhost/banco
sem pedido. Resultados em evidence/; tarefas atualizadas conforme implementação e validação.

## Revisão autorizada de UI/UX — 16/09/2026

Branch fix/scheduling-ui-20260916, criada de dev96ea6f6 após PR28 integrado. Worktree
.cache/pr-scheduling-ui-20260916. Este ciclo substitui a indicação de branch ativa no cabeçalho
histórico.

1. Comparar UI atual com Parceiros/Associados e reutilizar componentes/layout existentes; registrar
   orientação permanente no AGENTS local.
2. Cabeçalho com inclusão e abas por cadastro; catálogo com kind na URL, busca e tabela; formulários
   com título específico, salvar/cancelar e foco acessível.
3. Agenda com busca/data e filtros adicionais recolhíveis; tabela com link de reserva, vazio com
   ação. Melhorar organização da reserva, horários, detalhes e histórico no mesmo padrão.
4. Atualizar a jornada E2E para navegar pelas ações visíveis e provar inclusões/persistência,
   filtros, teclado/390px/temas; revisar capturas no CI.
5. Qualidade/build/banco/navegador/segurança no CI; sem build ou E2E no PC. Abrir novo PR após
   revisão, sem aprovação ou merge pelo agente. Conferir estado do PR antes de qualquer atualização
   posterior.

Sem migration, dependência ou alteração de dados existentes. Rollback somente da UI/testes.

## Preservação compartilhada — 16/09/2026

Branch fix/scheduling-select-20260916, baseada em dev após PR29. Usar armazenamento temporário em
memória no layout autenticado, por rota/formulário/cadastro, com controles nativos e estado React
preservados. Integrar sucesso/cancelamento aos descartes e testar navegação entre módulos. Não usar
cache público, localStorage ou salvamento automático no banco.

## Acesso concedido a Agendamentos — Q8 de 21/09/2026

Adequar catálogo/gestão de acesso, shell e todas as guardas do módulo: páginas, calendário, oferta,
disponibilidade, busca mínima de beneficiários e comandos. Sem concessão, ocultar módulo na barra
lateral, busca e Início; URL/API continuam protegidas no servidor e revalidam revogação. Não
conceder leitura completa de Associados como efeito colateral. Exportação exige também permissão
geral. Q9 define consulta/alteração separadas; AC01 detalha a adequação/transição técnica. A
conversão Q4 de exportação não autoriza conceder novos acessos de módulos. AC01–AC03 pendentes, sem
código ou teste novo.

Leitura do código em 21/09: `scheduling/access.ts` verifica sessão e usa o parâmetro write para lock
de elegibilidade, sem conferir concessões de consulta/alteração; `workspace/areas.ts` inclui
Agendamentos incondicionalmente. Catálogo de permissões e `user-access.ts` ainda não incluem
Agendamentos. Registrar a lacuna e adequar ao padrão existente dos demais módulos, sem alterar
Notícias para uma permissão única. Consulta controla descoberta/leitura; alteração depende de
consulta e controla mutações de oferta/horários/reservas. Exportação continua independente de
alteração, sob consulta + permissão geral. Leitura estática, sem testes nesta sessão.

## Checkpoint de revisão de código — 21/09/2026

Primeira versão administrativa e FullCalendar estão na base integrada. Falta concessão
consultar/alterar (AC01–AC03), conflito do beneficiário (BEN01–BEN03), indicação de bloqueio
posterior (BLQ01/BLQ02) e exportação DX01. CAL06 permanece validação visual/documental, sem
alteração de PR34 já integrado. Horários semanais/almoço e conflito do profissional já existem;
T021–T024 são expansões.

Revisão estática da base `ed31baf`; nenhum teste de aplicação ou homologação nesta etapa. Evidências
e limites: [revisão transversal](../002-integrated-modules/code-audit-2026-09-21.md).

Executar adequações e seus testes em retomada de implementação. Preservar dados e decisões adiadas;
a revisão atual altera somente documentação.

</details>

## Integração com exclusão lógica — 21/09/2026

Projetar a vigência da exclusão no DTO da reserva; guardar data de exclusão analisada, responsável e
instante da decisão de manter. Acrescentar comando versionado/auditado de manutenção; reutilizar
cancelamento. Validar fronteira de sete dias, autorização, concorrência, restauração e preservação
da ocupação até cancelamento explícito.

Checkpoint de execução do ciclo de vida,21/09/2026: incremento implementado e validado no
CI35641862727, com migração0028 aditiva, controle de versão e auditoria. Tarefas LC e evidências
atualizadas; exportação própria continua planejada. Sem aplicação ao banco local. Clarify do recorte
concluído; analyze restrito às alterações concluído sem achados relevantes; gates compartilhados
aprovados em57d6b56.
