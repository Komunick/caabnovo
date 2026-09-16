# Feature Specification: Auditoria e Processamentos

**Feature Branch**: `feature/processamentos-20260915` (US3; histórico da fusão preservado)

**Created**: 2026-09-09

**Status**: Fusão entregue; US3 implementada e validada no CI em 15/09/2026.

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
2. Reenvio exige leitura e permissão de reenvio, sem justificativa; a fusão não concede esse direito ao leitor de eventos.
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
4. Perfil com leitura e reenvio mantém o fluxo autorizado sem justificativa obrigatória.
5. Filtros combinados reiniciam a consulta; próxima página e primeira página preservam os filtros.
6. URL inválida mostra aviso recuperável; consulta vazia informa ausência de resultados.
7. Tipos conhecidos aparecem em português, incluindo sugestões digitáveis; tipos históricos continuam consultáveis por seu nome exato.
8. Reenvios concorrentes geram somente um enfileiramento/auditoria; falha de fila desfaz a alteração, e limite de tentativas permanece.

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
são evoluções desta função, registradas neste mesmo spec conforme instrução de 09/09/2026.
Implementadas na US3 de 15/09; sua evidência complementa a fusão já concluída.


## Regra vigente: nenhuma justificativa obrigatória — 14/09/2026

Decisão final do usuário: remover os campos de motivo/justificativa de todas as abas e sua obrigatoriedade no servidor. Abrange criação, edição, publicação, retirada, recuperação, arquivamento, acessos, situações, documentos, avaliações, configurações, exportações e reenvios. Esta decisão substitui as exigências anteriores, inclusive as exceções de primeira criação/publicação. Auditoria preserva ator, ação, data e alterações, sem inventar explicação humana. Dados históricos de motivo permanecem legíveis. Campos operacionais (fonte, resultado, condições e vigência), permissões, autenticação, concorrência e confirmação de ações permanecem. Aceite: jornadas funcionam sem preencher ou enviar motivo; nenhum controle de justificativa aparece na interface. Agendamentos continua somente em pesquisa e OAB-BA permanece pendente da hospedagem.

## Retirada do armazenamento legado — 15/09/2026

Exportações usam exclusivamente stored_file_content no PostgreSQL, com bytes e metadados na mesma transação; preservam idempotência, redação e autorização. Não há upload S3.

## US4 — Auditoria em linguagem simples (T014, 15/09/2026)

A leitura principal deve informar quem fez a ação, o que mudou e quem foi afetado em português. Exemplo: “Gabriel removeu o perfil de Administrador de Felipe”. Códigos, identificadores e snapshots continuam disponíveis em detalhes técnicos; registros e exportações permanecem originais, com a redação existente.

Nomes atuais de colaboradores exigem users:read; nomes de perfis exigem roles:read. A tela explica que os nomes consultados são atuais, não uma reconstrução histórica. Ausência de nome ou permissão produz indicação neutra, sem atribuir autoria ao sistema quando o ator é desconhecido. Enriquecer a identificação do alvo com nome do associado/convênio, título da notícia e nome do arquivo somente sob leitura da área; arquivos também exigem files:read e leitura da área proprietária. Consultar somente nome/título e revalidar sessão/permissões atuais; não copiar contato ou documento pessoal. Eventos sem tradução específica recebem descrição neutra e detalhes completos.

Aceite: concessão/remoção de perfis, criação/alteração/desativação de colaboradores e demais ações conhecidas têm descrições em português; mudanças de campos reconhecidos são explicadas; filtros de ação e tipo oferecem rótulos em português preservando valores técnicos e links antigos. Testes cobrem permissões, nomes ausentes, eventos antigos/desconhecidos, imutabilidade, filtros, teclado, celular e acessibilidade.
## US4 revisada — histórico de atividades, 15/09/2026

A revisão inicial de T014 foi rejeitada pelo usuário. Reformular a interface com base na pesquisa registrada: histórico por data, frases com autoria e alvo, horário e área identificáveis sem códigos; filtros diretos por pessoa, área, ação e período. A consulta de pessoas exige audit:read e users:read, usa nomes atuais e deve alcançar resultados além da primeira página. Perfis sem leitura de colaboradores mantêm consulta dos eventos sem expor o catálogo de nomes.

Selecionar um evento abre painel lateral (tela cheia no celular), com resumo legível, valores anteriores/novos para mudanças reconhecidas e dados técnicos recolhidos. Fechar com Escape devolve foco à linha e preserva filtros/posição. A lista mostra a quantidade da página, nunca um total global não consultado. Códigos desconhecidos e registros antigos continuam acessíveis. Sem mudanças no armazenamento original e no JSONL exportado.
### Esclarecimento decisivo do usuário — 15/09/2026

O principal problema é a leitura em forma de código. **Também os detalhes devem ser uma versão humana e mais completa do registro.** Códigos/IDs/JSON aparecem somente em último caso, numa seção “Informações para suporte” recolhida dentro do painel de detalhes. O primeiro nível do detalhe mostra quem/quando/onde/alvo e informações específicas da ação com antes/depois. Traduzir situações, perfis, permissões, formatos de arquivo, canais, prazos, resultados e versões presentes; não expor chaves desconhecidas como rótulos nem valores de enum sem tradução. Ausência de dados históricos deve ser informada claramente, sem completar fatos a partir do estado atual. Preservar redação/permissões e valores originais para suporte.

Pedido adicional: filtros de área e ação permitem digitar e selecionar, seguindo o input/datalist
do campo Estado de Parceiros. Opções mostram somente português; códigos ficam no contrato/URL.
Aceitar rótulos completos sem distinguir acentos/maiúsculas, impedir aplicação de texto sem
correspondência e permitir limpar o campo. Busca por pessoa também permite digitação e seleção,
com paginação no servidor e autorização própria.

## Sobreposição dos detalhes — 16/09/2026

AD-F01 Ao abrir um log, todo o shell, inclusive Portal Administrativo/Auditoria e navegação móvel, deve ficar atrás do fundo escurecido. O painel de detalhes permanece acima desse fundo, com foco contido e retorno ao acionador ao fechar. Validar desktop/celular, claro/escuro e posição de pintura real no cabeçalho.


## Edições durante navegação — decisão de 16/09/2026

- Preservar campos, seleções e alterações pendentes ao consultar outra aba ou módulo e voltar,
  separados por formulário e registro, sem gravação automática no servidor.
- Salvar com sucesso, cancelar/descartar explicitamente ou encerrar a sessão encerra a edição.
  Falhas de validação/rede conservam os dados; manter as proteções de versão/autorização.
- Compartilhar a infraestrutura do painel e validar ida/volta, sem misturar registros ou usuários.
