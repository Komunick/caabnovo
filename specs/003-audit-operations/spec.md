# Feature Specification: Auditoria e Processamentos

**Feature Branch**: `feature/product-direction`

**Created**: 2026-09-09

**Status**: Fusão implementada e validada localmente; melhorias de Processamentos planejadas.

**Input**: Fundir Operações com Auditoria; um spec próprio para cada nova funcionalidade.
**Programa**: [Módulos integrados](../002-integrated-modules/plan.md), US1/T005–T011.

## User Scenarios & Testing

### US1 — Área consolidada conforme permissões (P1)

Usuário encontra eventos e processamentos em Auditoria, sem duplicação no menu, dashboard ou busca.
Prioridade: mudança pedida sobre funções existentes, pronta para início sem novas regras
institucionais. Teste independente: perfis de gestor, auditor, operador somente de jobs e usuário
comum.

**Acceptance Scenarios**:

1. Gestor com eventos/jobs vê uma entrada Auditoria e alterna Eventos e Processamentos.
2. Operador apenas com leitura de jobs entra em Processamentos e não consegue consultar eventos.
3. Auditor apenas com eventos/exportação mantém essas funções e não consegue consultar jobs.
4. Usuário comum não vê a área nem acessa dados por URL/API direta.
5. Busca por “operações” ou “processamentos” encontra a área consolidada, sem segundo módulo.

### US2 — Continuidade das operações (P1)

Endereços anteriores continuam válidos e ações preservam controles existentes. Teste independente:
abrir URL anterior de lista/detalhe e realizar o fluxo autorizado de reenvio/exportação.

**Acceptance Scenarios**:

1. Favorito antigo de processamento chega ao mesmo registro na área nova.
2. Reenvio exige sua permissão/justificativa; a fusão não concede esse direito ao leitor de eventos.
3. Exportação autorizada não passa a exigir leitura de jobs.
4. Identificador inválido ou inexistente produz a resposta segura existente.

### Edge Cases

Permissão revogada, somente exportação, somente reenvio, evento sem acesso a jobs, jobs sem acesso a
eventos, prefixo de rota parecido com área, registro ausente e falha de processamento.

### US3 — Evolução da consulta e do reenvio (P2)

Operador autorizado consulta execuções além das 100 mais recentes, filtra por estado/tipo e reenvia
somente se também puder ler o processamento. Teste independente: mais de 100 execuções sintéticas
com datas empatadas; percorrer páginas sem repetição e negar reenvio sem leitura antes de qualquer
mudança persistida.

**Acceptance Scenarios**:

1. Próxima página mantém os filtros e permite alcançar uma execução antiga.
2. Paginação possui ordenação estável e não repete registros em um conjunto sem alterações.
3. Perfil somente de reenvio recebe negação sem enfileirar trabalho nem alterar a execução.
4. Perfil com leitura e reenvio mantém o fluxo autorizado com justificativa.

## Requirements

### Functional Requirements

- **FR-001**: Uma entrada Auditoria nas três superfícies de descoberta.
- **FR-002**: Eventos e Processamentos visíveis somente conforme a autorização específica.
- **FR-003**: Destino principal acessível ao perfil; usuário apenas de jobs não precisa abrir
  eventos.
- **FR-004**: Preservar consulta/exportação de eventos, lista/detalhe/reenvio de jobs e registros
  existentes.
- **FR-005**: Preservar endereços anteriores por redirecionamento.
- **FR-006**: Navegação possui nomes acessíveis, indicação da subárea atual e funciona por teclado.
- **FR-007**: Serviços continuam autorizando cada consulta/comando; menu não é controle de
  segurança.
- **FR-008**: Consulta de processamentos permite paginação e filtros por estado e tipo.
- **FR-009**: Reenvio verifica leitura e permissão de reenvio antes de qualquer mutação.

### Key Entities

Área de navegação, subárea, permissão, evento, processamento e exportação existentes. Não há novo
cadastro nem fusão de eventos com execuções.

## Success Criteria

- **SC-001**: Exatamente uma entrada consolidada para perfis autorizados e zero para quem não tem
  acesso.
- **SC-002**: Os quatro perfis dos cenários passam nas consultas/navegação sem privilégio adicional.
- **SC-003**: Todos os endereços anteriores testados mantêm acesso ao registro correspondente.
- **SC-004**: Reenvio/exportação existentes e acessibilidade das áreas afetadas passam nas
  regressões.
- **SC-005**: Na US3, alcançar todos os registros de um conjunto com mais de 100 execuções sem
  repetição e negar 100% dos reenvios sem leitura antes de qualquer efeito persistido.

## Assumptions

Reutilizar serviços/persistência/permissões atuais. Sem migração ou mudança institucional ou
validação manual repetida do PR #10. Paginação/filtros de jobs e ajuste da pré-condição do reenvio
são evoluções desta função, registradas neste mesmo spec conforme instrução de 09/09/2026. Ainda não
foram implementadas; não invalidam nem repetem a evidência da fusão já concluída.
