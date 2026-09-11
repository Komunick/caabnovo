# Feature Specification: Associados e dependentes

**Feature Branch**: `feature/members-management`
**Created**: 2026-09-09
**Status**: Pronto conforme confirmação do usuário em 11/09/2026; preparação do PR autorizada.
**Input**: Implementar Associados; outra instância implementará Caassh.

## User Scenarios & Testing

### User Story 1 — Cadastro único e vínculos (P1)

O operador encontra, cria, corrige e arquiva cadastros de associados e dependentes, sem criar contas de acesso ou copiar pessoas para Créditos.
**Why this priority**: fornece a identidade de beneficiário para os demais módulos.
**Independent Test**: cadastrar titular, vincular dependente já existente, encerrar vínculo e consultar histórico.
**Acceptance Scenarios**:
1. CPF informado é validado e único, inclusive entre arquivados; nome/email iguais não unem pessoas automaticamente.
2. Edições concorrentes preservam a alteração vencedora e avisam quem precisa recarregar.
3. Dependente referencia outro cadastro existente; vínculo consigo mesmo e ciclos são recusados. Encerramento preserva histórico.
4. Arquivar mantém identificador e referências; restaurar não cria outro cadastro.

### User Story 2 — Documentos e fila de análise (P1)

Operador registra os documentos solicitados, anexa arquivos privados e decide aceitar ou pedir correção com motivo.
**Why this priority**: reduzir pedidos repetidos e permitir análise atribuível.
**Independent Test**: anexar documento liberado, pedir correção, anexar substituição e consultar o anterior.
**Acceptance Scenarios**:
1. Somente arquivo privado, liberado pelo antivírus e pertencente à pessoa pode ser associado ou baixado.
2. Cada substituição é uma nova evidência; revisão preserva autor, data, motivo e versões anteriores.
3. Filtro de cadastro pendente permite encontrar a próxima pessoa para analisar.

### User Story 3 — Situações explicáveis (P1)

Operador registra separadamente análise cadastral, vínculo institucional, verificação OAB, situação financeira, credencial e elegibilidade.
**Why this priority**: impedir decisões automáticas baseadas em conceitos diferentes.
**Independent Test**: aprovar cadastro, registrar consulta OAB manual e verificar que finanças/elegibilidade não mudaram.
**Acceptance Scenarios**:
1. Toda decisão registra responsável, instante, fonte/referência e motivo; desconhecido não significa aprovado.
2. A avaliação OAB pode ser registrada manualmente; a consulta integrada OAB-BA é acionada pelo operador e mostra fonte, horário e regularidade, sem alterar automaticamente qualquer avaliação ou automatizar o portal nacional.
3. Validade da credencial e de avaliações é exibida como vencida quando o prazo termina, sem apagar a decisão.
4. Alteração de identificação sinaliza decisões anteriores para revisão, sem apagar documentos nem bloquear dependentes automaticamente.
5. Elegibilidade exige decisão explícita e referência à regra aplicada; aprovação cadastral não concede créditos.

### User Story 4 — Consulta pelos demais módulos (P2)

Caassh e futuros consumidores consultam a mesma pessoa pelo identificador estável, sem replicar cadastro.
**Why this priority**: permite implementação paralela e futura integração mobile.
**Independent Test**: consultar resumo de beneficiário e confirmar ausência de documentos, CPF e observações internas.
**Acceptance Scenarios**:
1. Consulta para seleção de beneficiário retorna identificador, nome, arquivamento e situações; não presume autorização para crédito.
2. Cadastro não cria login nem concede acesso ao painel. Mobile não recebe listagem pública de pessoas.
3. Acesso administrativo exige sessão ativa e concessão explícita: consulta, edição ou análise. Consulta é pré-requisito das demais ações; arquivos também exigem sua permissão existente. Anonimato, sessão revogada e usuário sem concessão são recusados.

### Edge Cases

CPF inválido/duplicado, inscrição OAB duplicada, dependência circular, vínculo encerrado, cadastro arquivado, arquivo de outra pessoa/em quarentena, documento substituído, datas futuras inválidas, decisão vencida, versão obsoleta, sessão revogada, comando repetido e falha na auditoria.

## Requirements

### Functional Requirements

- **FR-001**: Manter nome, nome social opcional, CPF opcional validado, nascimento opcional, contato e inscrição OAB opcional com UF e tipo; pesquisar por nome/CPF/número OAB e filtrar por estado da OAB, análise cadastral e arquivamento, preservando filtros na paginação e sem expor CPF em listagens. Usar “Estado da OAB” e “Todos os estados” na interface. Selecionar um filtro atualiza a lista imediatamente, mantém os demais campos e volta à primeira página, sem exigir clique na busca ou Enter. A pesquisa por texto aceita Enter e uma lupa dentro do campo, à direita, com nome acessível “Buscar”; “Limpar filtros” restaura os padrões. Voltar/avançar do navegador mantém controles e resultados sincronizados, sem perder o foco ao selecionar.
- **FR-002**: Arquivar/restaurar com motivo; não excluir referências nem conta de login.
- **FR-003**: Registrar dependência entre pessoas existentes, tipo declarado, início e encerramento; impedir ciclos e duplicação ativa do mesmo par.
- **FR-004**: Reutilizar arquivos privados existentes; disponibilizar upload, consulta segura, análise e substituição documental sem apagar evidência válida.
- **FR-005**: Registrar decisões manuais independentes para cadastro, vínculo, OAB, finanças, credencial e elegibilidade; exibir fonte, método, operador, data, motivo, validade e aviso de alteração cadastral.
- **FR-006**: Não inferir regras de dependência, documentação obrigatória, elegibilidade ou concessão de crédito. Operador registra regra aplicada; campos não verificados permanecem desconhecidos.
- **FR-007**: Manter histórico contextual e auditoria transacionais, justificativa e proteção contra edição concorrente/repetição.
- **FR-008**: Preservar fronteira entre Usuários, Associados e Caassh; cadastro não provisiona acesso externo nem interno.
- **FR-009**: Proteger páginas, consultas, alterações e arquivos por sessão ativa e autorização específica, revalidada no servidor. Consulta permite perfil/histórico; edição permite cadastro, arquivamento, vínculos e anexos; análise permite avaliações e revisões. Inicialmente conceder ao administrador existente; nenhum novo papel ou acesso de outros perfis é presumido. Reutilizar permissões de arquivos para upload/download, inclusive nas rotas genéricas.
- **FR-010**: Documentar contrato de leitura para Caassh e destino mobile. A autenticação de associados no app é uma entrega de acesso externo: exige distinguir acesso administrativo antes de provisionar contas, sem novo login paralelo.
- **FR-011**: Validar jornada com teclado, largura reduzida, autorização negativa, integridade concorrente e banco descartável.
- **FR-012**: Exibir todas as revisões documentais anteriores com autor, data e motivo. Substituição não herda aprovação. Histórico contextual inclui mudanças de vínculos vistas tanto pelo titular quanto pelo dependente.
- **FR-013**: Credencial nesta entrega registra situação e validade de evidência apresentada. Não emite cartão, QR ou prova de autenticidade. Emissão verificável permanece extensão da mesma spec, dependente de definição institucional de emissor, campos, prazo e revogação.
- **FR-014**: Oferecer a aba Consulta OAB dentro de Associados, acessível com permissão de consulta, para buscar uma inscrição avulsa sem criar pessoa; permitir acesso à mesma consulta pelo cadastro, usando a inscrição armazenada. A integração cobre somente números de advogados da OAB/BA, com 1–6 dígitos e valor maior que zero; validar no campo e no servidor. Inscrição ausente, de outra UF, de estagiário, suplementar ou com letras deve receber orientação explícita de conferência manual, sem consulta a uma identidade presumida.
- **FR-015**: Distinguir regular, irregular, situação desconhecida e inscrição não encontrada. Mostrar fonte e data da consulta; não exibir CPF, informações financeiras ou resposta bruta. Falta de configuração, recusa de credenciais, indisponibilidade, demora e resposta inválida recebem mensagens próprias e permitem nova tentativa. Nenhuma falha equivale a inscrição irregular.
- **FR-016**: Proteger a consulta no servidor, registrar início e conclusão/falha sem copiar dados desnecessários, limitar consultas repetidas e revalidar sessão, permissão e identificação após a espera. Não entregar resultados se o acesso foi revogado ou a identificação mudou. A consulta não altera cadastro, avaliações, elegibilidade nem créditos; esses continuam exigindo sua decisão própria.

### Ativação e bloqueio administrativo — 10/09/2026

Pedido do usuário: implementar ASS-003/005. Neste incremento o efeito é administrativo;
benefícios/créditos não recebem regras novas presumidas. Desbloqueio manual e integração
futura com Agenda confirmados pelo usuário. Pesquisa comparativa do legado registrada em
LEG-002; não há cópia de código, notificações ou expiração automática.

- **FR-017**: Situação administrativa própria: Não ativado, Ativo ou Bloqueado. Cadastros
  novos e anteriores sem decisão explícita começam Não ativado; não inferir ativação de OAB,
  aprovação cadastral, vínculo ou ausência de arquivamento.
- **FR-018**: Ativar muda Não ativado para Ativo; bloquear muda Ativo para Bloqueado;
  desbloquear muda Bloqueado para Ativo. Exigir consulta e análise (`members:review`),
  justificativa, confirmação explícita, versão atual e idempotência. Recusar transição inválida.
- **FR-019**: Bloqueio permite leitura, correção cadastral, documentos e análises para
  regularização, conforme permissões existentes. Não altera dependentes, OAB, finanças,
  avaliações ou contas de acesso. Cadastro arquivado não aceita mudanças de situação;
  restaurar preserva o estado anterior, inclusive bloqueio.
- **FR-020**: Exibir situação na lista e no cadastro; filtrar imediatamente por situação,
  preservando pesquisa e paginação. Mostrar última justificativa, autor e data; histórico
  registra estado anterior e posterior. Consumidores recebem a situação no resumo compartilhado,
  sem concessão ou revogação financeira automática.
- **FR-021**: Manter a busca visível e reunir os quatro filtros adicionais no controle
  Filtros, recolhido inicialmente, com contagem dos filtros ativos. Abrir/fechar não limpa
  critérios. Usar grade compacta em duas colunas no celular e quatro em telas largas,
  preservar seleção imediata, teclado, histórico e Limpar filtros.

Aceite: Não ativado → Ativo → Bloqueado → Ativo, com histórico preservado; impedir ativação
como atalho para desbloquear, alteração por conta sem análise, repetição e edição concorrente.
Arquivar/restaurar associado bloqueado mantém bloqueio. Documentos e avaliações continuam
independentes. Regras de impedimento de benefícios por finalidade permanecem em P02.

### Key Entities

- Pessoa beneficiária: cadastro único e identificador estável, separado de conta de acesso.
- Dependência: relação histórica entre duas pessoas, sem cópia do dependente.
- Evidência documental: referência privada a arquivo e resultado de revisão.
- Avaliação: decisão independente, fonte, motivo, responsável e validade.
- Evento de auditoria: quem alterou qual registro e por quê, sem cópia desnecessária de dados pessoais.

## Success Criteria

### Measurable Outcomes

- **SC-001**: Todos os cenários de aceite passam antes da conclusão; zero cadastros duplicados por CPF e zero ciclos nos testes concorrentes.
- **SC-002**: Toda decisão e alteração testada possui autor, data e motivo consultáveis.
- **SC-003**: Zero acesso anônimo, sessão revogada ou arquivo de outra pessoa nos testes negativos.
- **SC-004**: Jornada cadastrar → vincular → analisar → consultar situação funciona por teclado e em 390px, sem perda de ações.
- **SC-005**: Mudança de uma dimensão não altera outra; Caassh referencia a mesma pessoa sem duplicação cadastral.

## Ajustes do formulário confirmados em 10/09/2026

- **FR-022**: O ícone de calendário em Nascimento abre um seletor do painel com mês,
  ano e dia, utilizável por teclado, preservando digitação manual, data opcional e limite
  de nascimento não futuro. Selecionar fecha o calendário e devolve o foco ao ícone;
  Escape cancela sem alterar o valor. Tratar corretamente anos bissextos.
- **FR-023**: CPF e telefone aceitam dígitos e aplicam máscara durante digitação/colagem,
  limitados a onze dígitos: `000.000.000-00` e `(00) 00000-0000`. Telefone fixo com dez
  dígitos usa `(00) 0000-0000`. Permitir apagar e corrigir no meio do valor. Preservar
  a validação de CPF existente no servidor.
- **FR-024**: E-mail opcional vazio é permitido; endereço preenchido inválido apresenta
  mensagem junto ao campo e impede envio. Correção remove o erro. Usar a mesma regra
  sintática do contrato do servidor, sem presumir existência ou propriedade do endereço.

## Assumptions

- Primeira versão administrativa com decisões manuais documentadas; nenhuma regra institucional presumida.
- CPF, documentos e inscrição são opcionais ao iniciar cadastro; quem analisa registra a base para aprovar ou pedir correção. Documento solicitado é definido no caso, não uma lista institucional inventada.
- Em 10/09/2026 foi localizada a documentação da integração OAB-BA/Implanta no legado. A consulta integrada é preparada conforme [contracts/oab-legacy.md](contracts/oab-legacy.md), mantendo a conferência manual nacional. A conexão fica desativada até configurar credenciais vigentes e validar o retorno; respostas simuladas existem somente nos testes.
- Sem provisionamento de contas mobile, importação de dados reais, biometria/selfie obrigatória ou envio de mensagens. O reenvio é uma pendência registrada, não uma notificação entregue.
- Caassh implementado separadamente; nenhum saldo, conversão ou concessão pertence a esta função.
- Alterações posteriores atualizam esta spec. Um PR completo após validação; merge manual pelo usuário.
- Retomada em 10/09/2026: decisões P01–P04 permanecem pendentes em [open-decisions.md](open-decisions.md). Nenhuma avaliação manual equivale a homologação institucional; validação utiliza pessoas e regras sintéticas. Datas são exibidas em America/Bahia.


Integração ativada somente no localhost em 10/09/2026. Não conservar nem reutilizar o resultado da inscrição real usada no teste, conforme correção do usuário. Rastreabilidade em [LEG-001](../../docs/LEGACY-REUSE.md).
