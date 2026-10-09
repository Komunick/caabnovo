# CAAB — Sistema Interno de Gestão

## Checkpoint da consolidação — 09/10/2026

A revisão abaixo conserva o retrato consultado em 07/10/2026. Na consolidação local de 09/10, `dev`
está em `76965dc`: os PRs #48 (Mensagens/uploads/evidências) e #50 (agenda/Gitleaks) já foram
integrados. Referências a esses PRs como abertos nas seções da revisão são históricas. O plano de
Chat interno permanece documental, com implementação e homologação pendentes.

Este PRD define objetivos, requisitos e limites do produto. O [mapa de módulos](MODULES.md) e as
specs são as fontes por domínio; seus checkpoints devem ser lidos com a data e a versão a que se
referem. Planejamento, código integrado, CI e homologação são estados distintos. UI/UX segue o
[guia principal](caab-design.md).

Colaboradores corresponde às contas e permissões. Mensagens prepara comunicados/campanhas para
associados; Chat interno é uma entrega planejada independente. Portal de Parceiros aguarda revisão,
CAASSH permanece suspenso e RH é sugestão em avaliação.

## 1. Controle do documento

**Produto:** CAAB — Sistema Interno de Gestão

**Tipo:** Product Requirements Document (PRD)

**Versão:** 0.6

**Data:** 07/10/2026 (revisão integral; versão inicial de 09/09/2026)

**Status:** requisitos conciliados com as specs e tickets; capacidades integradas, pendências de
aceite e funcionalidades futuras distinguidas abaixo.

**Base conferida:** dev/origin/dev em 1c21c9a711aa12f446918ac790bc6ede76490251, incluindo
Agendamentos administrativo, cargo base Colaborador e exportações completas de Relatórios. A base
Git não comprova implantação nem estado do banco de uso.

**Cobertura:** specs 001–010 da base integrada; organização Jira/Confluence da spec 011 no PR #48;
plano local 012 de Chat interno; todos os 53 tickets retornados pela consulta final do projeto CAAB,
incluindo concluídos e históricos. Fontes, versões, limitações e correspondência por ticket estão na
[evidência desta revisão](history/prd-review-2026-10-07.md). A versão 0.5 preparada na frente de
Chat interno foi conciliada por seus requisitos CHAT-001–CHAT-015, sem substituir sua documentação.

### 1.1 Situação do produto na data da revisão

| Área / fonte                                                        | Situação observada                                                                                                              | O que permanece aberto                                                                                                                           |
| ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| [Fundação e Colaboradores](../specs/001-project-foundation/spec.md) | Autenticação, cadastro administrativo, cargo único, delegação e cargo base implementados e integrados.                          | Matriz/QA humano, ativação da migration de cargo base no destino e correção visual G01 de Mensagens no PR #48.                                   |
| [Programa integrado](../specs/002-integrated-modules/spec.md)       | Organiza dependências e critérios transversais; não equivale a todos os módulos entregues.                                      | Revisão transversal, histórico individual integrado e candidatos futuros delimitados.                                                            |
| [Auditoria e Processamentos](../specs/003-audit-operations/spec.md) | Eventos e jobs reunidos, histórico e operação autorizada existentes.                                                            | Migrar exportação própria legada para download direto nos três formatos.                                                                         |
| [Notícias](../specs/004-news-publishing/spec.md)                    | Editor, versões, mídia, publicação por canal e API pública de consulta implementados.                                           | Exportação própria, revalidação editorial no worker e validação dos consumidores externos.                                                       |
| [Associados](../specs/005-members-management/spec.md)               | Cadastro, dependentes, foto/documentos, bloqueios e consulta OAB-BA implementados.                                              | Implementação da matriz documental/definição de reanálise, exportação própria, homologação institucional da consulta e definição da carteirinha. |
| [Conta e Configurações](../specs/006-account-settings/spec.md)      | Perfil, senha, sessões, tema, rascunhos e senha inicial implementados.                                                          | Recebimento real de e-mails e caixa de entrada com escopo próprio; tema Cores Legado ainda planejado.                                            |
| [Parceiros](../specs/007-partners-management/spec.md)               | Parceiros, unidades, benefícios, avaliações, dados públicos autorizados e CEP implementados.                                    | Exportação própria e portal autenticado externo, que é uma função futura distinta.                                                               |
| [Agendamentos](../specs/008-scheduling-management/spec.md)          | Calendário, oferta por profissional/capacidade, aprovação, remarcação/recuperação, faltas e exportações integrados pelo PR #43. | QA humano/rollout, endurecimento de uploads no PR #48, ajustes visuais no PR #50; app/site e e-mails adiados.                                    |
| [Mensagens](../specs/009-messaging/spec.md)                         | Públicos, campanhas, prévia, agendamentos e histórico persistidos como protótipo.                                               | Aderência à finalidade, contratos e envio real por canal; exportação própria.                                                                    |
| [Relatórios](../specs/010-reports-analytics/spec.md)                | Resumo, análise detalhada agrupada ou não e evolução com Excel/CSV/PDF diretos integrados pelos PRs #40 e #46.                  | Medições C1/T038, revisão humana específica e QA; integração não encerra o aceite.                                                               |
| Organização documental — spec 011                                   | Aplicação parcial no Jira/Confluence e evidência preparada no PR #48; não é módulo do produto.                                  | Operações nativas de vínculos/hierarquia e fechamento documental.                                                                                |
| Chat interno — plano 012                                            | Escopo definido, ticket Em Desenvolvimento; apenas planejamento/documentação nesta revisão.                                     | Spec, contratos e tarefas completos antes do código; implementação e homologação da entrega única.                                               |

**Ordem e limites:** a prioridade máxima de Agendamentos foi definida no programa; o recorte
administrativo avançou para código integrado, com os aceites acima ainda abertos. O número de
instâncias/terminais usado em entregas antigas não define um plano atual de produto. App/site,
e-mails e canais externos dependem de seus contratos e critérios próprios. O serviço de e-mail não é
pré-condição para aceitar as regras administrativas de aprovação e faltas.

App, site externo e futuro portal participam do desenho dos contratos de conteúdo, benefícios,
cadastro, credencial, agenda e comunicação. Alterar consumidores, contratar serviços e migrar dados
exige escopo próprio. A plataforma atual concentra a operação no painel.

O laudo inicial é inventário funcional, não modelo visual ou técnico. Não consultar código, telas,
capturas ou vídeos do painel antigo sem autorização específica. Contratos e regras institucionais
não podem ser inferidos do legado ou do mercado; reaproveitamentos autorizados seguem
[LEGACY-REUSE.md](LEGACY-REUSE.md).

## 2. Resumo executivo

A CAAB precisa modernizar seu sistema interno e consolidar, em uma única plataforma segura, a gestão
de notícias, agendamentos, associados, serviços parceiros, colaboradores e logs de alterações.

O sistema deve reduzir cadastros duplicados, operações manuais, conflitos de agenda e alterações sem
rastreabilidade. A experiência deve ser moderna, rápida, acessível e adequada ao trabalho
administrativo diário.

A solução adota um monólito modular: uma aplicação única, com módulos de domínio claramente
separados e processamento assíncrono compartilhado. Notícias poderão ser distribuídas ao aplicativo,
ao site externo ou a ambos por contratos de API versionados.

## 3. Problemas a resolver

- Publicação de notícias sem fluxo claro de rascunho, revisão, agendamento e histórico.
- Conteúdo multimídia sem tratamento uniforme para imagens, vídeos e anexos.
- Agendamentos dependentes de dados espalhados entre unidades, serviços e profissionais.
- Risco de horários duplicados ou oferta de profissional indisponível.
- Cadastro de associados sem um fluxo rastreável de bloqueio e verificação da OAB.
- Gestão desconectada de parceiros e colaboradores.
- Ausência ou insuficiência de trilha de auditoria para ações críticas.
- Experiência administrativa inconsistente ou pouco eficiente.

## 4. Objetivos

### 4.1 Objetivos de negócio

- Criar uma fonte única de verdade para a operação interna.
- Reduzir o tempo de publicação e atualização de notícias.
- Impedir conflitos de agendamento.
- Melhorar a confiabilidade do cadastro de associados.
- Centralizar parceiros, colaboradores e unidades.
- Permitir apuração de quem alterou cada informação crítica.
- Preparar integrações seguras com o aplicativo e o site externo.

### 4.2 Objetivos do produto

- Disponibilizar um painel administrativo moderno e responsivo.
- Implementar permissões por função e por ação.
- Oferecer conteúdo rico com imagens, vídeos, links e anexos.
- Relacionar agendas a unidades, serviços, profissões e profissionais.
- Registrar verificações de OAB sem depender de automação não autorizada.
- Manter logs imutáveis das ações críticas.
- Expor APIs documentadas e versionadas para consumidores externos.

## 5. Não objetivos da primeira versão

- Reescrita integral do aplicativo móvel sem recorte; primeira interface autorizada para
  planejamento em UI01/UI02.
- Reescrita integral do site externo sem recorte; primeira interface autorizada para planejamento em
  UI01/UI02.
- Implantar prontuário médico ou sistema clínico completo.
- Substituir folha de pagamento ou sistema de recursos humanos.
- Automatizar consulta à OAB por scraping ou contornar CAPTCHA.
- Criar uma plataforma genérica de reservas para terceiros.
- Criar microserviços para cada módulo.
- Adicionar integrações sem contrato, documentação ou autorização formal.

## 6. Usuários e funções

**Decisão de cargos de 21/09/2026, complementada em 22/09 e 05/10:** os cargos iniciais são
Administrador, Gestor e Colaborador. Administrador tem todas as permissões concretas dos módulos
disponíveis, atuais e futuros, incluindo exportação e gestão de cargos/acessos. Gestor possui
consulta a todos os módulos, exportação geral e acesso completo a Relatórios; pode conceder acessos
de qualquer módulo a outros colaboradores, inclusive alterações que não possui para uso próprio, mas
não altera os próprios acessos nem atribui cargos. Colaborador somente usa os acessos recebidos e
não concede cargos ou permissões. Atribuição de cargos permanece com Administrador. As categorias
profissionais abaixo são descrições de atuação/propostas anteriores, não cargos adicionais a criar
nesta entrega. Contrato vigente: [cargos](../specs/001-project-foundation/contracts/roles.md).

### 6.1 Administrador

Gerencia usuários, permissões, configurações, cadastros e auditoria. Pode executar ações sensíveis
mediante autorização e confirmação aplicável. A solicitação de exclusão de Colaborador ou Associado
exige motivo; as demais ações dispensam justificativa humana.

### 6.2 Comunicação

Cria, edita, revisa, agenda e publica notícias. Gerencia categorias, mídias e canais de
distribuição.

### 6.3 Atendimento

Consulta associados, unidades, serviços e agendas. Cria, remarca e cancela agendamentos conforme
permissão.

### 6.4 Coordenação de serviços

Gerencia unidades, serviços, profissões, profissionais, disponibilidade e bloqueios de agenda.

### 6.5 Cadastro de associados

Cria e atualiza associados, registra verificações da OAB e solicita bloqueios ou desbloqueios.

### 6.6 Gestão de parceiros

Mantém serviços parceiros, vigências, documentos, unidades atendidas e situação contratual.

### 6.7 Gestão de Colaboradores e possibilidade de Recursos Humanos

Colaboradores é a gestão atual de contas e permissões, nas rotas `/users`; não há cadastro separado
de RH. Um módulo futuro chamado **Recursos Humanos** permanece como possibilidade, pendente de
definição de finalidade, escopo e autorização de construção. Essa possibilidade não reativa os
requisitos antigos COL-001–COL-005 nem autoriza duplicar contas ou permissões.

### 6.8 Auditor

Possui acesso somente leitura aos logs, históricos, versões e relatórios autorizados.

Uma pessoa pode atuar em mais de uma área, mas cada conta mantém **no máximo um cargo vigente**. As
permissões concretas resultam do cargo e dos acessos individuais válidos. Colaborador não traz
permissões próprias de negócio por padrão. O autocadastro público permanece bloqueado; criação de
contas exige fluxo administrativo autorizado. Contas novas sem cargo informado nascem Colaborador; a
migração das contas existentes sem cargo preserva acessos individuais. A decisão está definida e
implementada; sua aplicação no banco de uso exige a revisão prevista no contrato. Revogar o único
cargo ainda pode deixar uma conta sem cargo: não há reatribuição automática a cada revogação.

O plano de Chat interno define uma capacidade base para usuários internos ativos e supervisão por
cargo de Administrador/Gestor, sem delegação implícita dessa supervisão. Comentários exigem consulta
ao registro, sem conceder edição de negócio. Essa regra específica planejada deve ser conciliada com
o contrato de cargos antes da implementação.

## 7. Escopo funcional

### 7.1 Núcleo administrativo vigente

- Autenticação e autorização.
- Dashboard por função.
- Gestão de notícias e mídia.
- Publicação imediata ou agendada por canal.
- Cadastros de unidades, serviços, profissões e profissionais.
- Disponibilidade e bloqueios de agenda.
- Criação, aprovação, remarcação, recuperação, cancelamento e tratamento de faltas de agendamentos.
- Gestão de associados e registro de verificação da OAB.
- Bloqueio e desbloqueio de associados sem justificativa obrigatória, com auditoria.
- Gestão de parceiros e serviços parceiros.
- Gestão de contas e permissões, apresentada como Colaboradores.
- Logs de alterações e histórico dos registros críticos.
- Pesquisa, filtros, paginação, relatórios e exportação autorizada, com migração por módulo.

### 7.2 Evoluções e integrações com critérios próprios

O planejamento integrado conserva requisitos além do núcleo já construído. Sua inclusão não autoriza
implementação, contratação ou alteração de consumidores externos.

- Pessoas: dependentes e análise documental já têm base; matriz documental, reanálise, carteirinha
  digital e visão individual integrada continuam com recortes próprios.
- Agendamentos: autoatendimento no app/site, entrega real de avisos e expansões de avaliações ou
  integração de calendários seguem o planejamento da spec 008.
- Comunicação: Mensagens atende campanhas/comunicados aos associados; transporte real, preferências
  e canais ainda precisam de definição e validação. E-mail transacional e caixa de entrada são
  acompanhados separadamente; não presumir que a caixa de entrada seja um chat.
- Chat interno: conversas diretas/grupos, comentários nos registros e notificações configuráveis em
  uma entrega funcional, conforme a seção 9.10. É independente das campanhas e do futuro suporte
  externo por tickets.
- Portal do parceiro: funcionalidade prevista aguardando revisão, baseada no cadastro autoritativo
  de Parceiros. API pública de benefícios não comprova portal autenticado.
- CAASSH: suspenso, pendente de revisão de finalidade, regras e dependências; requisitos CRE são
  referências preservadas, sem construção ou ativação autorizadas.
- Recursos Humanos: sugestão em avaliação, sem escopo aprovado; não duplica Colaboradores.
- Tema Cores Legado: opção futura vermelho/branco, com CAAB preservado como padrão, claro/escuro e
  referência autorizada própria; não está implementado por existir como tema planejado.

Sincronizações externas, SMS/WhatsApp, aprovações adicionais e integrações com RH/ERP dependem de
contrato, responsável e autorização próprios. Os rótulos **MVP** nos requisitos identificam o núcleo
funcional; **Pós-MVP**, as evoluções. Nenhum rótulo é prova de implementação ou homologação.

## 8. Fluxos principais

### 8.1 Publicação de notícia

1. Usuário autorizado cria um rascunho.
2. Informa título, resumo, conteúdo, categoria, capa e canais.
3. Adiciona imagens, links e anexos permitidos. Vídeos/embeds dependem de provedores habilitados;
   não há provedor autorizado nesta revisão.
4. Visualiza a prévia para cada canal.
5. Salva para revisão ou publica, conforme sua permissão.
6. Na publicação imediata, o conteúdo passa a ser retornado pelas APIs públicas autorizadas.
7. Na publicação agendada, um job durável publica na data definida.
8. Alterações posteriores geram nova versão e registro de auditoria.

### 8.2 Agendamento

1. Operador com consulta identifica a pessoa beneficiária, inclusive dependente, e a oferta.
2. O sistema mostra unidade, serviço/procedimento, profissional quando aplicável e horários ou vagas
   por capacidade, respeitando funcionamento, duração, bloqueios e elegibilidade.
3. Operador com alteração solicita a reserva. O servidor revalida autoridade, sobreposição da
   pessoa, disponibilidade e capacidade dentro da transação.
4. A reserva entra em Agendado ou Aguardando aprovação, conforme a política; ambas ocupam vaga e
   impedem sobreposição. A aprovação revalida elegibilidade e disponibilidade, preservando o
   intervalo retido, a identidade e o histórico da reserva.
5. A interface apresenta o resultado e o histórico. Registro de intenção de aviso não significa
   envio de e-mail.

### 8.3 Remarcação, cancelamento e faltas

1. Operador autorizado consulta a reserva e escolhe a ação disponível no estado atual.
2. Cada agendamento permite duas trocas voluntárias confirmadas; uma troca em andamento reserva um
   uso no mesmo ciclo. A antecedência padrão é de 24 horas em relação ao horário original,
   configurável/desativável por serviço. Recuperação por indisponibilidade usa ciclo isento.
3. Novo horário passa novamente por capacidade, disponibilidade, autorização e sobreposição. Reserva
   a remarcar pode ficar sem horário/profissional; a origem e as transições continuam no histórico.
4. Cancelamento e remarcação não exigem justificativa genérica; dados operacionais são preservados.
5. A equipe pode registrar falta após o término previsto; o tempo sozinho não registra ausência.
   Sete dias para justificativa/contestação e 30 dias de restrição individual contam do registro da
   falta. O pedido exige texto e ao menos um comprovante privado, com decisão humana e permissão
   dedicada. A restrição não bloqueia familiares.
6. Durante prazo/análise tempestiva, reservas existentes são preservadas e novas ficam impedidas.
   Sem pedido ou com rejeição antes do término da restrição, a regra cancela apenas reservas
   agendadas/pendentes cujo início futuro esteja dentro do período. Aceitação remove somente essa
   restrição; expirar 30 dias não decide a análise nem reabre prazo.
7. Bloqueio cadastral posterior sinaliza reservas existentes para decisão manual; não as cancela
   automaticamente. Critérios e casos de borda permanecem no contrato da spec 008.

### 8.4 Cadastro e verificação de associado

1. Usuário autorizado cadastra dados mínimos e identificadores, com prevenção de duplicidade.
2. Quando pertinente, consulta OAB-BA/Implanta, relatório STATUS CAAB, pelo adaptador institucional
   implementado, avulso ou a partir do cadastro, usando configuração autorizada.
3. Indisponibilidade, ausência de cadastro e falha da consulta são resultados distintos. Conferência
   manual continua disponível; CNA/ConfirmADV não substituem automaticamente a fonte CAAB.
4. Registra fonte, data, operador e resultado sem inferir bloqueio interno, condição financeira ou
   credencial a partir de uma resposta externa isolada.
5. A homologação positiva no ambiente de destino e as regras institucionais pendentes seguem a spec
   005; existência do adaptador não comprova homologação.

### 8.5 Bloqueio de associado

1. Usuário autorizado solicita o bloqueio.
2. Sistema registra a alteração sem exigir justificativa; bloqueio administrativo persiste até
   desbloqueio manual, sem expiração automática.
3. Ação é confirmada no servidor.
4. Bloqueio passa a impedir apenas as ações definidas pela política da CAAB.
5. O registro permanece pesquisável e o evento entra na auditoria.

### 8.6 Conversas e comentários internos

1. Usuário interno ativo abre uma conversa direta, participa de um grupo por convite ou consulta os
   comentários de um registro autorizado.
2. Escreve texto, responde, menciona participantes autorizados ou adiciona referência a registro;
   anexos precisam ser liberados pela validação e pelo antivírus antes da publicação.
3. O servidor revalida acesso e salva uma única publicação, mesmo após nova tentativa do envio.
4. Participantes da conversa ou seguidores/mencionados autorizados do registro recebem avisos
   conforme canal, menções, módulos e silêncio configurados; o autor não recebe aviso próprio.
5. Histórico e pesquisa preservam o contexto autorizado, versões e indicação de edição/remoção;
   compartilhar referência não concede acesso ao registro.
6. Supervisão permite consulta e moderação auditadas por Administrador/Gestor; para enviar em grupo,
   o supervisor precisa participar, sem entrada silenciosa.

## 9. Requisitos funcionais

### 9.1 Notícias

| ID      | Requisito                                                                                                                                                                                                                 | Prioridade |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| NOT-001 | Criar, editar, duplicar e arquivar notícias.                                                                                                                                                                              | MVP        |
| NOT-002 | Manter rascunhos e histórico de versões.                                                                                                                                                                                  | MVP        |
| NOT-003 | Suportar texto rico, imagens, links e anexos permitidos; vídeos/embeds dependem de definição e habilitação de provedores, ainda pendentes.                                                                                | MVP        |
| NOT-004 | Definir capa, resumo, categoria, tags, autor e responsável pela publicação.                                                                                                                                               | MVP        |
| NOT-005 | Disponibilizar notícias publicadas ao aplicativo, site externo ou ambos por consulta à API do canal; não presumir push ou recebimento pelos consumidores.                                                                 | MVP        |
| NOT-006 | Agendar publicação e despublicação.                                                                                                                                                                                       | MVP        |
| NOT-007 | Exibir prévia antes da publicação.                                                                                                                                                                                        | MVP        |
| NOT-008 | Registrar tentativas e falhas das ações programadas por canal e permitir retry idempotente; disponibilidade na API não comprova recebimento externo.                                                                      | MVP        |
| NOT-009 | Exigir permissões distintas de consulta, alteração e publicação em Notícias (news:read, news:write, news:publish), sem segunda aprovação editorial obrigatória; decisão de 21/09 substitui a autorização por mera sessão. | MVP        |

### 9.2 Unidades, serviços e profissionais

| ID      | Requisito                                                  | Prioridade |
| ------- | ---------------------------------------------------------- | ---------- |
| CAD-001 | Criar e manter unidades com endereço, contatos e status.   | MVP        |
| CAD-002 | Criar e manter serviços, duração e regras de atendimento.  | MVP        |
| CAD-003 | Relacionar serviços às unidades em que são oferecidos.     | MVP        |
| CAD-004 | Criar e manter profissões.                                 | MVP        |
| CAD-005 | Criar e manter profissionais e suas profissões.            | MVP        |
| CAD-006 | Relacionar profissional a unidades e serviços habilitados. | MVP        |
| CAD-007 | Impedir novos agendamentos com registros inativos.         | MVP        |

### 9.3 Agenda e disponibilidade

| ID      | Requisito                                                                                                                                                                             | Prioridade |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| AGE-001 | Configurar jornada recorrente por profissional e unidade.                                                                                                                             | MVP        |
| AGE-002 | Configurar intervalos, bloqueios e indisponibilidades.                                                                                                                                | MVP        |
| AGE-003 | Calcular vagas pela duração do procedimento, retida na reserva, e reservar por profissional ou capacidade conforme a oferta.                                                          | MVP        |
| AGE-004 | Impedir sobreposição da mesma pessoa entre unidades/profissionais, além de conflito de profissional e excesso de capacidade; reservas agendadas e pendentes de aprovação ocupam vaga. | MVP        |
| AGE-005 | Criar, aprovar/rejeitar, cancelar, remarcar e recuperar reservas conforme estados e transições autorizados.                                                                           | MVP        |
| AGE-006 | Registrar autor, ação e mudanças de cancelamento/remarcação, sem exigir justificativa.                                                                                                | MVP        |
| AGE-007 | Visualizar agenda por dia, semana, mês, unidade e profissional.                                                                                                                       | MVP        |
| AGE-008 | Manter histórico das transições.                                                                                                                                                      | MVP        |
| AGE-009 | Integrar calendários externos.                                                                                                                                                        | Pós-MVP    |

Estados implementados da reserva: **Agendado**, **Aguardando aprovação**, **Cancelado**,
**Recusado** e **Aguardando nova data**. Recuperação é um tipo de processo, não um sexto estado.
Falta é uma ocorrência própria associada à reserva; não se deve substituir esse modelo pela antiga
lista genérica Em atendimento/Concluído/Não compareceu. Transições e autorização pertencem ao
[contrato administrativo](../specs/008-scheduling-management/contracts/admin.md).

| ID      | Requisito                                                                                                                                                                                                                 | Prioridade |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| AGE-010 | Separar consulta e alteração; alteração depende de consulta, com revalidação no servidor e efeitos das revogações.                                                                                                        | MVP        |
| AGE-011 | Aprovar/rejeitar reservas, revalidando elegibilidade e disponibilidade, com intervalo/duração retidos, controle de versão e ocupação da vaga.                                                                             | MVP        |
| AGE-012 | Separar remarcação voluntária sujeita a prazo/limite da recuperação isenta por indisponibilidade do serviço.                                                                                                              | MVP        |
| AGE-013 | Sinalizar reservas de pessoa bloqueada/excluída sem cancelamento automático e sem afetar familiares por inferência.                                                                                                       | MVP        |
| AGE-014 | Registrar falta após o término previsto; contar do registro sete dias para justificativa/contestação com texto/comprovante e 30 dias de restrição individual, preservando os critérios de decisão e cancelamento da spec. | MVP        |
| AGE-015 | Exigir revisão dedicada de faltas, proteger comprovantes desde o upload e preservar decisão, autoria e eventos automáticos idempotentes.                                                                                  | MVP        |
| AGE-016 | Entregar avisos operacionais de bloqueio, protocolo e decisão ao titular ou ao dependente e titular vigente, sem depender de preferências de campanhas; integração e homologação adiadas ao transporte real.              | Pós-MVP    |

Sobreposição por beneficiário, aprovação, remarcação, faltas e permissões já estão integradas.
Endurecimento adicional de autorização dos uploads após espera por lock está no PR #48; ajustes de
calendário, diálogo e foco estão no PR #50. Isso não altera as pendências de QA e ativação no
destino.

### 9.4 Associados

| ID      | Requisito                                                                                                                                                   | Prioridade |
| ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| ASS-001 | Criar, visualizar e atualizar associados.                                                                                                                   | MVP        |
| ASS-002 | Pesquisar por nome, documento autorizado, OAB e seccional.                                                                                                  | MVP        |
| ASS-003 | Ativar, bloquear e desbloquear sem motivo obrigatório, com auditoria.                                                                                       | MVP        |
| ASS-004 | Registrar situação, fonte e data da verificação da OAB.                                                                                                     | MVP        |
| ASS-005 | Manter histórico cadastral e de bloqueios.                                                                                                                  | MVP        |
| ASS-006 | Evitar duplicidade por identificadores definidos.                                                                                                           | MVP        |
| ASS-007 | Usar a integração institucional OAB-BA autorizada e manter conferência manual; homologar retorno positivo no destino antes de declarar a integração aceita. | MVP        |

O domínio também mantém dependentes e vínculos históricos, foto privada e documentos, análise
documental e situações cadastral/OAB/financeira/credencial separadas. Não há login externo
provisionado nem emissão de cartão/QR por essas capacidades. Solicitação de exclusão exige motivo
por ocorrência e programa exclusão lógica para sete dias depois, com possibilidade de
desfazer/restaurar e preservação de vínculos, reservas e histórico. Isso não é descarte definitivo
nem política de retenção.

Vínculos/documentos já definidos: titular apresenta carteira OAB; cônjuge, identidade e
casamento/união estável; filho, identidade e, se maior de idade, matrícula superior; enteado,
identidade e casamento/união estável, também matrícula superior se maior. Filhos/enteados têm limite
de até 25 anos. A aplicação da matriz está pendente em POL02; quais alterações exigem nova análise
continuam em definição em POL01, sem bloqueio etário ou reanálise automática inferidos. Fonte:
[decisões de Associados](../specs/005-members-management/open-decisions.md).

### 9.5 Parceiros

| ID      | Requisito                                                                 | Prioridade |
| ------- | ------------------------------------------------------------------------- | ---------- |
| PAR-001 | Cadastrar parceiro, contatos, categoria e status.                         | MVP        |
| PAR-002 | Cadastrar serviços, benefícios e condições oferecidas.                    | MVP        |
| PAR-003 | Relacionar parceiro a unidades e regiões atendidas.                       | MVP        |
| PAR-004 | Controlar vigência e documentos administrativos.                          | MVP        |
| PAR-005 | Publicar dados selecionados para canais externos por contrato autorizado. | MVP        |

Parceiros inclui categorias, unidades, contratos/vigências e benefícios, com rascunho/publicação e
seleção do catálogo do app independente da presença no site. A moderação de avaliações preserva
nota/opinião original. APIs públicas e cadastro administrativo não comprovam autenticação do
parceiro, portal, validação por QR ou coleta externa de avaliações.

### 9.6 Colaboradores

Colaboradores é a gestão atual de contas e permissões, nas rotas `/users`; não há cadastro separado
de RH. Um módulo futuro chamado **Recursos Humanos** permanece como possibilidade, pendente de
definição de finalidade, escopo e autorização de construção. Essa possibilidade não reativa os
requisitos antigos COL-001–COL-005 nem autoriza duplicar contas ou permissões.

COL-001–COL-005 foram retirados do escopo de RH em 11/09/2026; seus IDs ficam reservados como
histórico e não representam tarefas aprovadas ou concluídas.

Capacidades vigentes na [spec de Fundação](../specs/001-project-foundation/spec.md):

- Cadastro administrativo com nome, CPF válido/único, e-mail, telefone e endereço; CEP/complemento
  opcionais e consulta de CEP com recuperação manual. Cadastros antigos podem completar dados
  gradualmente.
- CPF permanece único inclusive após exclusão; restauração recupera a identidade anterior com
  confirmação, sem sobrescrever seu cadastro pelos dados de uma nova tentativa.
- Solicitação de exclusão exige motivo por ocorrência, bloqueia imediatamente a conta e conclui
  exclusão lógica após 24 horas; desfazer/restaurar preserva histórico e concessões válidas.
- Senha inicial/nova senha é apresentada uma vez, sem segredo em logs nem e-mail automático.
  Administrador/Gestor podem redefinir senha de terceiros conforme matriz; Gestor não redefine
  Administrador, e senha própria é tratada em Configurações.
- Atribuição de cargo e promoção são de Administrador, com troca atômica e histórico; delegação do
  Gestor e permissões individuais seguem o contrato, sem acesso automático de RH.
- Listas, filtros e exportações diretas respeitam consulta e autorização geral de exportação.

### 9.7 Usuários e permissões

| ID      | Requisito                                                                                                                                                                         | Prioridade |
| ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| SEG-001 | Autenticar usuários e permitir desativação imediata.                                                                                                                              | MVP        |
| SEG-002 | Aplicar autorização no servidor em todas as ações.                                                                                                                                | MVP        |
| SEG-003 | Permitir no máximo um cargo vigente por colaborador, com descrição das opções e acessos individuais preservados (decisão de 22/09/2026).                                          | MVP        |
| SEG-004 | MFA retirado em 10/09/2026 por reclamações; motivo registrado em 17/09/2026.                                                                                                      | Retirado   |
| SEG-005 | Testar automaticamente a matriz de permissões.                                                                                                                                    | MVP        |
| SEG-006 | Solicitar confirmação para ações destrutivas ou sensíveis.                                                                                                                        | MVP        |
| SEG-007 | Criar contas novas como Colaborador quando omitido o cargo e migrar contas existentes sem cargo preservando acessos individuais, conforme decisão de 05/10 e revisão de ativação. | MVP        |
| SEG-008 | Revalidar sessão e acessos em operações sensíveis após esperas por lock; troca de identidade deve limpar contextos privados, rascunhos e respostas pendentes.                     | MVP        |

### 9.8 Auditoria

| ID      | Requisito                                                                             | Prioridade |
| ------- | ------------------------------------------------------------------------------------- | ---------- |
| AUD-001 | Registrar ator, ação, entidade, registro e horário.                                   | MVP        |
| AUD-002 | Registrar valores anteriores e posteriores quando permitido.                          | MVP        |
| AUD-003 | Registrar origem e identificador da requisição.                                       | MVP        |
| AUD-004 | Impedir edição de eventos de auditoria pela aplicação.                                | MVP        |
| AUD-005 | Permitir busca por período, usuário, ação e entidade.                                 | MVP        |
| AUD-006 | Proteger segredos e dados excessivos contra gravação em logs.                         | MVP        |
| AUD-007 | Exportar logs somente para usuários autorizados.                                      | MVP        |
| AUD-008 | Reunir Eventos e Processamentos em Auditoria, sem segunda entrada Operações.          | MVP        |
| AUD-009 | Preservar permissões independentes de eventos, exportação, leitura de jobs e reenvio. | MVP        |
| AUD-010 | Apresentar histórico contextual usando a trilha de auditoria existente.               | MVP        |

### 9.9 Requisitos adicionais e seus limites

PES e AVA possuem partes implementadas e evoluções nas specs 005/007/008. COM descreve a finalidade
de campanhas, cuja entrega externa ainda não foi homologada. **CRE está suspenso; POR é previsto
aguardando revisão**, sem aceite de MVP atual. REL possui implementação integrada, com validações de
desempenho e humanas pendentes. As dependências abaixo não significam que toda decisão ou todo
código ainda esteja ausente; os contratos da função discriminam o restante.

| ID      | Requisito                                                                                                                                                                                       | Dependência institucional                                                      |
| ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| PES-001 | Cadastrar dependentes e vínculos, com histórico.                                                                                                                                                | Vínculos definidos na spec 005; aplicar condições sem automatismos presumidos. |
| PES-002 | Analisar documentação, registrar decisão e solicitar correções pontuais.                                                                                                                        | Matriz definida; implementar POL02 e definir gatilhos de reanálise em POL01.   |
| PES-003 | Separar aprovação cadastral, vínculo, regularidade OAB, situação financeira, credencial e restrições por finalidade.                                                                            | Matriz de consequências.                                                       |
| PES-004 | Exibir fonte/data das verificações; sem política, não decidir elegibilidade automaticamente.                                                                                                    | Fonte autorizada e política.                                                   |
| AVA-001 | Vincular avaliações a atendimento ou benefício e moderar sem exigir justificativa, preservando nota/opinião original e motivos históricos.                                                      | Acesso e critérios de moderação.                                               |
| COM-001 | Preparar públicos com critérios legíveis, prévia e exclusões.                                                                                                                                   | Preferências e política de envio.                                              |
| COM-002 | Preparar, revisar e programar solicitações de mensagens e modelos; execução permanece bloqueada sem canal disponível, sem simular envio.                                                        | Responsáveis, canais e contratos.                                              |
| COM-003 | Distinguir solicitação, aceitação pelo provedor, entrega, abertura, falha e ausência de confirmação.                                                                                            | Evidência suportada por canal.                                                 |
| COM-004 | Evitar envio duplicado e revalidar preferências/restrições ao executar.                                                                                                                         | Política de composição do público.                                             |
| CRE-001 | Configurar programa, unidade, conversão, limites, validade e responsáveis sem valores presumidos.                                                                                               | Regras aprovadas de Caassh.                                                    |
| CRE-002 | Conceder individualmente/em lote com prévia e idempotência, sem justificativa obrigatória.                                                                                                      | Autoridade e limites de concessão.                                             |
| CRE-003 | Derivar saldo do extrato e corrigir por lançamento referenciado, sem apagar a origem.                                                                                                           | Regras de utilização e correção.                                               |
| POR-001 | Restringir acesso do parceiro à sua organização, inclusive arquivos e exportações.                                                                                                              | Tarefas delegáveis.                                                            |
| POR-002 | Preparar e consultar solicitações avulsas ou por QR sem presumir liquidação bancária.                                                                                                           | Estados e responsáveis da operação.                                            |
| POR-003 | Reutilizar o cadastro do parceiro no portal e no administrativo.                                                                                                                                | Cadastro autoritativo único.                                                   |
| REL-001 | Gerar relatórios com finalidade, filtros, período e campos autorizados.                                                                                                                         | Público e uso esperado.                                                        |
| REL-002 | Exportar o conjunto completo autorizado em Excel/CSV/PDF nas três abas, com detalhe agrupado ou não, filtros, seleção/ordem de colunas, ordenação e contexto, sem tetos herdados de amostragem. | Revalidação das fontes e aceite de desempenho.                                 |

### 9.10 Chat interno e comentários operacionais

Disponibilizar chat interno e comentários operacionais com notificações configuráveis (CAAB-49) tem
plano definido em 07/10 e status Em Desenvolvimento, sem implementação comprovada. O
[plano 012](../specs/012-internal-chat/plan.md) integra esta consolidação documental; sua origem
está na [evidência desta revisão](history/prd-review-2026-10-07.md). Os requisitos abaixo preservam
os mesmos IDs e o escopo da frente de Chat interno.

| ID       | Requisito                                                                                                                                                                                                                    | Prioridade    |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- |
| CHAT-001 | Permitir uma conversa direta por par de usuários internos ativos e grupos por convite; contas externas ou desativadas não participam.                                                                                        | Entrega única |
| CHAT-002 | Permitir aos responsáveis nomear grupos, convidar/remover integrantes, transferir responsabilidade e arquivar/restaurar. Novos integrantes acessam o histórico completo, com aviso na inclusão; saída/remoção revoga acesso. | Entrega única |
| CHAT-003 | Oferecer texto, respostas na sequência principal, menções individuais, referências a registros e anexos em conversas e comentários.                                                                                          | Entrega única |
| CHAT-004 | Oferecer busca por texto, pessoa, conversa, período e módulo, filtros de não lidas/menções e histórico paginado, sempre com autorização atual.                                                                               | Entrega única |
| CHAT-005 | Permitir supervisão e moderação de todas as conversas por Administrador/Gestor, com aviso claro e auditoria de acesso, versões e downloads; distinguir participação de supervisão.                                           | Entrega única |
| CHAT-006 | Oferecer comentários internos em associado, parceiro, unidade de parceiro, unidade de atendimento, reserva/agendamento e notícia, inclusive rascunho autorizado; quem consulta pode comentar sem adquirir edição.            | Entrega única |
| CHAT-007 | Permitir seguir/deixar de seguir comentários; publicar inicia acompanhamento e menção não inscreve automaticamente. Comentários permanecem separados das avaliações e não alteram estados de negócio.                        | Entrega única |
| CHAT-008 | Revalidar acesso ao abrir referências, sem conceder acesso ou copiar automaticamente dados pessoais. Quem não tem acesso vê somente a indicação de registro indisponível.                                                    | Entrega única |
| CHAT-009 | Permitir edição e remoção lógica pelo autor sem prazo artificial; preservar versões para autor/supervisão. Supervisores podem ocultar/restaurar conteúdo de terceiros, sem reescrevê-lo.                                     | Entrega única |
| CHAT-010 | Permitir até três anexos PDF/JPG/JPEG/PNG de até 25 MiB cada, com checksum, quarentena e antivírus; revalidar autorização ao fornecer os bytes, inclusive após remoção ou revogação.                                         | Entrega única |
| CHAT-011 | Configurar painel, navegador e e-mail independentemente, com todas as mensagens ou apenas menções, seleção de módulos e herança/personalização/silêncio por conversa ou discussão.                                           | Entrega única |
| CHAT-012 | Combinar filtros de menções e módulos; silêncio/canal desativado prevalece. Módulo deriva de registro, referência ou assunto explicitamente escolhido, sem classificação por palavras.                                       | Entrega única |
| CHAT-013 | Avisar somente participantes ou seguidores/mencionados autorizados, nunca o próprio autor ou apenas por supervisão. Revalidar destinatários, acesso e preferências ao executar os avisos.                                    | Entrega única |
| CHAT-014 | Manter não lidas mesmo com avisos desativados; leitura depende da exibição efetiva. Atualizar sem duplicação após reconexão e preservar rascunhos em memória por identidade/contexto, limpando-os na troca de conta.         | Entrega única |
| CHAT-015 | Agrupar e-mails de eventos não lidos por usuário em janela de um minuto, com processamento durável e deduplicação; avisos externos contêm texto genérico e link autenticado, sem conteúdo pessoal.                           | Entrega única |

Padrões iniciais: painel ativado para todas as mensagens e módulos; navegador e e-mail desativados
até escolha do usuário; conversas e discussões herdam as preferências gerais. Mensagem sem módulo
explícito não passa por filtro restrito a módulos. Edição não redistribui avisos gerais; uma nova
menção pode avisar o destinatário uma única vez por publicação.

Notificações do navegador exigem ativação explícita e funcionam com o painel aberto, inclusive em
segundo plano quando o navegador permitir. E-mail reutiliza o transporte SMTP existente e depende de
Serviço de e-mail transacional e definição da caixa de entrada (CAAB-2), com recebimento controlado
comprovado para aceitar a entrega completa. Indisponibilidade do canal é informada sem comprometer o
salvamento da mensagem; aceitação SMTP não comprova entrega, e resultado incerto não provoca reenvio
automático cego.

Grupo arquivado ou registro arquivado/excluído logicamente mantém o histórico autorizado e bloqueia
novas publicações; inatividade simples de registro não bloqueia colaboração. Remoção/ocultação de
conteúdo impede downloads comuns, preservando o acesso de supervisão ao histórico. Comentários nunca
aparecem no app, site, portal ou APIs públicas. Descarte automático permanece desligado, sem
presumir prazo institucional de retenção.

Sem chamadas, áudio/vídeo, canais públicos, suporte externo, integrações com mensageiros, IA,
exportação de conversas ou Web Push com painel fechado nesta entrega. Antes de iniciar código,
completar spec, contratos e tarefas próprios; o plano e este PRD não comprovam esses artefatos.

### 9.11 Exportações e histórico individual

| ID      | Requisito                                                                                                                                                                                       | Situação                                                                                                               |
| ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| EXP-001 | Oferecer Excel, CSV e PDF por download direto nas superfícies aplicáveis, com filtros, seleção/ordem de colunas, autorização e todos os resultados, sem teto funcional de registros ou período. | Núcleo compartilhado, Colaboradores, Agendamentos e Relatórios integrados; demais módulos migram por tarefas próprias. |
| EXP-002 | Revalidar leitura do módulo/fontes e exports:generate durante a transferência; arquivos legados preservam autorização de dono e domínio.                                                        | Contratos transversais e dos módulos; não presumir migração integral.                                                  |
| HIN-001 | Reunir o histórico individual de atendimentos e demais eventos autorizados, preservando pessoa beneficiária, operador e sequência após remarcação/cancelamento.                                 | Planejado no programa 002; consolidação visual ainda não implementada.                                                 |
| HIN-002 | Mostrar eventos do dependente no histórico dele, mesmo quando o titular opera a reserva; restringir cada parte ao domínio autorizado.                                                           | Planejado; não atribuir eventos automaticamente à família inteira.                                                     |

Padrão: [EXPORT-STANDARD.md](EXPORT-STANDARD.md). O resultado da Consulta OAB, avulsa ou pelo
cadastro, é excluído por decisão própria; o plano de Chat interno também exclui exportação de
conversas. Downloads de arquivos antigos não são removidos por esta migração. Compras só entram no
histórico individual após existir domínio e contratos próprios; não há módulo de compras
implementado por essa previsão.

### 9.12 Conta, Mensagens e Relatórios

**Conta e Configurações:** perfil pessoal, preferências de tema, senha própria, sessões e rascunhos
em memória por identidade/contexto. Recuperação usa link de uso único; troca de e-mail requer
confirmação. Senha inicial de colaborador é exibida no fluxo administrativo e não é envio
automático. Transporte SMTP existente não comprova recebimento real; aceite de conta/e-mail segue a
[spec 006](../specs/006-account-settings/spec.md).

**Mensagens:** públicos com filtros combináveis, inclusão/exclusão explícita, prévia e contagem sem
teto funcional de destinatários; campanhas, modelos, programação, reagendamento/cancelamento e
histórico. Consulta exige messages:access e alteração messages:write. A execução de solicitações
fica bloqueada sem canal; não mostrar Enviada/Entregue sem evidência. Finalidade é
campanha/comunicado aos associados; a revisão M016/T003 e os canais de
[Mensagens](../specs/009-messaging/spec.md) continuam pendentes.

**Relatórios:** Resumo gerencial, Análise detalhada e Resultados e evolução consultam registros dos
próprios domínios, com filtros, comparação de períodos, agrupamentos, colunas, consultas pessoais
salvas e apresentação. As três abas exportam o conjunto completo autorizado; paginação da tela não
limita o arquivo. O PDF executivo preserva análise da gestão e gráfico mensal; Excel/CSV permanecem
tabulares. Contexto, comentário e rascunhos não atravessam identidades.

Métricas explicitam definição, período, base e atualização: reserva não comprova atendimento, acesso
ao painel não mede produtividade, eventos não equivalem a pessoas únicas entre canais. App e site
têm contratos de coleta, sem consumidores instrumentados/homologados comprovados; canal sem eventos
mostra Sem dados. A [spec 010](../specs/010-reports-analytics/spec.md) governa fontes, privacidade e
limites de interpretação.

## 10. Modelo conceitual de dados

### 10.1 Conteúdo

- **Notícia:** título, slug, resumo, conteúdo estruturado, capa, categoria, tags, autor, publicador,
  status, canais, publicação e expiração.
- **Mídia:** tipo, localização, nome original, nome seguro, MIME detectado, tamanho, dimensões,
  checksum, estado de verificação e texto alternativo.
- **Versão da notícia:** notícia, conteúdo completo, autor da mudança, data e estado editorial.
- **Ação por canal:** notícia, canal, versão, programação, execução, tentativas e falhas;
  disponibilidade pública é distinta de confirmação de recebimento externo.

### 10.2 Agenda

- **Unidade:** identificação, endereço, contatos, timezone e status.
- **Serviço e procedimento:** oferta, procedimentos/durações, publicação, capacidade e políticas de
  aprovação, antecedência, remarcação e horizonte.
- **Profissão:** nome, registro profissional aplicável e status.
- **Profissional:** identificação, profissão, situação e dados administrativos permitidos.
- **Oferta de serviço:** unidade, serviço, profissão e regras específicas.
- **Vínculo profissional:** profissional, unidade, serviços habilitados e vigência.
- **Disponibilidade:** profissional, unidade, regra semanal e validade.
- **Bloqueio de agenda:** profissional/unidade, início, fim e origem; preservar motivo histórico,
  sem exigir nova justificativa.
- **Agendamento:** pessoa beneficiária, unidade, serviço/procedimento, profissional e horário quando
  aplicáveis, capacidade, duração retida, estado, ciclo de remarcação e observações.
- **Falta e pedido de revisão:** ocorrência individual, prazo, justificativa/contestação,
  comprovantes privados, decisão e restrição associada, separados do estado da reserva.
- **Evento do agendamento:** status anterior, novo status, ator e data; motivo histórico opcional.

### 10.3 Cadastros

- **Associado:** identificadores, contatos mínimos, OAB, seccional e situação interna.
- **Verificação OAB:** associado, fonte, método, situação retornada, responsável e data.
- **Bloqueio do associado:** tipo, início, fim, responsável e situação; motivo histórico opcional.
- **Parceiro:** dados institucionais, categoria, contatos, vigência e status.
- **Serviço parceiro:** parceiro, descrição, condições, abrangência e status.
- **Colaborador/Usuário:** a mesma conta de acesso, com identidade de autenticação, cargo único,
  permissões e status; a interface usa Colaboradores.
- **Recursos Humanos:** possibilidade futura, sem entidade ou campos aprovados nesta revisão.
- **Evento de auditoria:** registro imutável da ação e seu contexto.

### 10.4 Convenções

- Identificadores UUID.
- Datas persistidas em UTC e exibidas em `America/Bahia`.
- Exclusão lógica para entidades auditáveis.
- Valores sensíveis criptografados quando necessário.
- Arquivos e metadados no PostgreSQL, conforme a decisão vigente de armazenamento; sem fallback
  S3/MinIO.
- Estados controlados por enums ou máquinas de estado explícitas.

### 10.5 Colaboração interna

- **Conversa:** direta ou grupo, nome quando aplicável, responsáveis e estado de arquivamento.
- **Participação:** vínculo do usuário à conversa, responsabilidade e eventos de entrada/saída.
- **Discussão de registro:** vínculo íntegro a um dos seis tipos de registro autorizados, criado no
  primeiro comentário.
- **Publicação e versão:** mensagem/comentário, contexto, autor, texto, resposta, menções, datas e
  estados de edição/remoção/moderação; versões preservam o conteúdo anterior protegido.
- **Referência e anexo:** registro compartilhado ou arquivo validado, vinculados à publicação e
  sujeitos à autorização vigente de leitura.
- **Acompanhamento e leitura:** seguidores dos comentários e posição de leitura por
  usuário/contexto.
- **Preferência de aviso:** canais, modo todas/menções, módulos, herança e silêncio por
  usuário/contexto.
- **Evento de notificação:** publicação, destinatário, canal, agrupamento, estado e tentativas,
  separado da confirmação de persistência da publicação.

## 11. Telas necessárias

### 11.1 Autenticação

- Login.
- Recuperação de acesso.
- E-mail/senha e permissões concretas; segundo fator retirado em 10/09/2026.
- Sessões ativas e encerramento remoto para administradores.

### 11.2 Dashboard

- Notícias em rascunho, agendadas e com falha.
- Agendamentos do dia, cancelamentos e não comparecimentos.
- Profissionais indisponíveis.
- Associados aguardando verificação.
- Pendências de parceiros.
- Atividades recentes autorizadas.

### 11.3 Notícias

- Lista com busca, filtros e status.
- Editor rico.
- Biblioteca de mídia.
- Prévia por canal.
- Agendamento de publicação.
- Histórico de versões e distribuição.

### 11.4 Agenda

- Calendário diário, semanal e mensal.
- Filtros por unidade, serviço e profissional.
- Criação rápida.
- Detalhe, histórico, remarcação e cancelamento.
- Configuração de disponibilidade, capacidade, publicação e políticas; filas de aprovação,
  recuperação e faltas com revisão dedicada.

### 11.5 Associados

- Lista e detalhe.
- Cadastro e edição.
- Verificação OAB.
- Bloqueio e desbloqueio.
- Histórico.

### 11.6 Parceiros e colaboradores

- Listas pesquisáveis.
- Formulários por permissão.
- Vigências, status e histórico.

### 11.7 Auditoria

- Filtros avançados.
- Visualização do antes e depois.
- Identificação de ação, ator e origem.
- Exportação controlada.

### 11.8 Chat interno e comentários

- Entrada Chat interno imediatamente antes de Mensagens, com lista, pesquisa, histórico e
  compositor; navegação em etapas entre lista e conversa em telas estreitas.
- Minhas conversas e Supervisão em áreas distintas, com informação explícita sobre supervisão.
- Criação de conversa/grupo e gestão de participantes, responsáveis e arquivamento.
- Atalho no cabeçalho com não lidas e menções; preferências em Configurações e no contexto.
- Comentários internos no detalhe de cada registro contemplado, com contador e ação de seguir.
- Estados de envio, anexo em verificação, indisponibilidade, revogação e reconexão, sem perda
  silenciosa do texto. Novas mensagens não deslocam quem consulta o histórico; Enter quebra linha e
  Ctrl/Cmd+Enter envia, com instrução visível.

### 11.9 Mensagens e Relatórios

- Mensagens: públicos/filtros/prévia, campanhas/modelos, solicitações programadas e histórico, com
  estado bloqueado explícito quando não houver canal.
- Relatórios: Resumo gerencial, Análise detalhada e Resultados e evolução, com filtros, comparações,
  grupos, consultas salvas, apresentação e exportação configurável.

## 12. Requisitos de experiência

Padrões visuais, componentes e revisão obrigatória: [caab-design.md](caab-design.md). Esta seção
registra objetivos de experiência; medidas e instruções visuais pertencem ao guia.

- Interface pt-BR.
- Uso administrativo em desktop com responsividade em tablet e celular, nos dois temas; revisão nas
  larguras e critérios do guia.
- Navegação lateral recolhível e busca global.
- Ações frequentes disponíveis com poucos cliques.
- Tabelas densas, legíveis e com filtros persistentes.
- Feedback explícito de carregamento, sucesso e erro.
- Contraste, foco e navegação por teclado compatíveis com WCAG 2.2 AA.
- Ícones Lucide React com rótulo textual ou nome acessível.
- Nunca depender apenas de cor ou ícone para comunicar estado.
- Design tokens próprios da CAAB; evitar aparência de template genérico.

## 13. Segurança e privacidade

Solicitar exclusão de Colaborador ou Associado exige motivo não vazio, com autor/data por
ocorrência, inclusive após desfazer/restaurar. Demais ações dispensam justificativa humana; campos
operacionais e motivos históricos são preservados. Fonte: princípio V da
[constituição](../.specify/memory/constitution.md) e contratos das funções.

- OWASP ASVS nível 2 como baseline verificável.
- Autorização server-side e menor privilégio.
- MFA retirado em 10/09/2026 por reclamações, conforme motivo confirmado pelo usuário em 17/09/2026;
  manter senha, sessões, autorização e auditoria.
- Proteção contra CSRF, XSS, injeção, IDOR e força bruta.
- Sanitização do conteúdo rico no armazenamento e/ou renderização.
- Lista permitida de provedores e formatos para embeds.
- Upload validado por extensão, MIME real, assinatura, tamanho e antivírus.
- Nomes de arquivo gerados pelo sistema.
- URLs assinadas e temporárias para arquivos privados, com os limites documentados por função.
  Comprovantes de faltas já emitidos possuem janela bearer de até 300 segundos; isso não equivale a
  revogação imediata de todo link. Chat/comentários têm requisito futuro mais estrito: revalidar
  sessão e acesso ao servir bytes, inclusive após remoção do grupo ou ocultação.
- Segredos fora do código e rotação documentada.
- Criptografia em trânsito e proteção adequada em repouso.
- Política de retenção, anonimização e descarte a aprovar institucionalmente; não inventar prazos
  nem ativar descarte automático.
- Logs sem senhas, tokens, documentos completos ou dados pessoais desnecessários.

## 14. Requisitos não funcionais

### 14.1 Desempenho

- Telas comuns devem responder em até 2 segundos no percentil 95, descontadas integrações externas.
- Buscas e filtros devem usar paginação server-side.
- Jobs demorados devem usar processamento durável quando aplicável. Exportações diretas usam
  transferência progressiva e recursos limitados; não exigir arquivo integral em memória nem
  redirecionar obrigatoriamente para uma central de jobs.
- Chat interno planeja atualização em até cinco segundos com aba visível/rede normal, verificada em
  cenário sintético de 100 sessões concorrentes; não é desempenho medido do produto atual.
- Relatórios ainda deve comprovar C1/T038: tempo/primeiro byte, memória, CPU, conexões e efeito
  sobre leituras simultâneas do painel. Metas e testes existentes não substituem essa medição.

### 14.2 Disponibilidade e recuperação

- Backups diários do banco e política para arquivos.
- Backups fora do servidor principal.
- Teste periódico de restauração.
- Health checks para aplicação, banco, storage e worker.

### 14.3 Observabilidade

- Logs estruturados com identificador de requisição.
- Métricas de erros, latência, filas e falhas de integração.
- Alertas para indisponibilidade, falha de backup e jobs esgotados.

### 14.4 Compatibilidade

- Suporte às duas versões estáveis mais recentes de Chrome, Edge, Firefox e Safari.
- APIs externas versionadas e compatíveis durante migrações planejadas.

## 15. Indicadores de sucesso

- Tempo médio para publicar uma notícia.
- Percentual de publicações disponíveis por canal sem falha; recebimento externo só é medido quando
  houver evidência própria.
- Taxa de conflitos de agenda impedidos.
- Percentual de agendamentos concluídos, cancelados e não comparecidos.
- Tempo médio para registrar/verificar associado.
- Percentual de ações críticas com auditoria completa.
- Erros de autorização detectados em produção.
- Adoção diária do sistema por função.

## 16. Plano de entrega

### Fundação existente — reaproveitar

- Autenticação, usuários, funções e permissões.
- Design system e layout administrativo.
- Banco, auditoria, storage, worker e observabilidade.

### Evolução do núcleo e entregas delimitadas

O [programa integrado](../specs/002-integrated-modules/plan.md) organiza dependências. A base atual
inclui fundação, cadastros, Auditoria, Notícias, Agendamentos administrativo e Relatórios. Mensagens
continua em protótipo. Exportações próprias dos módulos ainda não migrados e os aceites de acessos,
Agendamentos e Relatórios seguem suas tarefas existentes.

Chat interno tem **uma entrega funcional**, com conversas, comentários nos seis tipos de registro,
anexos, pesquisa, supervisão e canais de aviso. Dados, autorização, interface e testes são etapas
internas; não declarar a entrega completa sem e-mail recebido em destinatário controlado e
homologação humana identificada. O transporte depende de Serviço de e-mail transacional e definição
da caixa de entrada (CAAB-2), sem incorporar a caixa de entrada ao chat.

Em 07/10, a frente responsável organizou seis subtarefas de contratos/dados, conversas, comentários,
anexos, avisos e interface sob o ticket principal. São frentes de planejamento da mesma entrega, com
dependências e arquivos compartilhados coordenados; **implementação permanece não iniciada por
determinação do usuário registrada no ticket**. A divisão não autoriza código nem conclusão parcial
da função. A evidência relaciona os seis tickets e a dependência de e-mail.

Portal, CAASSH, RH e demais candidatos preservam os estados da seção 7.2. Não são parte
automaticamente autorizada do núcleo atual. Cada funcionalidade nova precisa de spec, plano,
contratos e tarefas antes do código; melhorias atualizam os artefatos existentes. Pesquisa e
decisões ficam nas fontes da função. Branches, PRs, validações e integração seguem o
[fluxo de entrega](DELIVERY-WORKFLOW.md) e o [AGENTS](../AGENTS.md); este PRD não muda autorizações.

## 17. Critérios de aceite por entrega

### 17.1 Núcleo administrativo e incrementos integrados

Código integrado e tickets históricos concluídos não dispensam os critérios abaixo. Cada aceite deve
identificar versão, ambiente, evidência e pessoa responsável pela homologação.

- Usuários acessam apenas módulos e ações autorizados.
- Uma notícia pode ser criada, revisada, agendada, publicada e restaurada.
- Imagens e anexos passam pelas validações de segurança; vídeo/embeds só podem ser aceitos quando
  seus provedores e controles forem definidos e habilitados.
- App e site conseguem consumir somente notícias publicadas destinadas a eles.
- O sistema mostra apenas horários realmente disponíveis.
- Reservas concorrentes não excedem capacidade nem sobrepõem profissional ou pessoa beneficiária,
  inclusive pendentes de aprovação.
- Agendamentos mantêm histórico de remarcações e cancelamentos.
- Associados podem ser cadastrados, verificados, bloqueados e desbloqueados com histórico.
- Parceiros e colaboradores podem ser administrados por usuários autorizados.
- Dependentes, correções documentais e situações de elegibilidade seguem regras definidas e têm
  histórico.
- Avaliações preservam opinião original; relatórios usam dados/filtros/escopos dos domínios.
- Auditoria reúne Eventos e Processamentos sem ampliar permissões nem duplicar entradas.
- Toda ação crítica aparece na auditoria.
- Lint, typecheck, testes e build passam no CI.

### 17.2 Entregas ainda planejadas ou com transporte pendente

- Mensagens precisa comprovar aderência do protótipo à finalidade confirmada de campanhas,
  públicos/preferências e estados com evidência real do canal; o protótipo não é envio homologado.
- Chat interno deve cumprir CHAT-001–CHAT-015 e os cenários do plano: seis tipos de comentários,
  acesso/revogação, supervisão informada, anexos/versões, notificações, recebimento controlado,
  reconexão, múltiplas contas, carga e acessibilidade. Aceite único, sem transformar planejamento em
  entrega parcial concluída.
- E-mails operacionais de Agendamentos dependem do transporte real e de sua homologação; sua
  ausência não bloqueia o aceite independente do recorte administrativo.
- Se Portal for retomado, deverá comprovar isolamento por organização, arquivos e solicitações.
  CAASSH depende primeiro da revisão do programa; CRE não é gate atual do núcleo administrativo.

## 18. Riscos e mitigação

| Risco                                  | Mitigação                                                                                                              |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| API atual do app/site desconhecida     | Solicitar documentação formal ou definir contrato novo; não investigar código/telas do legado.                         |
| Integração oficial da OAB indisponível | Fluxo manual rastreável; não usar scraping.                                                                            |
| Regras de agenda incompletas           | Definir política com atendimento/coordenação antes das operações dependentes, sem bloquear a consolidação da fundação. |
| Dados pessoais excessivos              | Inventário LGPD e minimização por campo.                                                                               |
| Upload malicioso                       | Validação em camadas, storage isolado e antivírus.                                                                     |
| Permissões se tornarem inconsistentes  | Matriz central e testes automatizados de autorização.                                                                  |
| Dependência excessiva do CMS           | Limitar Payload ao conteúdo e cadastros adequados; regras críticas ficam no domínio.                                   |
| Cal.com duplicar a fonte de verdade    | Referência de pesquisa; integrar somente se nenhuma outra possibilidade for encontrada (15/09/2026).                   |

## 19. Definições e validações ainda necessárias

| Assunto                         | Decisão ou evidência atual                                                      | Restante                                                                                             |
| ------------------------------- | ------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Cargos e contas sem cargo       | Três cargos, cargo único e regra de Colaborador decididos e implementados.      | Matriz/QA humano; conferir CB06 antes de aplicar migration no banco de uso.                          |
| Publicação de Notícias          | Consulta, escrita e publicação têm permissões distintas, sem segunda aprovação. | Revalidação de autorização na execução assíncrona; aceite dos consumidores.                          |
| Oferta e faltas de Agendamentos | Regras administrativas constam da spec 008 e estão integradas.                  | QA, revisão de destino, reservas legadas e correções específicas dos PRs #48/#50.                    |
| E-mail e caixa de entrada       | E-mail transacional necessário; caixa de entrada confirmada como futura.        | Entrega real, usuários/canais/ações da caixa de entrada; não inventar provedor.                      |
| Consulta OAB                    | Adaptador OAB-BA/Implanta e STATUS CAAB existentes.                             | Credenciais/configuração autorizadas e homologação positiva no destino.                              |
| Documentação de dependentes     | Vínculos e parte dos documentos definidos na spec 005.                          | Implementar matriz documental em POL02; definir em POL01 quais alterações exigem nova análise.       |
| Carteirinha digital             | Situação/validade cadastral não equivalem à emissão da carteirinha.             | Formato, emissor, validação, segurança, revogação e contrato do app.                                 |
| Relatórios                      | Todos os modos de exportação integrados.                                        | C1/T038 e QA identificados, sem usar o checkbox histórico de T049 como defeito vigente.              |
| Chat interno                    | Plano de entrega única e regras descritos no ticket e plano 012.                | Completar artefatos próprios, conciliar cargos/design, implementar e validar.                        |
| App/site e portal               | Contratos do servidor não comprovam a interface externa.                        | Jornadas, identidade, elegibilidade, contratos e implantação autorizados.                            |
| Retenção e produção             | Requisitos de proteção, backup e restauração existentes.                        | Política institucional, responsáveis e evidência do ambiente/restore; descarte automático desligado. |

O estado operacional de tickets, dependências e PRs pode mudar após esta data. Conflitos entre
status nativo e descrições históricas estão registrados na evidência, sem alterar os tickets nesta
revisão.

## 20. Decisões técnicas e rastreabilidade

- O trabalho inicial limita-se ao sistema interno.
- TypeScript é a linguagem do projeto novo, sem condicionamento à implementação do legado.
- Lucide React é a biblioteca padrão de ícones.
- Payload CMS e Lexical são usados em Notícias; versões vigentes pertencem aos manifests/lockfile.
- PostgreSQL é a fonte de verdade dos domínios operacionais e dos arquivos.
- Agendamentos usa domínio próprio e FullCalendar como interface; Cal.com continua apenas
  referência, com integração condicionada ao esgotamento das alternativas (15/09/2026).
- Consulta institucional OAB-BA implementada, com fallback manual e homologação de destino pendente;
  sem scraping ou substituição automática por outra fonte.
- O sistema usa monólito modular com worker e fila compartilhada.

### Rastreabilidade de reaproveitamento — decisão de 10/09/2026

Sempre que uma integração, configuração, regra, recurso visual ou trecho do sistema antigo for
reaproveitado por solicitação autorizada, registrar origem, adaptações, validação e pontos que podem
precisar de mudanças em [LEGACY-REUSE.md](LEGACY-REUSE.md), vinculando a spec correspondente.
Segredos e dados pessoais não entram na documentação. A pesquisa e validação da integração OAB-BA,
explicitamente solicitadas pelo usuário, estão registradas em LEG-001; as regras institucionais
antigas de ativo/inativo e finanças não foram adotadas implicitamente.

### Colaboradores, Usuários e Parceiros: decisão de escopo

Confirmado pelo usuário em 11/09/2026: Colaboradores no sistema antigo corresponde à atual gestão de
Usuários. Parceiros representa externos, como estabelecimentos e conveniados. Não há módulo separado
de equipe interna/RH no escopo atual.

Decisão de 17/09/2026: Colaboradores é a gestão atual de contas e permissões, nas rotas `/users`;
não há cadastro separado de RH. Um módulo futuro chamado **Recursos Humanos** permanece como
possibilidade, pendente de definição de finalidade, escopo e autorização de construção. Essa
possibilidade não reativa os requisitos antigos COL-001–COL-005 nem autoriza duplicar contas ou
permissões.

A interpretação anterior de Colaboradores como cadastro de setor, cargo e situação funcional foi
descartada. COL-001–COL-005 e T032–T035 do programa 002, como definidos para RH, foram retirados do
escopo; não são tarefas implementadas.

A interface adota **Colaboradores** na mesma gestão de contas, rotas `/users`, identificadores e
permissões existentes. Menu, catálogo, busca, cabeçalho, página, ações e mensagens usam o nome
Colaboradores. A busca também reconhece o termo Usuários. Não há novo cadastro, API ou migration
para essa renomeação.

Esta decisão substitui as propostas anteriores de cadastro funcional separado no programa 002 e no
PRD. Dependências de US6 usam a gestão de contas/RBAC existente.
