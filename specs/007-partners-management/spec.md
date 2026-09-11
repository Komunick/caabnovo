# Feature Specification: Parceiros e benefícios

**Feature Branch**: `feature/partners-management`
**Created**: 2026-09-11
**Status**: Especificado para implementação
**Input**: Implementar Parceiros em nova branch e spec própria, com plano/tarefas e interface harmonizada com Associados e Notícias.

## User Scenarios & Testing

### User Story 1 — Encontrar e manter estabelecimentos (P1)

O operador cadastra um estabelecimento parceiro e suas unidades, encontra-o por nome ou CNPJ e mantém contatos e situação sem criar outra conta de acesso.

**Why this priority**: fornece a identidade única usada pelos contratos e benefícios.
**Independent Test**: cadastrar, buscar, editar, suspender, arquivar e restaurar um parceiro e uma unidade.

**Acceptance Scenarios**:
1. Nome e categoria permitem iniciar cadastro; CNPJ preenchido exige formato e dígitos verificadores válidos, inclusive alfanumérico. Duplicidade é recusada, preservando o formulário.
2. Busca, categoria e situação combinam-se e persistem na paginação. A linha inteira abre o detalhe, mantendo navegação por teclado.
3. Unidades possuem nome, local/abrangência e atendimento presencial ou remoto; alterações e desativação preservam histórico.
4. Suspensão/arquivamento impede a exibição externa dos benefícios imediatamente. Restaurar o parceiro não publica automaticamente benefícios retirados.

### User Story 2 — Registrar contratos e documentos (P1)

O operador registra referência, condições e datas de um contrato, anexa documentação privada quando disponível e registra a confirmação administrativa de aprovação.

**Why this priority**: a oferta exige condições contratuais rastreáveis.
**Independent Test**: registrar contrato, anexar documento verificado, aprovar com motivo, encerrar e conferir o histórico.

**Acceptance Scenarios**:
1. Fim anterior ao início é recusado. Vigência é inclusiva por data local; contrato futuro, pendente ou encerrado não habilita exibição externa.
2. Aprovar exige referência, condições, datas e justificativa do responsável. Nenhum prazo contratual, desconto ou exigência documental institucional é preenchido automaticamente.
3. Documento de outro parceiro, arquivo não verificado, excluído ou usuário sem permissão não pode ser vinculado/baixado.
4. Contrato registrado é preservado; correção/renovação usa novo registro e encerramento explícito do anterior, sem reescrever evidência.

### User Story 3 — Preparar e exibir benefícios (P1)

O operador cadastra benefícios, seleciona unidade e contrato, informa descrição, condições, público e datas, confere a prévia e decide os canais de exibição.

**Why this priority**: transforma o cadastro em ofertas úteis, sem anunciar benefício vencido.
**Independent Test**: criar rascunho, visualizar prévia, publicar, editar mantendo publicação anterior, republicar e ocultar.

**Acceptance Scenarios**:
1. Rascunho pode ser salvo incompleto; publicação exige título, descrição, condições de uso, público, unidade ativa, contrato aprovado e período integralmente coberto pelo contrato.
2. Publicação tem canais independentes app/site. Editar rascunho não muda a versão publicada até nova publicação explícita.
3. Fora da vigência, parceiro suspenso/arquivado, unidade inativa ou contrato encerrado impedem exibição externa mesmo se houver versão publicada.
4. Ocultar retira a oferta dos canais e preserva texto e histórico. A prévia informa claramente que não é uma publicação.
5. A lista geral de benefícios combina busca, categoria, canal e situação, e remete à aba de benefícios do parceiro.

### User Story 4 — Operar com permissões e histórico (P1)

O administrador concede consulta, edição e publicação individualmente em Colaboradores. O operador identifica quem fez cada alteração e por quê.

**Independent Test**: conta sem acesso recusada; consulta sem edição; editor sem publicação; revogação de concessão; conflito de versão e repetição de comando.

**Acceptance Scenarios**:
1. Toda operação privada exige sessão e permissão atuais. Edição e publicação dependem de consulta; arquivos usam também suas permissões próprias.
2. Ações simultâneas não sobrescrevem silenciosamente. Repetir o mesmo envio não cria outro registro.
3. Histórico mostra autor, ação em linguagem simples, data e motivo, sem documentos completos, contatos privados ou segredos.
4. As quatro páginas e cinco abas descritas em [interface.md](interface.md) preservam layout, botões, filtros, foco e temas das telas de referência.

### Edge Cases

CNPJ com zeros/letras, caracteres inválidos e duplicidade; nomes longos; datas-limite locais; contrato futuro/vencido/encerrado; unidade de outro parceiro; rascunho alterado após publicação; arquivo em quarentena; permissão revogada; parceiro arquivado; concorrência e falha da auditoria; listas vazias, paginação e celular.

## Requirements

### Functional Requirements

- **FR-001**: Cadastro único de estabelecimento com nome de exibição, razão social opcional, CNPJ opcional, categoria, descrição e contatos administrativos opcionais. CNPJ válido e único quando informado; validação não comprova situação na Receita.
- **FR-002**: Manter unidades e abrangência presencial/remota, endereço/localidade, contato e estado ativo/inativo por parceiro.
- **FR-003**: Registrar contratos com referência, condições, início/fim, estado pendente/aprovado/encerrado, arquivo privado opcional e autoria; aprovação e encerramento exigem motivo.
- **FR-004**: Reutilizar envio privado verificado de PDF/JPEG/PNG até o limite de 25 MB existente; somente arquivos pertencentes ao parceiro podem ser utilizados.
- **FR-005**: Manter rascunho e publicação de benefício, título/descrição/condições/público, unidade/contrato, período e canais app/site. Benefício não concede elegibilidade ou crédito.
- **FR-006**: Exibição externa exige todos os pré-requisitos e vigências atuais do parceiro, unidade, contrato e versão publicada. Ocultar não apaga evidência nem republica sozinho.
- **FR-007**: Fornecer consulta externa versionada apenas de dados selecionados dos benefícios exibíveis. Contatos administrativos, CNPJ, contratos, documentos e auditoria não são públicos.
- **FR-008**: Permissões distintas de consultar, editar e publicar; administrador existente recebe concessões iniciais. Demais contas dependem de concessão individual explícita, sem novo papel automático.
- **FR-009**: Toda mutação exige versão/idempotência proporcionais e auditoria transacional. Conflito ou falha mantém os dados preenchidos e orienta o operador.
- **FR-010**: Oferecer quatro páginas principais e cinco abas de detalhe conforme interface.md; usar padrões compartilhados de Associados e Notícias, incluindo filtros e botões de adicionar com +.
- **FR-011**: Histórico contextual explica ações em português simples. Arquivamento/desativação preserva registros, relacionamentos e documentos.
- **FR-012**: Validar teclado, contraste e semântica acessível, temas claro/escuro e largura de 390 px sem rolagem horizontal da página.

### Key Entities

Parceiro (estabelecimento), unidade (local/abrangência), contrato (condições e vigência), benefício (oferta com rascunho e publicação), documento privado e evento histórico. Conta administrativa e associado permanecem cadastros separados.

## Success Criteria

- **SC-001**: Operador cadastra parceiro, unidade e contrato, publica benefício e consegue encontrá-lo e retirá-lo nos testes de ponta a ponta.
- **SC-002**: Todos os cenários de vigência e autorização recusam exibição/alteração indevida, inclusive acesso entre parceiros a arquivos.
- **SC-003**: Repetição não duplica registros e conflito não sobrescreve outra edição; falha de auditoria impede efeito parcial.
- **SC-004**: Quatro páginas testadas nos dois temas; interface principal acessível por teclado e sem overflow em 390 px.
- **SC-005**: Cada mudança relevante pode ser atribuída a um autor e motivo no histórico.

## Assumptions

- A entrega é o módulo administrativo de Parceiros previsto em PAR-001–005 do PRD. Portal externo, login do parceiro, resgate/QR, Caassh e coleta/moderação de avaliações são integrações próprias, dependentes das políticas correspondentes.
- Não presumir percentual de desconto, renovação, documentos institucionais obrigatórios ou público elegível. O operador registra condições específicas do contrato/oferta e aprova explicitamente a publicação; nenhum dado real é publicado durante testes.
- Datas de vigência incluem início/fim no fuso America/Bahia. Estado editorial e vigência têm significados distintos.
- Contrato mínimo externo de consulta será entregue, sem refazer o aplicativo ou site. Arquivos administrativos permanecem privados.
- Sem consultas ao legado, Receita, OAB ou envio de mensagens; dados sintéticos para testes.
- Base dev ab0ad89. A foto de Associados no PR #17 é independente desta entrega. Um PR completo para dev; nenhum merge automático.
