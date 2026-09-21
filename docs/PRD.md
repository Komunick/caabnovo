# CAAB — Sistema Interno de Gestão

**Estado de implementação — 21/09/2026:** este PRD reúne produto e expansões,
não comprova entrega de todas as funções listadas. O [inventário atual](MODULES.md)
e a [revisão de código](../specs/002-integrated-modules/code-audit-2026-09-21.md)
distinguem código, decisões ainda não implementadas, homologação e suspensões.
MFA e justificativas obrigatórias foram retirados; Mensagens é protótipo de
campanhas/comunicados; CAASSH está desativado, RH é possibilidade futura e
Colaboradores significa contas/permissões. Exportações seguem [padrão vigente](EXPORT-STANDARD.md),
ainda pendente no código. Retenção e critérios institucionais seguem adiados.

## Estado consolidado — 21/09/2026

**Decisão vigente — 21/09/2026:** Mensagens destina-se a comunicados e campanhas aos associados, com seleção de público e programação. A finalidade foi confirmada; o protótipo ainda precisa da revisão de aderência e continuidade M016 e não está homologado. Meios, provedores e envio real permanecem adiados. Chat interno e suporte por tickets são possibilidades futuras separadas.

Colaboradores é a gestão atual de contas e permissões, nas rotas `/users`; não há cadastro separado de RH. Um módulo futuro chamado **Recursos Humanos** permanece como possibilidade, pendente de definição de finalidade, escopo e autorização de construção. Essa possibilidade não reativa os requisitos antigos COL-001–COL-005 nem autoriza duplicar contas ou permissões.

Agendamentos já possui uma primeira versão administrativa implementada; app/site e expansões continuam pendentes. As seções históricas não reabrem autorizações nem substituem este estado.

## Agendamentos — implementação da etapa 1 em 15/09/2026

A primeira versão do painel foi implementada na entrega histórica feature/scheduling-management-20260915 e está integrada:
oferta, horários semanais/almoço, reservas futuras, consulta, remarcação, cancelamento
e histórico. O código ainda aceita toda sessão ativa, lacuna de autorização A01.
A decisão vigente exige concessões separadas de consulta e alteração; a adequação está pendente.
Validação e limites na [spec 008](../specs/008-scheduling-management/spec.md) e nas
[evidências](../specs/008-scheduling-management/evidence/release-review.md).
Esta atualização substitui o estado anterior de “somente pesquisa” para esse recorte.
Exceções, avaliações e demais estados permanecem posteriores. O calendário administrativo
foi priorizado em 18/09 e CAL01–CAL05 estão implementadas, com CAL06 pendente de validação
final. A interface do usuário no app/site continua posterior; CAASSH permanece desativado.

## 1. Controle do documento

**Produto:** CAAB — Sistema Interno de Gestão

**Tipo:** Product Requirements Document (PRD)

**Versão:** 0.3

**Status:** Escopo consolidado; Mensagens em protótipo com finalidade confirmada e aderência pendente; Recursos Humanos como possibilidade futura

**Data:** 21/09/2026 (revisão de código e decisões; versão inicial de 09/09/2026)

**Escopo desta versão:** todos os módulos do painel e portal do parceiro

**Prioridade atualizada em 15/09/2026:** após concluir e validar a primeira versão
funcional de Agendamentos no painel, o próximo passo será a primeira versão da
interface do usuário no app/site, antes das demais expansões e módulos pendentes.
Essa etapa terá spec, plano, tarefas e critérios próprios, reutilizando os dados e
serviços do painel. A exclusão de refazer app/site na seção 5 limita a entrega
administrativa inicial; não exclui essa próxima etapa confirmada do produto.
Ver [sequência vigente](../specs/002-integrated-modules/plan.md).

O aplicativo e o site externo participam do desenho dos contratos de conteúdo, benefícios, cadastro,
credencial, agenda e mensagens. Alterações nesses consumidores, contratação de serviços e migração
de dados exigem escopo próprio. A implementação desta entrega concentra-se no novo painel e portal.

O [mapa de módulos](MODULES.md) compara capacidades existentes e novas e define responsabilidades
para evitar duplicatas. Todos os módulos integram o mesmo escopo; a sequência interna de construção
respeita dependências. O [plano integrado](../specs/002-integrated-modules/plan.md) substitui a
proposta anterior de entregar somente Notícias primeiro. Refinamentos posteriores não dispensam
persistência, autorização, acessibilidade ou integridade na primeira versão funcional.

O laudo de 09/09/2026 é inventário funcional, não modelo visual ou técnico. Não consultar código,
telas, capturas ou vídeos do painel antigo ou de refações anteriores. Contratos devem ser novos ou
formalmente fornecidos; regras institucionais não podem ser inferidas do legado ou do mercado.

## 2. Resumo executivo

A CAAB precisa modernizar seu sistema interno e consolidar, em uma única plataforma segura, a gestão
de notícias, agendamentos, associados, serviços parceiros, colaboradores e logs de alterações.

O sistema deve reduzir cadastros duplicados, operações manuais, conflitos de agenda e alterações sem
rastreabilidade. A experiência deve ser moderna, rápida, acessível e adequada ao trabalho
administrativo diário.

A solução será construída como um monólito modular: uma aplicação única, com módulos de domínio
claramente separados. Notícias poderão ser distribuídas ao aplicativo, ao site externo ou a ambos
por contratos de API versionados.

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

- Reescrita integral do aplicativo móvel sem recorte; primeira interface autorizada para planejamento em UI01/UI02.
- Reescrita integral do site externo sem recorte; primeira interface autorizada para planejamento em UI01/UI02.
- Implantar prontuário médico ou sistema clínico completo.
- Substituir folha de pagamento ou sistema de recursos humanos.
- Automatizar consulta à OAB por scraping ou contornar CAPTCHA.
- Criar uma plataforma genérica de reservas para terceiros.
- Criar microserviços para cada módulo.
- Adicionar integrações sem contrato, documentação ou autorização formal.

## 6. Usuários e funções

**Decisão vigente de21/09/2026:** os cargos iniciais são Administrador, Gestor e Colaborador. Administrador tem todas as permissões concretas dos módulos disponíveis, atuais e futuros, incluindo exportação e gestão de cargos/acessos. Gestor possui consulta a todos os módulos, exportação geral e acesso completo a Relatórios; pode conceder acessos de qualquer módulo a outros colaboradores, inclusive alterações que não possui para uso próprio, mas não altera os próprios acessos nem atribui cargos. Colaborador somente usa os acessos recebidos e não concede cargos ou permissões. Atribuição de cargos permanece com Administrador. As categorias profissionais abaixo são descrições de atuação/propostas anteriores, não cargos adicionais a criar nesta entrega. Contrato vigente: [cargos](../specs/001-project-foundation/contracts/roles.md).

### 6.1 Administrador

Gerencia usuários, permissões, configurações, cadastros e auditoria. Pode executar ações sensíveis
mediante autorização e confirmação aplicável, sem justificativa obrigatória.

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

Colaboradores é a gestão atual de contas e permissões, nas rotas `/users`; não há cadastro separado de RH. Um módulo futuro chamado **Recursos Humanos** permanece como possibilidade, pendente de definição de finalidade, escopo e autorização de construção. Essa possibilidade não reativa os requisitos antigos COL-001–COL-005 nem autoriza duplicar contas ou permissões.

### 6.8 Auditor

Possui acesso somente leitura aos logs, históricos, versões e relatórios autorizados.

As funções podem ser acumuladas. O sistema deve conceder permissões concretas, e não acesso amplo
apenas pelo nome do cargo.

## 7. Escopo funcional

### 7.1 MVP

- Autenticação e autorização.
- Dashboard por função.
- Gestão de notícias e mídia.
- Publicação imediata ou agendada por canal.
- Cadastros de unidades, serviços, profissões e profissionais.
- Disponibilidade e bloqueios de agenda.
- Criação, remarcação e cancelamento de agendamentos.
- Gestão de associados e registro de verificação da OAB.
- Bloqueio e desbloqueio de associados sem justificativa obrigatória, com auditoria.
- Gestão de parceiros e serviços parceiros.
- Gestão de contas e permissões, apresentada como Colaboradores.
- Logs de alterações e histórico dos registros críticos.
- Pesquisa, filtros, paginação e exportação autorizada.

### 7.2 Integrações previstas no planejamento completo

- Sincronização de agendas externas.
- Lembretes por e-mail, SMS ou WhatsApp.
- Integração oficial automatizada com a OAB, se disponibilizada ou contratada.
- Fluxos de aprovação com múltiplos níveis.
- Relatórios analíticos avançados.
- Alterações no aplicativo e no site externo.
- Integração com sistemas de RH, ERP ou atendimento.

A presença no planejamento não autoriza contratar serviços ou alterar consumidores externos.
Integrações reais dependem de contrato e responsável. Os módulos adicionais abaixo fazem parte da
entrega integrada, inclusive os anteriormente ausentes ou adiados:

- Pessoas: dependentes, análise documental, correções, credencial e elegibilidade por finalidade.
- Agendamentos: avaliações e acompanhamento de qualidade, além de oferta e agenda.
- Benefícios: condições, contratos, ofertas e avaliações de parceiros.
- Comunicação: notícias/destaques, públicos, campanhas e modelos automáticos com acompanhamento.
- Créditos: Caassh, configuração do programa, concessões individuais/em lote, extrato e correções.
- Portal do parceiro: acesso por organização, solicitações avulsas ou identificadas por QR.
- Equipe e acesso: Colaboradores é a gestão das contas e permissões existentes, sem cadastro de RH separado.
- Auditoria: Eventos e Processamentos reunidos, preservando autorizações independentes.
- Relatórios: consultas e exportações dos mesmos registros dos domínios.

Os rótulos MVP dos requisitos abaixo representam a primeira versão funcional desta entrega. Pós-MVP
nos itens de integração indica dependência de contrato externo, não exclusão do planejamento.

## 8. Fluxos principais

### 8.1 Publicação de notícia

1. Usuário autorizado cria um rascunho.
2. Informa título, resumo, conteúdo, categoria, capa e canais.
3. Adiciona imagens, vídeo, links ou anexos permitidos.
4. Visualiza a prévia para cada canal.
5. Salva para revisão ou publica, conforme sua permissão.
6. Na publicação imediata, o conteúdo passa a ser retornado pelas APIs públicas autorizadas.
7. Na publicação agendada, um job durável publica na data definida.
8. Alterações posteriores geram nova versão e registro de auditoria.

### 8.2 Agendamento

1. Usuário identifica o beneficiário e procura o serviço necessário.
2. Sistema permite filtrar unidade, data e profissional e comparar as próximas vagas permitidas.
3. Sistema apresenta a oferta e explica restrições ou indisponibilidade.
4. Sistema identifica os profissionais e recursos habilitados para a oferta.
5. Sistema considera jornada, intervalos, bloqueios, afastamentos, duração do serviço e compromissos
   existentes.
6. Usuário escolhe um horário disponível.
7. Servidor revalida a disponibilidade dentro de uma transação.
8. Agendamento é confirmado e registrado no histórico.

### 8.3 Remarcação e cancelamento

1. Usuário abre o agendamento.
2. Informa a ação e o motivo.
3. Para remarcação, o novo horário passa por todas as validações de disponibilidade.
4. O registro anterior é preservado no histórico.
5. O sistema registra responsável, horário e origem da alteração.

### 8.4 Cadastro e verificação de associado

1. Usuário cadastra os dados mínimos necessários.
2. Informa número da OAB e seccional.
3. Sistema procura uma integração oficial configurada.
4. Sem integração oficial, o usuário realiza consulta manual no Cadastro Nacional da OAB.
5. Registra fonte, data, responsável, situação encontrada e observação.
6. O associado recebe situação cadastral interna independente do resultado da verificação.

### 8.5 Bloqueio de associado

1. Usuário autorizado solicita o bloqueio.
2. Sistema registra a alteração e, quando aplicável, data de término, sem exigir justificativa.
3. Ação é confirmada no servidor.
4. Bloqueio passa a impedir apenas as ações definidas pela política da CAAB.
5. O registro permanece pesquisável e o evento entra na auditoria.

## 9. Requisitos funcionais

### 9.1 Notícias

| ID      | Requisito                                                                                                                                               | Prioridade |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| NOT-001 | Criar, editar, duplicar e arquivar notícias.                                                                                                            | MVP        |
| NOT-002 | Manter rascunhos e histórico de versões.                                                                                                                | MVP        |
| NOT-003 | Suportar texto rico, imagens, vídeos, links e anexos permitidos.                                                                                        | MVP        |
| NOT-004 | Definir capa, resumo, categoria, tags, autor e responsável pela publicação.                                                                             | MVP        |
| NOT-005 | Publicar no aplicativo, site externo ou ambos.                                                                                                          | MVP        |
| NOT-006 | Agendar publicação e despublicação.                                                                                                                     | MVP        |
| NOT-007 | Exibir prévia antes da publicação.                                                                                                                      | MVP        |
| NOT-008 | Registrar falhas de distribuição e permitir nova tentativa idempotente.                                                                                 | MVP        |
| NOT-009 | Permitir publicação direta a quem já tem acesso autorizado ao painel, sem permissão adicional de Notícias ou segunda aprovação (decisão de 09/09/2026). | MVP        |

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

| ID      | Requisito                                                       | Prioridade |
| ------- | --------------------------------------------------------------- | ---------- |
| AGE-001 | Configurar jornada recorrente por profissional e unidade.       | MVP        |
| AGE-002 | Configurar intervalos, bloqueios e indisponibilidades.          | MVP        |
| AGE-003 | Calcular horários usando a duração do serviço.                  | MVP        |
| AGE-004 | Impedir sobreposição de agendamentos confirmados.               | MVP        |
| AGE-005 | Criar, confirmar, concluir, cancelar e remarcar agendamentos.   | MVP        |
| AGE-006 | Registrar autor, ação e mudanças de cancelamento/remarcação, sem exigir justificativa.                  | MVP        |
| AGE-007 | Visualizar agenda por dia, semana, mês, unidade e profissional. | MVP        |
| AGE-008 | Manter histórico das transições.                                | MVP        |
| AGE-009 | Integrar calendários externos.                                  | Pós-MVP    |

Status padrão: `Pendente`, `Confirmado`, `Em atendimento`, `Concluído`, `Não compareceu` e
`Cancelado`.

Transições não previstas devem ser recusadas pelo servidor. Um agendamento cancelado ou concluído é
terminal no desenho de expansão; correções administrativas exigem autorização e auditoria, sem justificativa obrigatória. A versão atual usa Agendado/Cancelado; os demais estados dependem da spec 008.

### 9.4 Associados

| ID      | Requisito                                                       | Prioridade |
| ------- | --------------------------------------------------------------- | ---------- |
| ASS-001 | Criar, visualizar e atualizar associados.                       | MVP        |
| ASS-002 | Pesquisar por nome, documento autorizado, OAB e seccional.      | MVP        |
| ASS-003 | Ativar, bloquear e desbloquear sem motivo obrigatório, com auditoria.               | MVP        |
| ASS-004 | Registrar situação, fonte e data da verificação da OAB.         | MVP        |
| ASS-005 | Manter histórico cadastral e de bloqueios.                      | MVP        |
| ASS-006 | Evitar duplicidade por identificadores definidos.               | MVP        |
| ASS-007 | Automatizar consulta somente por integração oficial autorizada. | Pós-MVP    |

### 9.5 Parceiros

| ID      | Requisito                                                                 | Prioridade |
| ------- | ------------------------------------------------------------------------- | ---------- |
| PAR-001 | Cadastrar parceiro, contatos, categoria e status.                         | MVP        |
| PAR-002 | Cadastrar serviços, benefícios e condições oferecidas.                    | MVP        |
| PAR-003 | Relacionar parceiro a unidades e regiões atendidas.                       | MVP        |
| PAR-004 | Controlar vigência e documentos administrativos.                          | MVP        |
| PAR-005 | Publicar dados selecionados para canais externos por contrato autorizado. | MVP        |

### 9.6 Colaboradores

Colaboradores é a gestão atual de contas e permissões, nas rotas `/users`; não há cadastro separado de RH. Um módulo futuro chamado **Recursos Humanos** permanece como possibilidade, pendente de definição de finalidade, escopo e autorização de construção. Essa possibilidade não reativa os requisitos antigos COL-001–COL-005 nem autoriza duplicar contas ou permissões.

COL-001–COL-005 foram retirados do escopo de RH em 11/09/2026; seus IDs
ficam reservados como histórico e não representam tarefas aprovadas ou concluídas.

### 9.7 Usuários e permissões

| ID      | Requisito                                                  | Prioridade |
| ------- | ---------------------------------------------------------- | ---------- |
| SEG-001 | Autenticar usuários e permitir desativação imediata.       | MVP        |
| SEG-002 | Aplicar autorização no servidor em todas as ações.         | MVP        |
| SEG-003 | Permitir múltiplas funções por usuário.                    | MVP        |
| SEG-004 | MFA retirado em 10/09/2026 por reclamações; motivo registrado em 17/09/2026. | Retirado |
| SEG-005 | Testar automaticamente a matriz de permissões.             | MVP        |
| SEG-006 | Solicitar confirmação para ações destrutivas ou sensíveis. | MVP        |

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

### 9.9 Requisitos adicionais da entrega integrada

| ID      | Requisito                                                                                                            | Dependência institucional                  |
| ------- | -------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| PES-001 | Cadastrar dependentes e vínculos, com histórico.                                                                     | Tipos de vínculo aceitos.                  |
| PES-002 | Analisar documentação, registrar decisão e solicitar correções pontuais.                                             | Campos, documentos mínimos e responsáveis. |
| PES-003 | Separar aprovação cadastral, vínculo, regularidade OAB, situação financeira, credencial e restrições por finalidade. | Matriz de consequências.                   |
| PES-004 | Exibir fonte/data das verificações; sem política, não decidir elegibilidade automaticamente.                         | Fonte autorizada e política.               |
| AVA-001 | Vincular avaliações a atendimento ou benefício e moderar com motivo, preservando nota/opinião original.              | Acesso e critérios de moderação.           |
| COM-001 | Preparar públicos com critérios legíveis, prévia e exclusões.                                                        | Preferências e política de envio.          |
| COM-002 | Preparar, revisar, enviar/programar mensagens e manter modelos transacionais.                                        | Responsáveis, canais e contratos.          |
| COM-003 | Distinguir solicitação, aceitação pelo provedor, entrega, abertura, falha e ausência de confirmação.                 | Evidência suportada por canal.             |
| COM-004 | Evitar envio duplicado e revalidar preferências/restrições ao executar.                                              | Política de composição do público.         |
| CRE-001 | Configurar programa, unidade, conversão, limites, validade e responsáveis sem valores presumidos.                    | Regras aprovadas de Caassh.                |
| CRE-002 | Conceder individualmente/em lote com prévia e idempotência, sem justificativa obrigatória.                                           | Autoridade e limites de concessão.         |
| CRE-003 | Derivar saldo do extrato e corrigir por lançamento referenciado, sem apagar a origem.                                | Regras de utilização e correção.           |
| POR-001 | Restringir acesso do parceiro à sua organização, inclusive arquivos e exportações.                                   | Tarefas delegáveis.                        |
| POR-002 | Preparar e consultar solicitações avulsas ou por QR sem presumir liquidação bancária.                                | Estados e responsáveis da operação.        |
| POR-003 | Reutilizar o cadastro do parceiro no portal e no administrativo.                                                     | Cadastro autoritativo único.               |
| REL-001 | Gerar relatórios com finalidade, filtros, período e campos autorizados.                                              | Público e uso esperado.                    |
| REL-002 | Oferecer Excel/CSV/PDF com download direto, filtros e seleção/ordem de colunas autorizadas.                 | Retenção e formato.                        |

## 10. Modelo conceitual de dados

### 10.1 Conteúdo

- **Notícia:** título, slug, resumo, conteúdo estruturado, capa, categoria, tags, autor, publicador,
  status, canais, publicação e expiração.
- **Mídia:** tipo, localização, nome original, nome seguro, MIME detectado, tamanho, dimensões,
  checksum, estado de verificação e texto alternativo.
- **Versão da notícia:** notícia, conteúdo completo, autor da mudança, data e estado editorial.
- **Distribuição:** notícia, canal, versão, status, tentativas, última resposta e data.

### 10.2 Agenda

- **Unidade:** identificação, endereço, contatos, timezone e status.
- **Serviço:** nome, descrição, duração, antecedência, tolerância e status.
- **Profissão:** nome, registro profissional aplicável e status.
- **Profissional:** identificação, profissão, situação e dados administrativos permitidos.
- **Oferta de serviço:** unidade, serviço, profissão e regras específicas.
- **Vínculo profissional:** profissional, unidade, serviços habilitados e vigência.
- **Disponibilidade:** profissional, unidade, regra semanal e validade.
- **Bloqueio de agenda:** profissional/unidade, início, fim, motivo e origem.
- **Agendamento:** associado, unidade, serviço, profissional, início, fim, status e observações.
- **Evento do agendamento:** status anterior, novo status, ator, data e motivo.

### 10.3 Cadastros

- **Associado:** identificadores, contatos mínimos, OAB, seccional e situação interna.
- **Verificação OAB:** associado, fonte, método, situação retornada, responsável e data.
- **Bloqueio do associado:** tipo, motivo, início, fim, responsável e situação.
- **Parceiro:** dados institucionais, categoria, contatos, vigência e status.
- **Serviço parceiro:** parceiro, descrição, condições, abrangência e status.
- **Colaborador/Usuário:** a mesma conta de acesso, com identidade de autenticação, funções, permissões e status; a interface usa Colaboradores.
- **Recursos Humanos:** possibilidade futura, sem entidade ou campos aprovados nesta revisão.
- **Evento de auditoria:** registro imutável da ação e seu contexto.

### 10.4 Convenções

- Identificadores UUID.
- Datas persistidas em UTC e exibidas em `America/Bahia`.
- Exclusão lógica para entidades auditáveis.
- Valores sensíveis criptografados quando necessário.
- Arquivos e metadados no PostgreSQL, conforme a decisão vigente de armazenamento; sem fallback S3/MinIO.
- Estados controlados por enums ou máquinas de estado explícitas.

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
- Configuração de disponibilidade e bloqueios.

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

## 12. Requisitos de experiência

- Interface pt-BR.
- Design desktop-first, responsivo para tablets.
- Navegação lateral recolhível e busca global.
- Ações frequentes disponíveis com poucos cliques.
- Tabelas densas, legíveis e com filtros persistentes.
- Feedback explícito de carregamento, sucesso e erro.
- Contraste, foco e navegação por teclado compatíveis com WCAG 2.2 AA.
- Ícones Lucide React com rótulo textual ou nome acessível.
- Nunca depender apenas de cor ou ícone para comunicar estado.
- Design tokens próprios da CAAB; evitar aparência de template genérico.

## 13. Segurança e privacidade

- OWASP ASVS nível 2 como baseline verificável.
- Autorização server-side e menor privilégio.
- MFA retirado em 10/09/2026 por reclamações, conforme motivo confirmado pelo usuário em 17/09/2026; manter senha, sessões, autorização e auditoria.
- Proteção contra CSRF, XSS, injeção, IDOR e força bruta.
- Sanitização do conteúdo rico no armazenamento e/ou renderização.
- Lista permitida de provedores e formatos para embeds.
- Upload validado por extensão, MIME real, assinatura, tamanho e antivírus.
- Nomes de arquivo gerados pelo sistema.
- URLs assinadas para arquivos privados.
- Segredos fora do código e rotação documentada.
- Criptografia em trânsito e proteção adequada em repouso.
- Política de retenção, anonimização e descarte compatível com LGPD.
- Logs sem senhas, tokens, documentos completos ou dados pessoais desnecessários.

## 14. Requisitos não funcionais

### 14.1 Desempenho

- Telas comuns devem responder em até 2 segundos no percentil 95, descontadas integrações externas.
- Buscas e filtros devem usar paginação server-side.
- Operações demoradas devem ir para filas e informar progresso.

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
- Percentual de publicações distribuídas sem erro.
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

### Entrega integrada — todos os módulos

O [planejamento geral](../specs/002-integrated-modules/plan.md) inclui Conteúdo, Pessoas,
Agendamentos, Benefícios, Equipe, Comunicação, Créditos, Portal e Relatórios. Começar pela
consolidação da fundação em [Auditoria e Processamentos](../specs/003-audit-operations/spec.md),
seguida das dependências internas.

Cada funcionalidade nova terá seu próprio spec, plano e tarefas antes de implementar. Correções,
melhorias e mudanças atualizam os artefatos da função existente, sem criar outro spec. A pesquisa de
mercado atual fundamenta cada implementação e evolução e fica registrada no respectivo research.md.
PRs separados acompanham as funcionalidades/specs concluídos e validados, conforme orientação de
09/09/2026. O escopo continua integrado; documentação e testes acompanham a implementação da função.

## 17. Critérios de aceite do MVP

- Usuários acessam apenas módulos e ações autorizados.
- Uma notícia pode ser criada, revisada, agendada, publicada e restaurada.
- Imagens, vídeos e anexos passam pelas validações de segurança.
- App e site conseguem consumir somente notícias publicadas destinadas a eles.
- O sistema mostra apenas horários realmente disponíveis.
- Dois usuários concorrentes não conseguem reservar o mesmo profissional e horário.
- Agendamentos mantêm histórico de remarcações e cancelamentos.
- Associados podem ser cadastrados, verificados, bloqueados e desbloqueados com histórico.
- Parceiros e colaboradores podem ser administrados por usuários autorizados.
- Dependentes, correções documentais e situações de elegibilidade seguem regras definidas e têm
  histórico.
- Caassh mantém concessão/lote/correção sem saldo duplicado, sob política explícita.
- Mensagens respeitam público/preferências e apresentam estados conforme evidência do canal.
- Portal impede acesso entre parceiros, inclusive em solicitações, arquivos e exportações.
- Avaliações preservam opinião original; relatórios usam dados/filtros/escopos dos domínios.
- Auditoria reúne Eventos e Processamentos sem ampliar permissões nem duplicar entradas.
- Toda ação crítica aparece na auditoria.
- Lint, typecheck, testes e build passam no CI.

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
| Cal.com duplicar a fonte de verdade    | Referência de pesquisa; integrar somente se nenhuma outra possibilidade for encontrada (15/09/2026).                  |

## 19. Entradas necessárias antes da construção

| #   | Informação                                                                           | Fonte                     | Bloqueia                         |
| --- | ------------------------------------------------------------------------------------ | ------------------------- | -------------------------------- |
| 1   | Necessidades atuais e decisões do projeto novo, sem consultar código/telas do legado | Responsáveis pelo produto | Especificação do domínio         |
| 2   | Contratos novos ou documentação vigente formalmente fornecida de app/site            | Tecnologia                | Integração real com consumidores |
| 3   | Perfis reais e matriz de permissões                                                  | Gestores                  | Fundação                         |
| 4   | Acesso editorial confirmado: pessoas autorizadas ao painel publicam diretamente      | Usuário, 09/09/2026       | Resolvido; ver spec 004          |
| 5   | Formatos, limites e provedores de vídeo permitidos                                   | Comunicação/TI            | Notícias                         |
| 6   | Lista de unidades, serviços, durações e regras                                       | Operação                  | Agenda                           |
| 7   | Jornada, bloqueios e vínculo dos profissionais                                       | Operação                  | Agenda                           |
| 8   | Políticas de cancelamento, atraso e não comparecimento                               | Operação                  | Agenda                           |
| 9   | Campos mínimos e regras de bloqueio de associados                                    | Cadastro/Jurídico         | Associados                       |
| 10  | Canal oficial para integração com CNA/OAB                                            | OAB/TI/Jurídico           | Automação OAB                    |
| 11  | Política de retenção e classificação de dados                                        | Jurídico/DPO              | Produção                         |
| 12  | Infraestrutura e requisitos de disponibilidade                                       | TI                        | Produção                         |

## 20. Decisões iniciais

- O trabalho inicial limita-se ao sistema interno.
- TypeScript é a linguagem do projeto novo, sem condicionamento à implementação do legado.
- Lucide React será a biblioteca padrão de ícones.
- Payload CMS e Lexical são a escolha inicial para notícias.
- PostgreSQL será a fonte de verdade dos domínios operacionais.
- Agendamentos: avaliar domínio próprio; Cal.com é referência, com integração somente se nenhuma outra possibilidade for encontrada (15/09/2026).
- Consulta à OAB será manual até existir integração oficial autorizada.
- O sistema será um monólito modular com worker, não um conjunto prematuro de microserviços.

### Rastreabilidade de reaproveitamento — decisão de 10/09/2026

Sempre que uma integração, configuração, regra, recurso visual ou trecho do sistema antigo
for reaproveitado por solicitação autorizada, registrar origem, adaptações, validação e pontos
que podem precisar de mudanças em [LEGACY-REUSE.md](LEGACY-REUSE.md), vinculando a spec
correspondente. Segredos e dados pessoais não entram na documentação. A pesquisa e validação
da integração OAB-BA, explicitamente solicitadas pelo usuário, estão registradas em LEG-001;
as regras institucionais antigas de ativo/inativo e finanças não foram adotadas implicitamente.

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

## Estado vigente — Agendamentos e CAASSH, consolidado em 21/09/2026

**Atualização de Agendamentos em 21/09/2026:** a CAAB gerencia no painel o serviço
de reservas. Consulta e alteração exigem concessões separadas; alteração depende de
consulta. O acesso indiscriminado por sessão persiste no código e precisa ser corrigido
(A01), inclusive em Relatórios (A02). Escopo confirmado:
unidades com um ou mais serviços, profissionais, procedimentos, funcionamento e
consulta/gestão de avaliações. Autenticação e auditoria permanecem; outros módulos
mantêm suas permissões. Ações específicas de avaliações e regras operacionais ainda
em brainstorming. Cal.com somente como referência, salvo se nenhuma alternativa for encontrada.

A primeira versão administrativa de **Agendamentos** está implementada (US1/US2 da [spec 008](../specs/008-scheduling-management/spec.md)): oferta, horários, criação, consulta, remarcação, cancelamento e histórico. A interface do usuário no app/site e as expansões restantes continuam pendentes. O brainstorming anterior é histórico e não significa que o painel atual esteja apenas em pesquisa.

**CAASSH: desativado — pendente de revisão.** As propostas de créditos abaixo/acima
são referências históricas, sem ativação ou implementação autorizada no ciclo atual.
A revisão deverá confirmar finalidade, escopo e eventuais dependências antes da retomada.
