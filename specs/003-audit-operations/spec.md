# Feature Specification: Auditoria e Processamentos

## Checkpoint de revisão de código — 21/09/2026

Eventos/Processamentos e reenvio existem. Exportação atual é JSONL por fila, não Excel/CSV/PDF direto. Worker não revalida permissões; download genérico de audit_export passa com files:read. EX01/EX02 devem fechar esses caminhos além da migração para permissão geral; DX01/DX02 permanecem pendentes.

Revisão estática da base `ed31baf`; nenhum teste de aplicação ou homologação nesta etapa.
Evidências e limites: [revisão transversal](../002-integrated-modules/code-audit-2026-09-21.md).

**Feature Branch**: `feature/processamentos-20260915` (US3; histórico da fusão preservado)

**Created**: 2026-09-09

**Status**: Fusão entregue; US3 implementada e validada no CI em 15/09/2026.

**Input**: Fundir Operações com Auditoria; um spec próprio para cada nova funcionalidade.
**Programa**: [Módulos integrados](../002-integrated-modules/plan.md), US1/T005–T011.

## Clarifications

### Session 2026-09-21

- Q: Quem poderá baixar/exportar dados em cada módulo? → A: Uma permissão geral de exportação, combinada com o acesso aos módulos. Quem só acessa Associados e Colaboradores só pode exportar esses módulos; a permissão não concede acesso a outros.

- Q: Quem já possui uma permissão antiga de exportação deve receber automaticamente a nova permissão geral? → A: Sim (B). Converter automaticamente quem já possui alguma permissão de exportação, mantendo acesso restrito aos módulos/dados autorizados. Segundo o usuário, atualmente só existem as contas de teste dele e do agente; não foi realizada auditoria de contas neste clarify.

- Q: Por quanto tempo os arquivos de exportação devem ficar disponíveis para baixar novamente? → A: Substituir essa jornada por download direto, sem prazo ou limite de exportação. Clicar em “Exportar [módulo]” abre tela de filtros (data, ordenação, ações, áreas, nomes e outros pertinentes); escolher Excel, CSV ou PDF inicia o download diretamente. Exportar todos os resultados autorizados dos filtros, sem limitar à página, quantidade de registros ou duração do período. Não exigir fila, histórico de arquivos ou retorno posterior para baixar.

- Q: Na tela de exportação, a pessoa poderá escolher quais colunas aparecerão no arquivo? → A: Sim (A), permitir selecionar e ordenar as colunas autorizadas, com uma seleção inicial adequada ao módulo, nos três formatos Excel, CSV e PDF.

Checkpoint de 21/09/2026: Q7 registrada; seleção e ordem de colunas pendentes de implementação/validação. Estado das demais decisões: decisões de acesso e exportação registradas, incluindo
conversão automática e download direto Excel/CSV/PDF como padrão obrigatório.
Adequação de código e validação permanecem pendentes; nenhum teste ou homologação
foi concluído por este registro.

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
3. Exportação de eventos exige permissão geral de exportação e leitura de eventos;
   não exige leitura de jobs. Somente a permissão geral não concede acesso à área.
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
- **FR-010**: Exportar exige a permissão geral de exportação e leitura da subárea/dados
  correspondentes, sem uma permissão de exportação exclusiva de Auditoria. Revalidar
  na solicitação, geração e download; não ampliar consulta de eventos ou jobs.
  Quem possui a permissão antiga de exportação recebe automaticamente a geral,
  conforme a conversão transversal definida em 001/002; leitura permanece inalterada.

- **FR-011**: “Exportar Auditoria” abre filtros de período, ordenação, ações, áreas,
  nomes e demais critérios pertinentes à subárea autorizada. Permitir selecionar e
  ordenar as colunas autorizadas; os três formatos respeitam essa seleção e ordem.
  Excel/CSV/PDF iniciam
  download direto de todos os resultados autorizados, sem teto funcional de registros
  ou período, sem prazo ou histórico obrigatório de download. Preservar redação e
  integridade dos eventos; arquivos não expõem dados além da consulta autorizada.

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

- **SC-006**: Filtros da exportação correspondem ao arquivo completo em Excel/CSV/PDF,
  além da paginação, com seleção e ordem de colunas iguais nos três formatos; campos
  restritos são recusados. Escolha de formato inicia download direto. Falhas preservam os
  filtros; sem permissão ou subárea autorizada, não há exportação de dados.

## Assumptions

Na fusão original, reutilizar serviços/persistência/permissões atuais. Sem migração ou mudança institucional ou
validação manual repetida do PR #10. Paginação/filtros de jobs e ajuste da pré-condição do reenvio
são evoluções desta função, registradas neste mesmo spec conforme instrução de 09/09/2026.
Implementadas na US3 de 15/09; sua evidência complementa a fusão já concluída.


## Regra vigente: nenhuma justificativa obrigatória — 14/09/2026

Decisão final do usuário: remover os campos de motivo/justificativa de todas as abas e sua obrigatoriedade no servidor. Abrange criação, edição, publicação, retirada, recuperação, arquivamento, acessos, situações, documentos, avaliações, configurações, exportações e reenvios. Esta decisão substitui as exigências anteriores, inclusive as exceções de primeira criação/publicação. Auditoria preserva ator, ação, data e alterações, sem inventar explicação humana. Dados históricos de motivo permanecem legíveis. Campos operacionais (fonte, resultado, condições e vigência), permissões, autenticação, concorrência e confirmação de ações permanecem. Aceite: jornadas funcionam sem preencher ou enviar motivo; nenhum controle de justificativa aparece na interface. Agendamentos possui primeira versão administrativa (spec 008), com app/site e expansões pendentes; OAB-BA permanece pendente da hospedagem.

## Retirada do armazenamento legado — 15/09/2026

Exportações usam exclusivamente stored_file_content no PostgreSQL, com bytes e metadados na mesma transação; preservam idempotência, redação e autorização. Não há upload S3.

## US4 — Auditoria em linguagem simples (T014, 15/09/2026)

A leitura principal deve informar quem fez a ação, o que mudou e quem foi afetado em português. Exemplo: “Gabriel removeu o perfil de Administrador de Felipe”. Códigos, identificadores e snapshots continuam disponíveis em detalhes técnicos; registros e exportações permanecem originais, com a redação existente.

Nomes atuais de colaboradores exigem users:read; nomes de perfis exigem roles:read. A tela explica que os nomes consultados são atuais, não uma reconstrução histórica. Ausência de nome ou permissão produz indicação neutra, sem atribuir autoria ao sistema quando o ator é desconhecido. Enriquecer a identificação do alvo com nome do associado/convênio, título da notícia e nome do arquivo somente sob leitura da área; arquivos também exigem files:read e leitura da área proprietária. Consultar somente nome/título e revalidar sessão/permissões atuais; não copiar contato ou documento pessoal. Eventos sem tradução específica recebem descrição neutra e detalhes completos.

Aceite: concessão/remoção de perfis, criação/alteração/desativação de colaboradores e demais ações conhecidas têm descrições em português; mudanças de campos reconhecidos são explicadas; filtros de ação e tipo oferecem rótulos em português preservando valores técnicos e links antigos. Testes cobrem permissões, nomes ausentes, eventos antigos/desconhecidos, imutabilidade, filtros, teclado, celular e acessibilidade.
## US4 revisada — histórico de atividades, 15/09/2026

A revisão inicial de T014 foi rejeitada pelo usuário. Reformular a interface com base na pesquisa registrada: histórico por data, frases com autoria e alvo, horário e área identificáveis sem códigos; filtros diretos por pessoa, área, ação e período. A consulta de pessoas exige audit:read e users:read, usa nomes atuais e deve alcançar resultados além da primeira página. Perfis sem leitura de colaboradores mantêm consulta dos eventos sem expor o catálogo de nomes.

Selecionar um evento abre painel lateral (tela cheia no celular), com resumo legível, valores anteriores/novos para mudanças reconhecidas e dados técnicos recolhidos. Fechar com Escape devolve foco à linha e preserva filtros/posição. A lista mostra a quantidade da página, nunca um total global não consultado. Códigos desconhecidos e registros antigos continuam acessíveis. No incremento de leitura descrito acima, armazenamento original e JSONL foram
preservados. Q6 de 21/09 redefine o fluxo e os formatos alvo de exportação em FR-011;
a integridade dos eventos originais continua preservada.
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


### US5 — Exportar dados autorizados (Priority: P2)

O operador com permissão geral de exportação e consulta da função abre
“Exportar Auditoria e Processamentos”, ajusta filtros,
seleciona/reordena colunas e escolhe Excel, CSV ou PDF para download direto.
Abrange dados/abas consultáveis da função, sem teto funcional de registros/período,
sem prazo de arquivo nem fila/histórico obrigatório. Não exportar bytes de anexos,
segredos ou campos sem autorização.

Teste independente: Perfis só eventos e só jobs exportam apenas sua subárea; matriz geral+leitura; campos redigidos e colunas reordenadas nos três formatos; downloads legados continuam protegidos.
Em erro, manter filtros/colunas; três formatos preservam conjunto e ordem escolhidos.
Campos restritos enviados diretamente são recusados no servidor. Este detalhamento
aplica o padrão transversal já decidido, sem implementação ou nova homologação.


Checkpoint de 21/09/2026 — plan concluído: desenho, pesquisa, modelo, contratos e
roteiro atualizados. Nenhum código, serviço, migration ou teste de aplicação executado.
Tarefas serão detalhadas em seguida; políticas e funções adiadas permanecem pendentes.

Checkpoint de 21/09/2026 — tasks concluídas: 8 tarefas novas (T015–T022), com histórias, dependências, caminhos e aceite; nenhuma implementação/teste de aplicação executado. Ver tasks.md.

Checkpoint final de21/09/2026 — plan seguido de tasks encerrados. Conferência
documental de IDs, fases, links e preservação do histórico concluída; código,
testes de aplicação e homologações não executados. Próximo passo recomendado:
análise cruzada antes da implementação. Detalhes no relatório do programa002.

Checkpoint D1 — 21/09/2026: identificador de exportação corrigido para US5; US4 continua histórico de atividades em linguagem simples. T018–T021 e plano atualizados, sem renumerar tarefas nem alterar evidências históricas.
