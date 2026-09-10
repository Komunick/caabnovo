# Feature Specification: Associados e dependentes

**Feature Branch**: `feature/members-management`
**Created**: 2026-09-09
**Status**: Em implementação e validação funcional — não está pronto para PR
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
2. OAB é consulta manual com data, fonte e resultado, sem automação do portal.
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

- **FR-001**: Manter nome, nome social opcional, CPF opcional validado, nascimento opcional, contato e inscrição OAB opcional com UF e tipo; pesquisar e paginar sem expor CPF em listagens.
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

## Assumptions

- Primeira versão administrativa com decisões manuais documentadas; nenhuma regra institucional presumida.
- CPF, documentos e inscrição são opcionais ao iniciar cadastro; quem analisa registra a base para aprovar ou pedir correção. Documento solicitado é definido no caso, não uma lista institucional inventada.
- Consulta OAB manual; sem contrato autorizado de integração automática.
- Sem provisionamento de contas mobile, importação de dados reais, biometria/selfie obrigatória ou envio de mensagens. O reenvio é uma pendência registrada, não uma notificação entregue.
- Caassh implementado separadamente; nenhum saldo, conversão ou concessão pertence a esta função.
- Alterações posteriores atualizam esta spec. Um PR completo após validação; merge manual pelo usuário.
- Retomada em 10/09/2026: decisões P01–P04 permanecem pendentes em [open-decisions.md](open-decisions.md). Nenhuma avaliação manual equivale a homologação institucional; validação utiliza pessoas e regras sintéticas. Datas são exibidas em America/Bahia.
