# Feature Specification: Associados e dependentes

## Checkpoint documental — requisitos de documentos, 21/09/2026

Usuário definiu documentos de titular/cônjuge/filho/enteado e limite de até 25 anos para filhos e
enteados. Matriz vigente em [open-decisions.md](open-decisions.md). P01 está parcialmente resolvida:
pergunta 4 sobre nova análise continua pendente. Planejamento/implementação da matriz em POL02;
POL01 preserva a pergunta aberta. Somente documentação nesta rodada, sem código, migration,
aplicação retroativa, testes de aplicação ou alteração do CI. Próximo passo: detalhar a aplicação da
matriz e validar os cenários quando sua implementação for retomada.

## Checkpoint da entrega ativa — 21/09/2026

Incremento de ciclo de vida implementado e validado no CI35644236348 (57d6b56), com dados
sintéticos. Evidências e limites no
[relatório da entrega](../001-project-foundation/evidence/plan-2026-09-21-validation.md). Clarify e
analyze concluídos somente nas alterações do recorte; sem achados relevantes. Requisitos históricos
sem relação com o diff e exportações próprias ainda planejadas ficam fora. Checkpoints anteriores
são históricos. Localhost desligado; banco local preservado.

## Checkpoint de revisão de código — 21/09/2026

Cadastro, foto, dependentes, análise manual, situação e adaptador OAB implementados. Bloqueio
próprio/por titular já impede novas reservas; falta indicação na agenda/detalhes e regressão AE04.
T028 continua homologação/configuração adiada; POL01 e P02/P03/P04/D02 são decisões
institucionais/externas pendentes. Exportação própria DX01 ausente.

Revisão estática da base `ed31baf`; nenhum teste de aplicação ou homologação nesta etapa. Evidências
e limites: [revisão transversal](../002-integrated-modules/code-audit-2026-09-21.md).

## Coordenação com Agendamentos — 15/09/2026

Bloqueio, desbloqueio, ativação, arquivo/restauração e mudanças de vínculos usam o mesmo lock
transacional das confirmações de reservas (spec 008). A confirmação relê bloqueio próprio e de
titulares vigentes após obter o lock. Isso não altera permissões ou regras de Associados. A busca da
agenda expõe somente nome, ano de nascimento e OAB; documentos, CPF, contato e finanças continuam
protegidos.

**Feature Branch**: `feature/members-management` **Created**: 2026-09-09 **Status**: Pronto conforme
confirmação do usuário em 11/09/2026; preparação do PR autorizada. **Input**: Implementar
Associados; outra instância implementará Caassh.

## Clarifications

### Session 2026-09-20

- Q: O que acontece com reservas futuras existentes quando o associado é bloqueado, incluindo
  dependentes afetados? → A: Manter e sinalizar para decisão manual da equipe; não cancelar
  automaticamente. Regra de agenda detalhada na spec 008, FR-017/SC-007.

### Session 2026-09-21

- Q: As regras de quem pode ser dependente e quais documentos são obrigatórios também ficam para
  definição posterior? → A: Sim (A); definir posteriormente e manter o cadastro e a análise manual
  atuais. Não presumir critérios institucionais, obrigatoriedade documental ou aprovação automática.

Checkpoint histórico de Q11: o adiamento integral foi substituído pelas respostas posteriores
abaixo; nenhuma implementação decorre desse registro.

### Complemento da sessão de 21/09/2026 — documentos

- Q: Quais documentos são exigidos para titular? → A: Carteira da OAB.
- Q: Quais documentos são exigidos para dependentes? → A: Cônjuge: identidade e comprovante de
  casamento ou união estável. Filho menor: identidade; maior: identidade e matrícula em instituição
  de ensino superior. Enteado: identidade e comprovante de casamento ou união estável; maior também
  apresenta matrícula em instituição de ensino superior. Filhos e enteados têm limite de até 25
  anos.
- Q: Quais vínculos são aceitos e comprovados? → A: Respondido na matriz de cônjuge, filho e enteado
  acima.
- Q: Quais alterações exigem nova análise? → A: Sem resposta por enquanto.

## User Scenarios & Testing

### User Story 1 — Cadastro único e vínculos (P1)

O operador encontra, cria, corrige e arquiva cadastros de associados e dependentes, sem criar contas
de acesso ou copiar pessoas para Créditos. **Why this priority**: fornece a identidade de
beneficiário para os demais módulos. **Independent Test**: cadastrar titular, vincular dependente já
existente, encerrar vínculo e consultar histórico. **Acceptance Scenarios**:

1. CPF informado é validado e único, inclusive entre arquivados; nome/email iguais não unem pessoas
   automaticamente.
2. Edições concorrentes preservam a alteração vencedora e avisam quem precisa recarregar.
3. Dependente referencia outro cadastro existente; vínculo consigo mesmo e ciclos são recusados.
   Encerramento preserva histórico.
4. Arquivar mantém identificador e referências; restaurar não cria outro cadastro.

### User Story 2 — Documentos e fila de análise (P1)

Operador registra os documentos solicitados, anexa arquivos privados e decide aceitar ou pedir
correção, sem campo de motivo. **Why this priority**: reduzir pedidos repetidos e permitir análise
atribuível. **Independent Test**: anexar documento liberado, pedir correção, anexar substituição e
consultar o anterior. **Acceptance Scenarios**:

1. Somente arquivo privado, liberado pelo antivírus e pertencente à pessoa pode ser associado ou
   baixado.
2. Cada substituição é uma nova evidência; revisão preserva autor, data, resultado e versões
   anteriores, inclusive motivos históricos existentes.
3. Filtro de cadastro pendente permite encontrar a próxima pessoa para analisar.

### User Story 3 — Situações explicáveis (P1)

Operador registra separadamente análise cadastral, vínculo institucional, verificação OAB, situação
financeira, credencial e elegibilidade. **Why this priority**: impedir decisões automáticas baseadas
em conceitos diferentes. **Independent Test**: aprovar cadastro, registrar consulta OAB manual e
verificar que finanças/elegibilidade não mudaram. **Acceptance Scenarios**:

1. Toda decisão registra responsável, instante e fonte/referência, sem exigir motivo; desconhecido
   não significa aprovado.
2. A avaliação OAB pode ser registrada manualmente; a consulta integrada OAB-BA é acionada pelo
   operador e mostra fonte, horário e regularidade, sem alterar automaticamente qualquer avaliação
   ou automatizar o portal nacional.
3. Validade da credencial e de avaliações é exibida como vencida quando o prazo termina, sem apagar
   a decisão.
4. Alteração de identificação sinaliza decisões anteriores para revisão, sem apagar documentos nem
   bloquear dependentes automaticamente.
5. Elegibilidade exige decisão explícita e referência à regra aplicada; aprovação cadastral não
   concede créditos.

### User Story 4 — Consulta pelos demais módulos (P2)

Caassh e futuros consumidores consultam a mesma pessoa pelo identificador estável, sem replicar
cadastro. **Why this priority**: permite implementação paralela e futura integração mobile.
**Independent Test**: consultar resumo de beneficiário e confirmar ausência de documentos, CPF e
observações internas. **Acceptance Scenarios**:

1. Consulta para seleção de beneficiário retorna identificador, nome, arquivamento e situações; não
   presume autorização para crédito.
2. Cadastro não cria login nem concede acesso ao painel. Mobile não recebe listagem pública de
   pessoas.
3. Acesso administrativo exige sessão ativa e concessão explícita: consulta, edição ou análise.
   Consulta é pré-requisito das demais ações; arquivos também exigem sua permissão existente.
   Anonimato, sessão revogada e usuário sem concessão são recusados.

### Edge Cases

CPF inválido/duplicado, inscrição OAB duplicada, dependência circular, vínculo encerrado, cadastro
arquivado, arquivo de outra pessoa/em quarentena, documento substituído, datas futuras inválidas,
decisão vencida, versão obsoleta, sessão revogada, comando repetido e falha na auditoria.

## Requirements

### Functional Requirements

- **FR-001**: Manter nome, nome social opcional, CPF opcional validado, nascimento opcional, contato
  e inscrição OAB opcional com UF e tipo; pesquisar por nome/CPF/número OAB e filtrar por estado da
  OAB, análise cadastral e arquivamento, preservando filtros na paginação e sem expor CPF em
  listagens. Usar “Estado da OAB” e “Todos os estados” na interface. Selecionar um filtro atualiza a
  lista imediatamente, mantém os demais campos e volta à primeira página, sem exigir clique na busca
  ou Enter. A pesquisa por texto aceita Enter e uma lupa dentro do campo, à direita, com nome
  acessível “Buscar”; “Limpar filtros” restaura os padrões. Voltar/avançar do navegador mantém
  controles e resultados sincronizados, sem perder o foco ao selecionar.
- **FR-002**: Arquivar/restaurar com auditoria, sem exigir motivo; não excluir referências nem conta
  de login.
- **FR-003**: Registrar dependência entre pessoas existentes, tipo declarado, início e encerramento;
  impedir ciclos e duplicação ativa do mesmo par.
- **FR-004**: Reutilizar arquivos privados existentes; disponibilizar upload, consulta segura,
  análise e substituição documental sem apagar evidência válida.
- **FR-005**: Registrar decisões manuais independentes para cadastro, vínculo, OAB, finanças,
  credencial e elegibilidade; exibir fonte, método, operador, data, validade e aviso de alteração
  cadastral.
- **FR-006**: Adotar a matriz documental de P01 em [open-decisions.md](open-decisions.md): titular
  apresenta carteira da OAB; cônjuge apresenta identidade e comprovante de casamento ou união
  estável; filho menor apresenta identidade e filho maior também apresenta comprovante de matrícula
  em instituição de ensino superior; enteado apresenta identidade e comprovante de casamento ou
  união estável, acrescentando matrícula em instituição de ensino superior se maior. Filhos e
  enteados têm limite de até 25 anos. Planejamento/implementação pendentes em POL02. Preservar
  análise manual e campos desconhecidos, sem aprovação automática ou exigências adicionais
  presumidas. As alterações que exigem nova análise continuam pendentes em POL01; manter controles
  existentes até decisão específica. Preservar identidade, integridade dos vínculos, arquivos
  privados, histórico e permissões.
- **FR-007**: Manter histórico contextual e auditoria transacionais e proteção contra edição
  concorrente/repetição.
- **FR-008**: Preservar fronteira entre Usuários, Associados e Caassh; cadastro não provisiona
  acesso externo nem interno.
- **FR-009**: Proteger páginas, consultas, alterações e arquivos por sessão ativa e autorização
  específica, revalidada no servidor. Consulta permite perfil/histórico; edição permite cadastro,
  arquivamento, vínculos e anexos; análise permite avaliações e revisões. Inicialmente conceder ao
  administrador existente; nenhum novo papel ou acesso de outros perfis é presumido. Reutilizar
  permissões de arquivos para upload/download, inclusive nas rotas genéricas.
- **FR-010**: Documentar contrato de leitura para Caassh e destino mobile. A autenticação de
  associados no app é uma entrega de acesso externo: exige distinguir acesso administrativo antes de
  provisionar contas, sem novo login paralelo.
- **FR-011**: Validar jornada com teclado, largura reduzida, autorização negativa, integridade
  concorrente e banco descartável.
- **FR-012**: Exibir todas as revisões documentais anteriores com autor, data, resultado e motivos
  históricos existentes. Substituição não herda aprovação. Histórico contextual inclui mudanças de
  vínculos vistas tanto pelo titular quanto pelo dependente.
- **FR-013**: Credencial nesta entrega registra situação e validade de evidência apresentada. Não
  emite cartão, QR ou prova de autenticidade. Emissão verificável permanece extensão da mesma spec,
  dependente de definição institucional de emissor, campos, prazo e revogação.
- **FR-014**: Oferecer a aba Consulta OAB dentro de Associados, acessível com permissão de consulta,
  para buscar uma inscrição avulsa sem criar pessoa; permitir acesso à mesma consulta pelo cadastro,
  usando a inscrição armazenada. A integração cobre somente números de advogados da OAB/BA, com 1–6
  dígitos e valor maior que zero; validar no campo e no servidor. Inscrição ausente, de outra UF, de
  estagiário, suplementar ou com letras deve receber orientação explícita de conferência manual, sem
  consulta a uma identidade presumida. A Consulta OAB não oferece botão nem exportação própria de
  seu resultado, tanto na consulta avulsa quanto na consulta pelo cadastro. É uma exceção explícita
  ao padrão transversal, por decisão do usuário em 21/09/2026.
- **FR-015**: Distinguir regular, irregular, situação desconhecida e inscrição não encontrada.
  Mostrar nome, CPF, situação regular, inadimplência, detalhe, subseção e data de compromisso,
  conforme seleção autorizada em 14/09/2026, além da fonte e data da consulta. Não repetir a OAB
  digitada nem exibir resposta bruta, pagamento total do exercício ou data de inadimplência. Falta
  de configuração, recusa de credenciais, indisponibilidade, demora e resposta inválida recebem
  mensagens próprias e permitem nova tentativa. Nenhuma falha equivale a inscrição irregular.
- **FR-016**: Proteger a consulta no servidor, registrar início e conclusão/falha sem copiar dados
  desnecessários, limitar consultas repetidas e revalidar sessão, permissão e identificação após a
  espera. Não entregar resultados se o acesso foi revogado ou a identificação mudou. A consulta não
  altera cadastro, avaliações, elegibilidade nem créditos; esses continuam exigindo sua decisão
  própria.

### Ativação e bloqueio administrativo — 10/09/2026

Pedido do usuário: implementar ASS-003/005. Neste incremento o efeito é administrativo;
benefícios/créditos não recebem regras novas presumidas. Desbloqueio manual e integração futura com
Agenda confirmados pelo usuário. Pesquisa comparativa do legado registrada em LEG-002; não há cópia
de código, notificações ou expiração automática.

- **FR-017**: Situação administrativa própria: Não ativado, Ativo ou Bloqueado. Cadastros novos e
  anteriores sem decisão explícita começam Não ativado; não inferir ativação de OAB, aprovação
  cadastral, vínculo ou ausência de arquivamento.
- **FR-018**: Ativar muda Não ativado para Ativo; bloquear muda Ativo para Bloqueado; desbloquear
  muda Bloqueado para Ativo. Exigir consulta e análise (`members:review`), confirmação explícita,
  versão atual e idempotência, sem exigir justificativa. Recusar transição inválida.
- **FR-019**: Bloqueio permite leitura, correção cadastral, documentos e análises para
  regularização, conforme permissões existentes. Não altera a situação própria dos dependentes, OAB,
  finanças, avaliações ou contas de acesso. Cadastro arquivado não aceita mudanças de situação;
  restaurar preserva o estado anterior, inclusive bloqueio. Na agenda, o impedimento pelo titular
  vigente alcança os dependentes afetados sem reunir suas identidades. Reservas futuras já
  existentes são mantidas e sinalizadas para decisão manual da equipe, sem cancelamento automático;
  novas reservas e remarcações continuam impedidas conforme spec 008, FR-017/SC-007.
- **FR-020**: Exibir situação na lista e no cadastro; filtrar imediatamente por situação,
  preservando pesquisa e paginação. Mostrar autor e data da última alteração; preservar motivos
  históricos existentes; histórico registra estado anterior e posterior. Consumidores recebem a
  situação no resumo compartilhado, sem concessão ou revogação financeira automática.
- **FR-021**: Manter a busca visível e reunir os quatro filtros adicionais no controle Filtros,
  recolhido inicialmente, com contagem dos filtros ativos. Abrir/fechar não limpa critérios. Usar
  grade compacta em duas colunas no celular e quatro em telas largas, preservar seleção imediata,
  teclado, histórico e Limpar filtros.

Aceite: Não ativado → Ativo → Bloqueado → Ativo, com histórico preservado; impedir ativação como
atalho para desbloquear, alteração por conta sem análise, repetição e edição concorrente.
Arquivar/restaurar associado bloqueado mantém bloqueio. Documentos e avaliações continuam
independentes. Regras de impedimento de benefícios por finalidade permanecem em P02.

### Key Entities

- Pessoa beneficiária: cadastro único e identificador estável, separado de conta de acesso.
- Dependência: relação histórica entre duas pessoas, sem cópia do dependente.
- Evidência documental: referência privada a arquivo e resultado de revisão.
- Avaliação: decisão independente, fonte, responsável e validade; preservar motivos históricos
  existentes.
- Evento de auditoria: quem alterou qual registro, quando e quais valores permitidos mudaram, sem
  cópia desnecessária de dados pessoais.

## Success Criteria

### Measurable Outcomes

- **SC-001**: Todos os cenários de aceite passam antes da conclusão; zero cadastros duplicados por
  CPF e zero ciclos nos testes concorrentes.
- **SC-002**: Toda decisão e alteração testada possui autor, data e alterações consultáveis, sem
  exigir motivo; motivos históricos permanecem legíveis.
- **SC-003**: Zero acesso anônimo, sessão revogada ou arquivo de outra pessoa nos testes negativos.
- **SC-004**: Jornada cadastrar → vincular → analisar → consultar situação funciona por teclado e em
  390 px, sem perda de ações.
- **SC-005**: Mudança de uma dimensão não altera outra; Caassh referencia a mesma pessoa sem
  duplicação cadastral.
- **SC-006**: Na implementação de POL02, conferir os seis perfis da matriz P01 (titular, cônjuge,
  filho menor/maior e enteado menor/maior), com exigências documentais correspondentes e limite de
  até 25 anos para filhos/enteados. Não exigir matrícula de menor nem estender o limite ao cônjuge.
  Preservar análise manual, dados existentes, privacidade e validações; não declarar aprovação
  automática nem criar gatilhos de reanálise enquanto a pergunta 4 permanecer sem resposta. Estes
  cenários são futuros, sem execução nesta atualização.

## Ajustes do formulário confirmados em 10/09/2026

- **FR-022**: O ícone de calendário em Nascimento abre um seletor do painel com mês, ano e dia,
  utilizável por teclado, preservando digitação manual, data opcional e limite de nascimento não
  futuro. Selecionar fecha o calendário e devolve o foco ao ícone; Escape cancela sem alterar o
  valor. Tratar corretamente anos bissextos.
- **FR-023**: CPF e telefone aceitam dígitos e aplicam máscara durante digitação/colagem, limitados
  a onze dígitos: `000.000.000-00` e `(00) 00000-0000`. Telefone fixo com dez dígitos usa
  `(00) 0000-0000`. Permitir apagar e corrigir no meio do valor. Preservar a validação de CPF
  existente no servidor.
- **FR-024**: E-mail opcional vazio é permitido; endereço preenchido inválido apresenta mensagem
  junto ao campo e impede envio. Correção remove o erro. Usar a mesma regra sintática do contrato do
  servidor, sem presumir existência ou propriedade do endereço.

## Foto de perfil — incremento de 11/09/2026

**Status: pronto, com aceite do usuário em 11/09/2026.** A foto é a mesma foto de perfil que o
próprio associado colocará no app. Painel e app devem utilizar a referência única do cadastro de
Associados; não haverá uma foto exclusiva do painel nem cópia independente por canal. A entrega
administrativa está concluída. O envio pelo app será integrado no escopo do app, sem presumir que
esse fluxo já esteja implementado neste PR.

- **FR-025**: Associados permite adicionar, substituir e remover uma foto opcional na aba Cadastro e
  selecionar a foto já no formulário de novo associado. Exibir no cabeçalho com avatar neutro quando
  ausente. Se o envio falhar após criar o cadastro, informar que ele foi salvo e permitir repetir
  somente a etapa da foto, sem duplicar o associado. Não alterar Colaboradores, login, avaliações
  nem a lista de documentos.
- **FR-026**: Aceitar JPEG/PNG de até 5 MB, prévia antes de salvar e progresso de envio e
  verificação. Falhas preservam a foto anterior. Recusar arquivo inválido, de outra pessoa, excluído
  ou ainda não liberado pela verificação de segurança.
- **FR-027**: Foto privada. No painel, consultar exige leitura de Associados e Arquivos; enviar
  exige também edição de Associados e envio de Arquivos. Substituir/remover exige edição, leitura de
  Arquivos, sem exigir justificativa. Bloquear cadastro arquivado e conflitos concorrentes.
- **FR-028**: Remover desvincula a foto e preserva arquivo e auditoria segundo a retenção existente.
  Sem publicação externa, reconhecimento facial, câmera ou editor de recorte.
- **FR-029**: O app deverá permitir ao associado autenticado enviar e atualizar a própria foto,
  reutilizando a mesma referência `member.photo_file_id` exibida no painel. A integração deverá
  validar no servidor o vínculo entre a conta do app e o associado, manter o upload privado e sua
  verificação, e registrar a autoria real da alteração. Acesso ao próprio perfil no app não concede
  permissões administrativas nem acesso a fotos de outros associados. Esta decisão documenta a
  integração futura do app.

Aceite: salvar, reabrir, visualizar, substituir e remover; recusar PDF, mais de 5 MB, arquivo
pendente/rejeitado ou de outro associado; preservar dados e foto anterior em falha; conferir
teclado, 390 px e ambos os temas.

## Assumptions

- Primeira versão administrativa com decisões manuais documentadas; nenhuma regra institucional
  presumida.
- CPF, documentos e inscrição são opcionais ao iniciar cadastro; quem analisa registra a base para
  aprovar ou pedir correção. Documento solicitado é definido no caso, não uma lista institucional
  inventada.
- Em 10/09/2026 foi localizada a documentação da integração OAB-BA/Implanta no legado. A consulta
  integrada é preparada conforme [contracts/oab-legacy.md](contracts/oab-legacy.md), mantendo a
  conferência manual nacional. A conexão fica desativada até configurar credenciais vigentes e
  validar o retorno; respostas simuladas existem somente nos testes.
- Sem provisionamento de contas mobile, importação de dados reais, biometria/selfie obrigatória ou
  envio de mensagens. O reenvio é uma pendência registrada, não uma notificação entregue.
- Caassh implementado separadamente; nenhum saldo, conversão ou concessão pertence a esta função.
- Alterações posteriores atualizam esta spec. Um PR completo após validação; merge manual pelo
  usuário.
- Retomada em 10/09/2026: decisões P01–P04 permanecem pendentes em
  [open-decisions.md](open-decisions.md). Nenhuma avaliação manual equivale a homologação
  institucional; validação utiliza pessoas e regras sintéticas. Datas são exibidas em America/Bahia.

Integração ativada somente no localhost em 10/09/2026. Não conservar nem reutilizar o resultado da
inscrição real usada no teste, conforme correção do usuário. Rastreabilidade em
[LEG-001](../../docs/LEGACY-REUSE.md).

Revisão transversal em 11/09/2026: CPF, telefone e e-mail usam os componentes comuns da fundação,
com máscara, erro junto ao campo e validação equivalente no servidor. Telefone aceita DDD + oito ou
nove dígitos; dados legados não são regravados em lote.

## Campos — 14/09/2026

OAB: todos os campos específicos aceitam apenas 0–9, até seis dígitos; servidor valida o mesmo
formato. Busca mista preservada e registros antigos não são reescritos em lote.

## Justificativas de criação e alteração — 14/09/2026

A regra intermediária que dispensava motivo somente na criação foi substituída pela decisão final de
14/09/2026: dispensa geral de motivo ou justificativa, com exceção posterior da solicitação de
exclusão de Associados confirmada em 21/09/2026 (LC03). Preservar autor, data, alterações e motivos
históricos existentes, além de autorização, confirmação, idempotência e controle de versão. Aceite
vigente: criar e alterar sem preencher/enviar motivo, sem esse controle na interface. Não apagar
dados históricos nem inventar explicação humana.

## Resultado da consulta OAB — revisão de 14/09/2026

Decisão do usuário após consulta individual autorizada somente para leitura:

- Exibir nome, CPF, situação regular, inadimplência, detalhe, subseção e data de compromisso.
- Não repetir a OAB no resultado: ela já está no formulário. Não exibir pagamento total do exercício
  nem data de inadimplência.
- Nome em destaque e demais informações em pares de rótulo/valor responsivos; regularidade e
  inadimplência são independentes.
- Campo ausente/vazio ou situação desconhecida deve aparecer como não informado, sem inferir
  resposta negativa.
- Preservar fonte, horário, ausência de registro, erros, permissões e a auditoria existente. Nenhum
  novo campo pessoal do retorno é persistido ou copiado para cadastro/avaliações.
- Documentar os dez nomes de campos efetivamente retornados, com tipos e uso, sem inscrição, nome,
  CPF ou demais valores pessoais da consulta real.
- Testes automatizados usam exclusivamente dados sintéticos e um provedor simulado; não repetir a
  consulta real.

## Dispensa de justificativas — 14/09, com exceção de exclusão em 21/09/2026

Decisão do usuário em 14/09: remover os campos de motivo/justificativa das demais ações e sua
obrigatoriedade no servidor. Abrange criação, edição, publicação, retirada, recuperação,
arquivamento, acessos, situações, documentos, avaliações, configurações, exportações e reenvios.
Esta decisão substitui as exigências anteriores, inclusive as exceções de primeira
criação/publicação. Auditoria preserva ator, ação, data e alterações, sem inventar explicação
humana. Dados históricos de motivo permanecem legíveis. Campos operacionais (fonte, resultado,
condições e vigência), permissões, autenticação, concorrência e confirmação de ações permanecem.
Exceção de 21/09: solicitar exclusão exige motivo, autor e data por ocorrência (LC03). Aceite: as
demais jornadas funcionam sem preencher ou enviar motivo; nenhum controle de justificativa aparece
na interface. Agendamentos possui primeira versão administrativa (spec 008), com app/site e
expansões pendentes; OAB-BA permanece pendente da hospedagem.

### Aceite de documentos sem motivo — 15/09/2026

Abrir documento e expandir seu histórico devem manter áreas clicáveis suficientes quando a análise
não tiver motivo escrito, com teclado e celular, sem sobreposição ou rolagem horizontal.

## Configuração OAB para deploy — proposta inicial substituída, 15/09/2026

Histórico do PR25. A regra vigente está em **Decisão final: consulta sempre habilitada** abaixo e no
contrato oab-query.md; false não desativa mais a integração.

Pedido expresso: corrigir pelo código em branch própria, preservando a instância de Agendamentos, e
pesquisar API oficial mais recente. Deploy fica com o fluxo existente. Com API_OAB_KEY e
API_OAB_PASSWORD não vazias, a omissão de OAB_API_ENABLED permite consulta institucional. true
continua permitido; false desativa explicitamente. Normalizar espaços/caixa da flag; valores não
reconhecidos bloqueiam a integração. Segredos continuam apenas no servidor e são lidos em execução.
A falta de credenciais continua sendo erro de configuração; código não fornece credenciais
embutidas. Preservar endpoint, campos selecionados, permissões, auditoria, limites e avaliações.
Aceite com fixtures sintéticas: credenciais sem flag permitem consulta, configuração
incompleta/desativada/inválida não chama o provedor, falhas externas não viram sucesso. Esta entrega
não afirma diagnóstico da configuração remota nem homologação real T028.

### Decisão final: consulta sempre habilitada — 15/09/2026

Usuário rejeitou tela nova e controle de desativação. Esta decisão substitui a semântica anterior da
flag: a aplicação usa as credenciais do servidor quando ambas existem, independentemente de
OAB_API_ENABLED, inclusive false ou valor vazio/antigo/inválido. Não adicionar interface de
configuração ou nova variável obrigatória. A autenticação institucional continua exigindo
chave/senha privadas válidas; nenhuma credencial será embutida na aplicação. Preservar consulta
individual, campos, permissões e auditoria. Aceite: mesmas credenciais funcionam com flag ausente,
true, false ou qualquer valor; credenciais ausentes/incompletas continuam bloqueando o HTTP.

## Edições durante navegação — decisão de 16/09/2026

- Preservar campos, seleções e alterações pendentes ao consultar outra aba ou módulo e voltar,
  separados por formulário e registro, sem gravação automática no servidor.
- Salvar com sucesso, cancelar/descartar explicitamente ou encerrar a sessão encerra a edição.
  Falhas de validação/rede conservam os dados; manter as proteções de versão/autorização.
- Compartilhar a infraestrutura do painel e validar ida/volta, sem misturar registros ou usuários.

## Homologação e prontidão — 16/09/2026

Pedido atual: configuração publicada e homologação institucional da OAB com dado explicitamente
autorizado. Validar evidências reais, preservar dados existentes e não declarar concluída uma
aprovação institucional ausente. Homologação da OAB depende da inscrição autorizada e do resultado
esperado; descarte não executa sem política aprovada.

## Dados para segmentação de Mensagens — 16/09/2026

Adicionar categoria, gênero, cidade e UF de residência opcionais, com validação, persistência e
edição nas permissões/versões/auditoria existentes. Registros atuais permanecem sem esses dados até
preenchimento explícito. Não confundir residência e OAB. Validar criação/edição/consulta e preservar
dados nas demais operações de cadastro.

### US5 — Exportar dados autorizados (Priority: P2)

O operador com permissão geral de exportação e consulta da função abre “Exportar Associados”, ajusta
filtros, seleciona/reordena colunas e escolhe Excel, CSV ou PDF para download direto. Abrange
dados/abas consultáveis da função, sem teto funcional de registros/período, sem prazo de arquivo nem
fila/histórico obrigatório. Não exportar bytes de anexos, segredos ou campos sem autorização.
Consulta OAB excluída: nenhum botão ou dataset de exportação de seu resultado, avulso ou pelo
cadastro.

Teste independente: Exportar associados/dependentes sem acesso a Relatórios; negar documento/campo
restrito; bloqueio mantém reservas e vaga, sinaliza vínculos vigentes e não afeta situação própria;
manter análise manual sem novas exigências. Em erro, manter filtros/colunas; três formatos preservam
conjunto e ordem escolhidos. Campos restritos enviados diretamente são recusados no servidor. Este
detalhamento aplica o padrão transversal já decidido, sem implementação ou nova homologação.

Checkpoint de 21/09/2026 — plan concluído: desenho, pesquisa, modelo, contratos e roteiro
atualizados. Nenhum código, serviço, migration ou teste de aplicação executado. Tarefas serão
detalhadas em seguida; políticas e funções adiadas permanecem pendentes.

Checkpoint de 21/09/2026 — tasks concluídas: 9 tarefas novas (T041–T049), com histórias,
dependências, caminhos e aceite; nenhuma implementação/teste de aplicação executado. Ver tasks.md.

Checkpoint final de21/09/2026 — plan seguido de tasks encerrados. Conferência documental de IDs,
fases, links e preservação do histórico concluída; código, testes de aplicação e homologações não
executados. Próximo passo recomendado: análise cruzada antes da implementação. Detalhes no relatório
do programa002.

Checkpoint de 21/09/2026 — analyze em andamento: usuário determinou que a Consulta OAB não terá
botão de exportação. Exceção registrada no padrão, specs, planos, contratos, tarefas existentes e
roteiro; nenhuma tarefa executada, código alterado ou consulta externa realizada. A análise dos
demais pontos continua sem correções automáticas.

## Exclusão e reativação — ampliação autorizada em 21/09/2026

Acrescentar ação de apagar associados na entrega ativa. Decisão confirmada: prazo de sete dias antes
da exclusão lógica; preservar dados, vínculos e auditoria. Exibir data prevista e permitir desfazer
a solicitação nesse intervalo. A partir do prazo, ocultar nas consultas normais e impedir novas
reservas, sem cancelamento automático das existentes. Agendamentos e demais reservas existentes
mostram Associado excluído, com escolha explícita do responsável pela área para manter ou cancelar,
respeitando sua permissão de gestão. O aviso permanece mesmo quando a reserva é mantida; registrar
quem decidiu e quando. Não alterar status OAB ou dependentes implicitamente. Preservar autorização,
controle de versão, confirmação e auditoria nas ações do cadastro.

A reativação já existe: activate para inativo, unblock para bloqueado e restore para arquivado.
Conferir sua disponibilidade na interface, filtros de recuperação e jornada completa; reutilizar
essas ações sem criar estado administrativo paralelo.

Checkpoint: código existente identificado no serviço e em MemberAdministrativeStatus / MemberEditor;
nenhuma nova validação executada nesta ampliação. Localhost desligado.

Motivo da exclusão — decisão vigente do usuário em 21/09/2026: solicitar exclusão de associado exige
motivo obrigatório, também validado pelo servidor; vazio ou somente espaços é recusado. Esta é
exceção explícita à dispensa geral de motivos registrada em14/09; as demais ações continuam
dispensadas. Registrar motivo, autor e data da ocorrência antes de iniciar o prazo de sete dias;
preservar histórico após desfazer/restaurar. Exclusões antigas sem motivo exibem “Motivo não
registrado” em consulta autorizada. Não inventar motivos retroativos nem mudar reservas/dependentes.
Checkpoint: decisão documental, LC03 pendente; implementação somente após clarify/analyze deste
recorte. Documentação de dependentes P01 incluída por autorização de22/09; implementação fora do
incremento.
