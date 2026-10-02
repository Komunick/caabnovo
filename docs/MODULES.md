# Módulos e responsabilidades — entrega integrada

## Desenho vigente após clarify — 21/09/2026

Permissão geral `exports:generate` intersecta consulta de módulo/dados; sem acesso,
zero descoberta no menu/busca/Início. Notícias preserva read/write/publish, mas a
concessão implícita da view será removida; Agendamentos terá read/write explícitos.
Exportações novas usam filtros/colunas e Excel/CSV/PDF diretos, sem teto funcional
ou prazo/histórico obrigatório; dados/arquivos legados preservados. Desenho e tarefas
em [programa002](../specs/002-integrated-modules/plan.md).
Mensagens tem finalidade confirmada (comunicados/campanhas), mas continua protótipo
sob revisão de aderência; canais reais, chat interno e suporte futuro permanecem adiados.
Retenção institucional e critérios/documentos de dependentes ficam para depois.
Estados e propostas anteriores abaixo são históricos quando divergirem desta revisão;
nenhum código foi implementado pelo plan/tasks e localhost permanece desligado.


## Cargos iniciais definidos — 21/09/2026

Administrador tem todas as permissões concretas dos módulos disponíveis, atuais e futuros, incluindo exportação e gestão de cargos/acessos. Gestor possui consulta a todos os módulos, exportação geral e acesso completo a Relatórios; pode conceder acessos de qualquer módulo a outros colaboradores, inclusive alterações que não possui para uso próprio, mas não altera os próprios acessos nem atribui cargos. Colaborador somente usa os acessos recebidos e não concede cargos ou permissões. Atribuição de cargos permanece com Administrador.

Desenho em [001](../specs/001-project-foundation/contracts/roles.md); criação dos novos cargos e adequações ainda pendentes no código.

## Inventário conferido no código — 21/09/2026

Base ed31baf. Revisão estática, sem homologação remota nem testes novos.
Fonte rastreável: [revisão de código/backlog](../specs/002-integrated-modules/code-audit-2026-09-21.md).

| Área | Implementado | Pendente |
| --- | --- | --- |
| Colaboradores / Conta | Contas, permissões, senha inicial, perfil/e-mail/senha/recuperação, sessões | Cadastro público ainda habilitado em dev; homologação SMTP; erros de concorrência; exportação geral |
| Auditoria / Processamentos | Eventos, filtros, detalhe, listagem de jobs e reenvio | Exportação atual JSONL/fila; três formatos/direto; autorização do worker e do download genérico |
| Notícias | Editor/mídia/versões, publicar/programar, rotas e páginas públicas | Revogação no worker, ocultação completa no Início, exportação e evidência HTTP T027 |
| Associados | Cadastro/foto/dependentes/documentos/análises/situação e adaptador OAB | OAB hospedada/homologada, critérios institucionais, credencial externa/identidade app, exportação |
| Parceiros | Administração/diretório/categorias/contratos/benefícios, API pública e moderação | Portal, QR/resgates, coleta externa de avaliações e exportação |
| Agendamentos | Catálogo, horários/almoço, reserva/remarcação/cancelamento, histórico e FullCalendar | Permissões, conflito por beneficiário, sinalização de bloqueados, CAL06, app/site/expansões, exportação |
| Mensagens | Protótipo de campanhas/modelos/públicos/preferências e programação | M016, meios/provedores e entrega real, exportação |
| Relatórios | Três abas, consultas salvas, exportadores e coleta no painel | Novo padrão direto/três formatos/ordem de colunas, permissão geral, acesso a dados de Agenda, coleta externa |
| Início / Meu trabalho | Atalhos, notícias publicadas, rascunhos e cadastros sem análise | Ocultação por acesso; demais pendências operacionais em T053 |
| App/site / Portal | Leitura pública de notícias/benefícios e ingestão de analytics como infraestrutura | Interfaces completas/identidade externa/reservas/portal e integração efetiva |
| CAASSH / RH / chat / tickets | CAASSH apenas sinalizado desativado | Créditos suspenso; demais possibilidades sem construção autorizada |

Todos os módulos/abas entram no [padrão de exportação](EXPORT-STANDARD.md).
Existência de teste ou tarefa histórica concluída não comprova as novas regras.
Preservação de campos existe, mas erros de concorrência ainda exigem adequação (001 T097).

## Decisões consolidadas — atualização de 21/09/2026

**Decisão vigente — 21/09/2026:** a finalidade de Mensagens foi confirmada: comunicados e campanhas aos associados, com seleção de público e programação. O código existente continua sendo um protótipo, sem homologação do produto. A definição de finalidade substitui a pendência de 17/09; revisão de aderência do protótipo e critérios de continuidade permanecem em M016. Meios, provedores e envio real continuam adiados. Conversa interna do painel e suporte por tickets do app/site são possibilidades de módulos futuros separados, com nomes e funcionamento sujeitos a pesquisa posterior; não estão em implementação.

Colaboradores é a gestão atual de contas e permissões, nas rotas `/users`; não há cadastro separado de RH. Um módulo futuro chamado **Recursos Humanos** permanece como possibilidade, pendente de definição de finalidade, escopo e autorização de construção. Essa possibilidade não reativa os requisitos antigos COL-001–COL-005 nem autoriza duplicar contas ou permissões.

Agendamentos já possui uma primeira versão administrativa implementada; app/site e expansões continuam pendentes. As seções históricas não reabrem autorizações nem substituem este estado.

## Agendamentos — implementação da etapa 1 em 15/09/2026

A primeira versão do painel está implementada na branch feature/scheduling-management-20260915:
oferta, horários semanais/almoço, reservas futuras, consulta, remarcação, cancelamento
e histórico. Q8 de 21/09 redefine o acesso: sessão administrativa e concessão do
módulo. Código existente ainda precisa de adequação (008 AC01–AC03).
Validação e limites na [spec 008](../specs/008-scheduling-management/spec.md) e nas
[evidências](../specs/008-scheduling-management/evidence/release-review.md).
Esta atualização substitui o estado anterior de “somente pesquisa” para esse recorte.
Exceções, avaliações e demais estados permanecem posteriores. O calendário foi priorizado em 18/09 e está implementado; CAL06 segue aberto.
A primeira interface do usuário no app/site segue pendente; CAASSH continua desativado.

Atualizado em 09/09/2026 por orientação do responsável: incluir todos os módulos no escopo da mesma
entrega, reaproveitar a fundação e fundir Operações com Auditoria. Melhorias posteriores não
dispensam integridade dos dados, autorização e uma jornada funcional verificável na primeira versão.

Cada funcionalidade nova tem spec, plano e tarefas próprios, ligados ao
[planejamento geral](../specs/002-integrated-modules/plan.md). A primeira implementação é
[Auditoria e Processamentos](../specs/003-audit-operations/spec.md). Essa separação organiza o
trabalho; não cria PRs preliminares ou um PR apenas de documentação.

## Comparação com a implementação atual

### Parceiros — implementação em branch própria (spec 007)

O módulo administrativo de estabelecimentos externos é detalhado na
[spec 007](../specs/007-partners-management/spec.md), no
[plano](../specs/007-partners-management/plan.md) e nas
[tarefas](../specs/007-partners-management/tasks.md). Possui sete páginas: lista de
parceiros, novo parceiro, detalhe com Cadastro/Unidades/Contratos/Benefícios/Avaliações/Histórico,
lista geral de benefícios, unidades, categorias e configurações do app. Cadastros novos
e alterações dispensam motivo, com auditoria preservada em ambos.
O [mapa de interface](../specs/007-partners-management/interface.md)
registra suas funções e a harmonização com Associados e Notícias.

Permissões individuais distinguem consulta, edição e aprovação/publicação. Documentos
permanecem privados; a API pública v1 entrega apenas ofertas publicadas e vigentes por
canal, revalidando parceiro, unidade e contrato em cada leitura. Portal, contas de
parceiro, QR/resgates, créditos e coleta de avaliações não integram esta implementação.
Consulte as evidências da spec para o estado da validação e do PR.

### Inventário histórico da base inicial — não representa o estado atual

Inventário do projeto novo em `dev` após o PR #10 (`284f867`), obtido de rotas, módulos e migrations
deste repositório. Não foram consultados código, telas ou contratos do sistema antigo.
Este retrato de 09/09/2026 é preservado como histórico: MFA foi retirado,
Colaboradores passou a nomear contas e Mensagens evoluiu para protótipo.
Não usar as lacunas desta tabela como backlog atual.

| Capacidade atual                        | Evidência no projeto novo                                                                    | Destino / decisão                                              | O que ainda precisa ser construído                                                                                                               |
| --------------------------------------- | -------------------------------------------------------------------------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Login, MFA e sessão                     | `modules/auth`, rotas `/login`, `/mfa`, `/sessions`                                          | Reutilizar em Equipe e acesso; sessões continuam pessoais.     | Recuperação de acesso e jornadas externas conforme requisitos. Não criar outro login por módulo.                                                 |
| Contas, funções e permissões            | `modules/users`, `/users`, tabelas `user`, `role`, `user_role`                               | Reutilizar em Equipe e acesso.                                 | Cadastro de colaboradores e escopos institucionais. Conta não é cadastro de associado, colaborador ou parceiro.                                  |
| Consulta e exportação de eventos        | `modules/audit`, `/audit`, `/audit/exports/[jobId]`                                          | Auditoria → Eventos.                                           | Históricos contextuais dos novos domínios usando a mesma trilha.                                                                                 |
| Lista, progresso e reenvio de jobs      | `modules/jobs`, `/operations/jobs`, `job_execution`                                          | Fundir na navegação: Auditoria → Processamentos.               | Novos tipos de job por domínio. Não criar outra central de jobs nem transformar eventos imutáveis em execuções editáveis.                        |
| Upload, quarentena e acesso a arquivos  | `modules/files`, `stored_file`, APIs `/api/v1/files`                                         | Serviço compartilhado usado por conteúdo, pessoas e parceiros. | Experiência de mídia/documentos e autorização por proprietário de domínio. Não duplicar storage ou tabela de arquivo por módulo.                 |
| Dashboard e navegação rápida            | Página inicial, `AuthorizedNav`, `WorkspaceControls`                                         | Meu trabalho, com entradas únicas por módulo.                  | Pendências reais de cada domínio. Não contar Eventos e Processamentos como módulos independentes.                                                |
| Filas, idempotência e worker            | `apps/worker`, `job_execution`, `idempotency_record`                                         | Infraestrutura comum.                                          | Publicação, mensagens e demais tarefas específicas com seus contratos.                                                                           |
| Notícias e mídia editorial | Editor, mídia, destaques, histórico, publicação, agenda e API pública v1 em /news, spec 004 | Comunicação → Conteúdo e destaques. | Função concluída no painel; interfaces externas integram o contrato público de consulta. |
| Associados e dependentes                | Sem cadastro de domínio correspondente                                                       | Pessoas.                                                       | Cadastro, vínculo, análise documental, credencial, verificações e elegibilidade. Não reutilizar a tabela de login como cadastro de beneficiário. |
| Oferta e agendamento                    | Sem domínio correspondente                                                                   | Agendamentos.                                                  | Unidades próprias, serviços, profissionais/recursos, disponibilidade, reservas, desfechos e avaliações.                                          |
| Parceiros e benefícios                  | Sem domínio correspondente                                                                   | Benefícios.                                                    | Organizações parceiras, unidades, contratos, ofertas, condições e avaliações.                                                                    |
| Colaboradores                           | Sem cadastro de domínio correspondente                                                       | Equipe e acesso, junto das contas existentes.                  | Dados administrativos e relação opcional com conta. Não recriar usuários ou papéis.                                                              |
| Campanhas e automações de comunicação   | Sem domínio correspondente                                                                   | Comunicação → Mensagens.                                       | Públicos, modelos, prévia, agendamento e acompanhamento por canal. Reutilizar worker e jobs.                                                     |
| Caassh                                  | Sem domínio correspondente                                                                   | Créditos.                                                      | Programa configurado, contas de crédito, lançamentos, lotes e correções rastreáveis. Regras institucionais precisam ser fornecidas.              |
| Área de parceiros / solicitações por QR | Sem domínio correspondente                                                                   | Portal do parceiro.                                            | Visão externa restrita dos mesmos parceiros e solicitações. Não criar cadastro paralelo de parceiro nem presumir pagamento bancário.             |
| Relatórios de negócio                   | Há somente exportação de auditoria                                                           | Relatórios, alimentados pelos domínios existentes.             | Consultas e exportações úteis de cada área; preservar filtros, período e permissões. Não manter dados editáveis duplicados para relatórios.      |

## Organização final do escopo

| Entrada            | Subáreas e responsabilidade                                                                                                                          |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Meu trabalho       | Pendências, próximos atendimentos e falhas que o perfil pode resolver.                                                                               |
| Pessoas            | Associados, dependentes, análise documental, verificações, credencial e elegibilidade.                                                               |
| Agendamentos       | Agenda, oferta de serviços, unidades próprias, profissionais/recursos, horários, exceções, presença/falta e avaliações.                              |
| Benefícios         | Parceiros, unidades de parceiros, ofertas, categorias/tags, condições, contratos, visibilidade e avaliações.                                         |
| Comunicação        | Notícias, mídia, destaques, versões, publicação, campanhas, segmentos e mensagens automáticas.                                                       |
| Créditos           | Caassh, regras configuradas, concessões individuais/em lote, extrato, conversão e correções rastreáveis.                                             |
| Equipe e acesso    | Colaboradores, contas, funções/grupos, permissões efetivas e escopos. Sessões e recuperação integram a segurança da conta.                           |
| Auditoria          | Eventos de negócio e Processamentos, incluindo falhas, progresso, exportações e reenvios autorizados.                                                |
| Relatórios         | Visões e exportações dos mesmos registros de negócio, sem segunda fonte de verdade.                                                                  |
| Portal do parceiro | Superfície externa com escopo de organização; consulta/operação de solicitações e QR conforme regras confirmadas. Não é uma cópia do administrativo. |

Todos esses domínios integram a entrega solicitada. A ordem interna de construção segue
dependências, sem retirar módulos do escopo ou gerar PRs preliminares. Contratações, migração de
dados e alterações em produção permanecem fora desta autorização.

## Regras para evitar duplicatas

O aplicativo mobile é consumidor previsto de parte das funções, conforme orientação de
09/09/2026. Cada spec deve declarar se atende painel, site, app ou portal, e definir o contrato e
os campos necessários ao destino. Os canais são independentes: conteúdo destinado somente ao app
não deve ser exposto automaticamente no site. Disponibilização de conteúdo e notificação push
são operações distintas. O app reutiliza os dados dos domínios; não ganha cadastros paralelos nem
acesso às APIs administrativas por esse vínculo.

1. Um domínio é responsável por cada registro: associado em Pessoas, colaborador em Equipe, parceiro
   em Benefícios. Relações entre esses registros não significam cópia automática dos dados.
2. Autenticação, autorização, arquivos, fila, idempotência e auditoria são reutilizados por todos.
3. Aprovação cadastral, vínculo, regularidade OAB, situação financeira, validade da credencial e
   elegibilidade são dimensões distintas, com fonte e atualização explícitas.
4. Unidade própria de atendimento e unidade de parceiro têm responsabilidades distintas. Endereço
   semelhante não é motivo para unificá-las numa entidade institucional indistinta.
5. Avaliação referencia atendimento ou benefício; moderação preserva o teor original e registra
   motivo histórico opcional.
6. Mensagem transacional referencia o evento do domínio; campanha referencia conteúdo e público.
   Ambas usam a mesma infraestrutura de envio e acompanhamento.
7. O portal consulta os mesmos registros autorizados do parceiro. QR representa uma solicitação
   identificável; pagamento concluído exige confirmação específica, se essa integração existir.
8. Créditos usam lançamentos; concessão, utilização e correção não são simples edição de saldo.
9. Menus, busca rápida e dashboard devem derivar de um catálogo único das áreas disponíveis,
   evitando entradas divergentes ou repetidas. O catálogo não substitui autorização das páginas e
   APIs.

## Fusão de Operações com Auditoria

- Uma entrada principal **Auditoria** reúne **Eventos** e **Processamentos**.
- `audit:read` permite consultar eventos. `audit:export` ainda existe no código legado; alvo é permissão geral mais leitura da subárea, conforme EX01/DX01.
- `jobs:read` permite acompanhar processamentos; `jobs:redrive` continua necessário para reenviar.
- Quem só pode acompanhar jobs acessa Processamentos sem ganhar acesso aos eventos.
- Quem só pode consultar eventos não ganha acesso aos jobs nem às ações de reenvio.
- Rotas existentes podem ser preservadas como compatibilidade; não devem criar uma segunda entrada
  “Operações” no menu ou dashboard.
- Eventos, logs técnicos e execuções mantêm semântica, persistência e retenção próprias. A fusão é
  de experiência e navegação, sem apagar histórico ou fundir tabelas com responsabilidades
  diferentes.

## Limite entre escopo confirmado e regras pendentes

Incluir todos os módulos confirma sua presença na entrega, mas não inventa regras de elegibilidade,
penalidades, vínculo, documentos ou conversão de créditos. Essas decisões devem ser levantadas e
registradas durante a especificação. Integrações sem contrato podem ser desenvolvidas com
adaptadores e dados sintéticos; não podem ser apresentadas como envio real, liquidação ou
homologação externa.

Uma primeira versão funcional exige persistência, autorização, estados coerentes, histórico e
cenários de aceite executáveis. Menus vazios, números fictícios e formulários sem operação real não
concluem um módulo. Refinamentos posteriores tratam melhorias, sem adiar correções conhecidas que
comprometam essas garantias.

## Notícias — conclusão da implementação (spec 004)

Gestão editorial, imagens, destaque/ordem, histórico, prévia, publicação, retirada, agenda,
cancelamento e retry implementados usando a fundação. API v1 pública por canal e página pública
entregues. Leitura sem login por decisão expressa do usuário, revisável; gestão e rascunhos
continuam privados. App/site externos integram o contrato de consulta nos seus repositórios.
Não é necessário fornecer credencial para esta leitura; publicação não envia push.
Ver [contrato](../specs/004-news-publishing/contracts/news.md) e
[evidência](../specs/004-news-publishing/evidence.md) para gates e limites.

## Associados — incremento administrativo em validação (spec 005)

Retomada em 10/09/2026 sobre `dev` com Notícias integrada. Cadastro único, dependências históricas,
documentos privados com revisão/substituição, avaliações manuais independentes, histórico e contrato
de leitura para Caassh implementados em `/members`. O usuário confirmou permissões próprias de
consulta, edição e análise com concessão inicial apenas ao administrador existente. Cadastro de
beneficiário não cria conta de acesso. Credencial registra situação e validade; emissão verificável,
políticas institucionais e identidade mobile permanecem dependências explícitas da mesma spec.
Ver [spec](../specs/005-members-management/spec.md) e [evidências](../specs/005-members-management/evidence.md).
O usuário esclareceu em 10/09/2026 que o módulo ainda não está pronto. As verificações acima
cobrem o incremento existente; a conclusão funcional deve preceder qualquer PR.

## Colaboradores — responsabilidade atual

Colaboradores é a gestão atual de contas e permissões, nas rotas `/users`; não há cadastro separado de RH. Um módulo futuro chamado **Recursos Humanos** permanece como possibilidade, pendente de definição de finalidade, escopo e autorização de construção. Essa possibilidade não reativa os requisitos antigos COL-001–COL-005 nem autoriza duplicar contas ou permissões.

A proposta de 10/09/2026 de um cadastro funcional separado foi substituída em
11/09/2026. Não é requisito vigente nem trabalho implementado.

# Colaboradores, Usuários e Parceiros: decisão de escopo

Confirmado pelo usuário em 11/09/2026: Colaboradores no sistema antigo corresponde à
atual gestão de Usuários. Parceiros representa externos, como estabelecimentos e conveniados.
Não há módulo separado de equipe interna/RH no escopo atual.

Decisão de 17/09/2026: Colaboradores é a gestão atual de contas e permissões, nas rotas `/users`; não há cadastro separado de RH. Um módulo futuro chamado **Recursos Humanos** permanece como possibilidade, pendente de definição de finalidade, escopo e autorização de construção. Essa possibilidade não reativa os requisitos antigos COL-001–COL-005 nem autoriza duplicar contas ou permissões.

A interpretação anterior de Colaboradores como cadastro de setor, cargo e situação funcional
foi descartada. COL-001–COL-005 e T032–T035 do programa 002, como definidos para RH,
foram retirados do escopo; não são tarefas implementadas.

A interface adota **Colaboradores** na mesma gestão de contas, rotas `/users`, identificadores
e permissões existentes. Menu, catálogo, busca, cabeçalho, página, ações e mensagens usam
o nome Colaboradores. A busca também reconhece o termo Usuários. Não há novo cadastro,
API ou migration para essa renomeação.

Esta decisão substitui as propostas anteriores de cadastro funcional separado no programa
002 e no PRD. Dependências de US6 usam a gestão de contas/RBAC existente.

## Estado vigente — Agendamentos e CAASSH, consolidado em 17/09/2026

**Planejamento incremental em 15/09:** [spec 008](../specs/008-scheduling-management/spec.md)
responde por Agendamentos: o painel básico já está implementado; depois vêm
a interface app/site e novas funções escolhidas. A antiga etapa de pesquisa foi superada.

**Atualização de Agendamentos em 15/09/2026:** administração pela CAAB da oferta e
das reservas do app/site. Q8 de 21/09 substitui o acesso automático: consulta e
alteração exigem sessão administrativa e acesso concedido a Agendamentos; sem
restrição por unidade presumida.
Inclui unidades com vários serviços, profissionais, procedimentos, funcionamento e
gestão de avaliações. Autenticação e auditoria permanecem; a regra não altera outros
módulos. Não pressupor área administrativa independente de negócios/profissionais.
Cal.com é referência; integrar somente se nenhuma outra possibilidade for encontrada.
Detalhes e opções abertas no [brainstorming](../specs/002-integrated-modules/brainstorming-agendamentos.md).

A primeira versão administrativa de **Agendamentos** está implementada (US1/US2 da [spec 008](../specs/008-scheduling-management/spec.md)): oferta, horários, criação, consulta, remarcação, cancelamento e histórico. A interface do usuário no app/site e as expansões restantes continuam pendentes. O brainstorming anterior é histórico e não significa que o painel atual esteja apenas em pesquisa.

**CAASSH: desativado — pendente de revisão.** As propostas de créditos abaixo/acima
são referências históricas, sem ativação ou implementação autorizada no ciclo atual.
A revisão deverá confirmar finalidade, escopo e eventuais dependências antes da retomada.

## Mensagens — comunicados e campanhas; protótipo com finalidade confirmada (21/09/2026)

Spec [009-messaging](../specs/009-messaging/spec.md), entrada `/messages`: campanhas,
modelos, públicos, preferências, prévia, programação cancelável e histórico. Permissão
única `messages:access`, administrável na gestão de acessos existente. Meios de envio
adiados pelo usuário; não há transmissão, métricas de entrega ou automações de eventos.
A finalidade foi confirmada em 21/09; aderência do protótipo e continuidade ainda exigem revisão. **Decisão vigente — 21/09/2026:** a finalidade de Mensagens foi confirmada: comunicados e campanhas aos associados, com seleção de público e programação. O código existente continua sendo um protótipo, sem homologação do produto. A definição de finalidade substitui a pendência de 17/09; revisão de aderência do protótipo e critérios de continuidade permanecem em M016. Meios, provedores e envio real continuam adiados. Conversa interna do painel e suporte por tickets do app/site são possibilidades de módulos futuros separados, com nomes e funcionamento sujeitos a pesquisa posterior; não estão em implementação.

Mensagens: aba Agendamentos com busca, período, reagendamento e cancelamento; segmentação por dados explícitos do cadastro e situação administrativa. Sem teto de destinatários, prévia agregada e seleção visual paginada. Navegação: Notícias primeiro módulo após Início, Mensagens imediatamente antes de Auditoria.

## Relatórios e Análises — entrega de 18/09/2026

Implementação na [spec 010](../specs/010-reports-analytics/spec.md), rota `/reports`:
Resumo gerencial, Análise detalhada, Resultados e evolução. PDF/CSV no resumo,
XLSX/PDF/CSV nos detalhes, PDF/CSV e apresentação executiva, consultas pessoais,
histórico privado de exportações e métricas de uso do painel. Sites/app externos
têm contrato autenticado de ingestão; sua instrumentação ocorre nos respectivos
projetos. Sem histórico retroativo de acessos ou reconstrução de estados cadastrais
passados. Permissões `reports:read` e `reports:export`, combinadas com leitura dos
domínios. Homologação humana em DEV permanece posterior ao PR.

Exportação em todos os demais módulos foi registrada como requisito transversal
no programa 002 (EXP01–EXP03); esses botões não estão incluídos nesta entrega.

## Possibilidades futuras de comunicação — nomes a definir (21/09/2026)

| Possibilidade | Uso previsto | Próximo passo |
| --- | --- | --- |
| Conversa interna do painel | Usuários administrativos conversam entre si. | Pesquisa de uso/implementação, nomenclatura e escopo (002 FUT01). |
| Suporte por tickets do app/site | Usuário abre ticket sobre um problema, conversa com a equipe e recebe atendimento até a resolução. | Pesquisa de operação/implementação, nomenclatura e escopo (002 FUT02). |

Descrições provisórias; nomes finais não escolhidos. São módulos distintos de
Mensagens (campanhas/comunicados), registrados como possibilidades futuras. Não
há spec própria, implementação, fornecedor ou integração autorizados nesta etapa.
A pesquisa ainda será executada; depois, definir escopo e decisão de construção.

## Exportação transversal — fluxo alvo de 21/09/2026

“Exportar [módulo]” abre tela com filtros pertinentes (datas, ordenação, ações,
áreas, nomes etc.); Excel/CSV/PDF iniciam download direto de todos os resultados
autorizados. Sem teto funcional de registros/período, prazo de disponibilidade ou
etapa obrigatória de fila/histórico para baixar. Permissão geral de exportação +
acesso ao módulo/dados, com conversão automática das permissões antigas (Q3/Q4).
Substitui como requisito as descrições históricas de Relatórios acima; implementação
integrada ainda usa fila e limites. Adequação em 002 EXP06/EXP07, 010 DX01–DX03 e
specs responsáveis. Não autoriza apagar arquivos legados ou reativar módulos suspensos.

## Permissões de Notícias e Agendamentos — Q8 de 21/09/2026

Ambos exigem acesso concedido ao usuário; conta administrativa sozinha não autoriza.
Sem acesso, ocultar barra lateral, busca e Início e negar consultas/ações privadas
por URL/API. Leitura pública das notícias publicadas permanece. Exportação exige
também a permissão geral. Adequação documentada em 004/008 AC01–AC03, ainda não
implementada em Agendamentos. Q9 preserva consulta/alteração separadas; Notícias
já possui news:read/write/publish no código, a conferir e preservar. Não criar
permissão única. Transição técnica de Agendamentos pendente.
