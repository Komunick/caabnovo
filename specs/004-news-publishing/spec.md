# Feature Specification: Notícias e publicação editorial

## Checkpoint de revisão de código — 21/09/2026

Editor, mídia, publicação, rotas públicas e permissões web separadas existem. Worker de publicação não consulta concessões do solicitante; AC02/AC03 devem cobrir revogação com conta ativa. Início ainda renderiza notícias sem news:read. T027 exige só a evidência HTTP específica, não repetir como ausente a jornada UI comprovada. Exportação própria DX01 pendente; erros de editor coordenados em 001 T097.

Revisão estática da base `ed31baf`; nenhum teste de aplicação ou homologação nesta etapa.
Evidências e limites: [revisão transversal](../002-integrated-modules/code-audit-2026-09-21.md).

**Feature Branch**: `feature/news-publishing` **Created**: 2026-09-09 **Status**: Função completa implementada e validada. **Input**: Criar
o spec e iniciar Notícias com pesquisa atual de mercado; atualizações futuras permanecem neste spec.
Programa: [002/US2](../002-integrated-modules/spec.md).

## Clarifications

### Session 2026-09-21

- Q: Notícias e Agendamentos também devem exigir permissão de acesso por usuário? → A: Sim (A), exigir acesso concedido também a Notícias e Agendamentos. Substitui a liberação automática para qualquer conta administrativa; sem acesso, ocultar o módulo na barra lateral, busca e Início e negar rotas/ações privadas.

- Q: Em Notícias e Agendamentos, o acesso concedido deve liberar todas as operações ou separar consulta e alteração? → A: Separar consultar e alterar (B), preservando o padrão existente indicado pelo usuário; não unificar as permissões. Permissões adicionais já existentes, como publicar Notícias, permanecem.

Checkpoint de 21/09/2026: Q9 preserva consulta/alteração separadas. Notícias já possui controles no código; documentação corrigida. Agendamentos apresenta lacuna de autorização (ver planos/tarefas). Nenhum teste de aplicação executado. Registros anteriores: FR-004/cenários/contratos atualizados; AC01–AC03 pendentes.
Nenhuma permissão concedida, código alterado ou teste executado. Leitura pública
de notícias publicadas preservada; acesso editorial exige concessões próprias já
encontradas no código, cuja separação será preservada (Q9).

## User Scenarios & Testing

### US1 — Preparar e recuperar uma notícia (P1)

Pessoa com acesso autorizado ao painel cria, edita, duplica e arquiva notícias, salva rascunhos
incompletos e recupera versões sem perder alterações de outra pessoa. Prioridade: estabelecer a
jornada editorial antes da distribuição. Teste independente: criar rascunho incompleto, reabrir,
completar, editar em duas sessões e recuperar uma versão anterior como novo rascunho. Testes
automatizados de contratos e concorrência obrigatórios.

**Acceptance Scenarios**:

1. Rascunho aceita título/resumo vazios; campos inválidos ou desconhecidos são rejeitados.
2. Salvar preserva autoria, data e histórico; uma edição desatualizada gera conflito sem
   sobrescrever.
3. Duplicar produz novo rascunho, sem publicação nem agendamento herdados.
4. Arquivar preserva histórico e retira a notícia dos canais; recuperar versão não publica
   automaticamente.
5. Sessão ausente, expirada ou conta desativada não acessa nem altera notícias.

### US2 — Conferir e publicar (P1)

Pessoa autorizada ao painel confere a prévia e publica diretamente no app, site ou ambos.
Prioridade: tornar o conteúdo disponível sem publicar mudanças ainda em elaboração. Teste
independente: publicar uma revisão, editar o rascunho e confirmar que o público ainda recebe a
revisão publicada. Cobrir conteúdo ativo malicioso, arquivos indisponíveis e sessão revogada.

**Acceptance Scenarios**:

1. Consulta exige sessão administrativa e permissão de consultar Notícias. Criar/editar
   exige também alteração; publicar/programar/arquivar preserva a permissão adicional
   existente de publicação. Conta somente de consulta não altera nem publica. Sem
   consulta, ocultar barra lateral/busca/Início e negar URL/API privados. Não introduzir
   segunda aprovação editorial.
2. Publicar exige título, endereço legível, conteúdo com texto ou mídia válida e ao menos um canal.
3. Prévia identifica rascunho e canal, exige acesso concedido a Notícias e não é indexável/publicamente
   cacheada.
4. Imagens exigem descrição acessível e arquivo liberado pela verificação existente.
5. Em notícias publicadas, substituir “Salvar rascunho” por “Retirar publicação e salvar rascunho”: retirar todos os destinos e salvar a revisão numa única transação. A preparação interna de uma publicação/agendamento preserva a versão pública até a ação explícita.
6. A publicação registra responsável, revisão e destinos na auditoria, sem copiar o corpo completo.

### US3 — Programar e acompanhar distribuição (P2)

Pessoa autorizada programa publicação/retirada, cancela ações futuras e acompanha o processamento e a disponibilidade por canal.
Prioridade: previsibilidade editorial e recuperação de falhas. Teste independente: executar a mesma ação três vezes, simular falha de mídia e repetir a ação após corrigir a causa, sem publicação duplicada nem troca silenciosa de revisão. Site e app consultam a publicação por API; falha de consulta de um consumidor não altera o outro.

**Acceptance Scenarios**:

1. Agendamento mostra data, fuso, ação, revisão e destinos; rejeita datas passadas ou retirada
   anterior à publicação.
2. Edição posterior não altera silenciosamente a revisão agendada; cancelamento impede execução
   pendente.
3. Publicação e consumo são distintos: o painel informa disponibilidade para consulta por canal, sem presumir recebimento pelo app/site. Indisponibilidade de um consumidor não altera a publicação disponível ao outro.
4. Job revalida cancelamento, acesso do responsável e arquivos; retries são idempotentes e
   auditados.

### Edge Cases

Título só com espaços, endereço duplicado, edição concorrente, revisão excluída/arquivada, HTML
ativo, URL de embed não autorizada, arquivo pendente/infectado/removido, sessão revogada,
agendamento no limite do horário, worker repetido, canal sem integração e indisponibilidade parcial
do consumidor.

## Requirements

### Functional Requirements

- **FR-001**: Manter cadastro único de notícias com título, resumo, endereço legível, conteúdo rico,
  capa, categoria, tags, autor, revisões e destinos; destaques/slides referenciam esse conteúdo.
  Marcar destaque e definir ordem de 1 a 100 integra a revisão da notícia; empates usam publicação
  mais recente. Destaque herda capa e destinos e só muda publicamente após publicar. Duplicação
  remove destaque. Não há cadastro paralelo nem cópia de conteúdo para slides.
- **FR-002**: Criar/editar/duplicar/arquivar e recuperar versões conforme US1, sem exclusão do
  histórico.
- **FR-003**: Permitir rascunho incompleto; distinguir erros de estrutura de pendências para
  publicar.
- **FR-004**: Exigir sessão administrativa válida e acesso concedido a Notícias,
  revalidado no servidor em consultas, prévias, comandos e execução de ações
  programadas. Sem concessão, ocultar da barra lateral, busca e Início e negar
  acesso privado por URL/API. Decisão Q8 de 21/09/2026 substitui a exceção de 09/09;
  não introduz segunda aprovação editorial nem altera a leitura pública autorizada.
  Q9 mantém consultar e alterar separadamente; preserva também a permissão existente
  de publicar. Alterar exige consultar; publicar mantém seus pré-requisitos. Somente
  consulta não autoriza criação, edição, publicação, programação ou arquivamento.
- **FR-005**: Preservar a versão publicada enquanto outra revisão está em elaboração. Para salvar manualmente como rascunho, a ação deve explicitar a retirada da publicação e executá-la junto com o salvamento; notícias sem publicação mantêm “Salvar rascunho”.
- **FR-006**: Prévia e publicação aceitam somente conteúdo sem código ativo e mídias verificadas;
  embeds dependem de provedores explicitamente permitidos.
  Imagens no corpo têm descrição, legenda opcional e ordem editável; remoção preserva arquivos e
  histórico. Recuperação restaura as referências; duplicação preserva texto e remove imagens da
  notícia original. A descrição pode ficar pendente no rascunho, mas é obrigatória ao publicar.
- **FR-007**: Publicar em app/site/ambos e registrar revisão, autor da ação, data e destinos.
  Destino app é o aplicativo mobile; nenhum canal implica exposição automática no outro ou envio
  de push. Contratos dos consumidores devem separar conteúdo publicado de dados administrativos.
- **FR-008**: Agendar/cancelar publicação e retirada por revisão, com fuso visível e execução
  idempotente.
- **FR-009**: Exibir disponibilidade pública por destino e estado/tentativas/falha explicável das
  ações agendadas, com nova tentativa reaproveitando Processamentos. No transporte por consulta,
  não declarar recebimento pelo consumidor nem criar entrega fictícia por canal.
- **FR-010**: Impedir sobrescrita concorrente, duplicação por retry e acesso público a rascunhos.
- **FR-011**: Editor e gestão funcionam por teclado, com foco, mensagens e nomes acessíveis.
- **FR-012**: Erros de preenchimento/formatação aparecem junto do campo correspondente, com
  contorno vermelho, dica específica em português e associação acessível. A tentativa de salvar,
  publicar ou agendar leva o foco ao primeiro campo inválido; corrigir o campo remove sua indicação.
  O resumo geral não substitui mensagens locais. Erros do servidor seguem a mesma apresentação;
  conflito de versão e falha de conexão preservam o texto sem marcar campos válidos como inválidos.

- **FR-013**: A listagem mostra miniatura da capa (ou indicação de ausência/indisponibilidade),
  título e resumo com no máximo duas linhas. O número de revisão fica no editor/histórico e na
  prévia, sem coluna na listagem. Miniaturas respeitam o acesso privado de mídia existente.
- **FR-014**: Busca por título aplica automaticamente após breve pausa na digitação; filtros
  de arquivamento aplicam imediatamente, sem botão Filtrar. Mudanças reiniciam a paginação,
  preservam foco e sincronizam a URL. Permitir limpar filtros e tentar novamente em falhas,
  evitando que respostas antigas substituam resultados da busca mais recente.
- **FR-015**: Ações em todas as telas de Notícias têm aparência de botão, incluindo os links
  de retorno e prévia: fundo/contorno visível, foco, hover e estado desabilitado distinguíveis.
  Ações principais, secundárias e destrutivas mantêm hierarquia visual; layout funciona no celular.
  Botões têm preenchimento distinto do fundo, borda marcada e altura mínima de 44px, com contraste
  verificado nos temas claro e escuro. O editor aguarda estar interativo antes de liberar os campos,
  evitando perder a primeira digitação durante o carregamento inicial.
- **FR-016**: Busca e arquivamento são mantidos. Acrescentar categoria, destino previsto
  (app/site), destaque, presença de capa, atualização nos últimos 7/30/90 dias e ordenação
  por atualização/criação crescente ou decrescente e título A–Z/Z–A. Combinar filtros no banco
  antes de paginar; URL, limpeza e indicação de carregamento preservam o conjunto selecionado.
- **FR-017**: `/news` exibe a versão efetivamente publicada, inclusive nos filtros e na
  ordenação, usando a mesma origem da inicial. `/news/drafts` contém a última revisão das
  notícias ativas sem publicação vigente, inclusive retiradas. Arquivadas mantêm a localização
  histórica anterior, acessível pelo filtro Exibir, preservando a gestão já aceita.
  Uma edição privada não altera a lista Publicadas nem duplica seu cadastro em Rascunhos.
  Agendados ainda não publicados continuam nos rascunhos até a execução da publicação.
- **FR-018**: Compactar espaçamento superior e cabeçalho. Busca e arquivamento permanecem
  visíveis; filtros adicionais e ordenação ficam em uma área expansível, sem botão de aplicação.
  A primeira linha deve começar antes de 450px no desktop de teste, sem rolagem horizontal no celular.

Refinamento editorial solicitado em 09/09/2026:

- **FR-019**: Separar visualmente escrita, capa e configurações; manter salvar e prévia em
  posição clara. Ações de publicação e histórico recebem áreas próprias, sem competir com o corpo.
  Campos de texto, incluindo o corpo, devem ter fundo distinto e bordas visíveis em ambos os
  temas; preservar o foco e o contorno vermelho de erro. Não depender de reticências para indicar edição.
- **FR-020**: Barra de texto compacta com ícones, nomes acessíveis, atalhos, estilos ativos,
  parágrafo/títulos, listas, alinhamento, desfazer/refazer e limpeza de formatação. Preservar
  seleção, texto, histórico e a gramática segura existente; tipografia deve ser consistente na leitura.
  Usar convenções familiares de Word/Outlook com desenho próprio: negrito, itálico, sublinhado,
  tachado e grupos de ferramentas. Não reproduzir interface, marcas ou recursos gráficos desses produtos.
- **FR-021**: Inserir imagens por envio/arrastar ou biblioteca visual com miniaturas, seleção
  evidente, estado de verificação e descrição. Inserção no ponto de edição, preservando o texto;
  capa e imagens do corpo têm propósitos claros. Não substituir a verificação do antivírus.
- **FR-022**: Prévia privada moderna com Site, Mobile e Lado a lado por botões acessíveis.
  Compartilhar a apresentação da notícia com a página pública deste projeto. Exibir título,
  resumo, capa, corpo e legendas responsivos. Salvar e visualizar deve incluir a última edição,
  sem publicar. A simulação mobile não presume a implementação de um app nativo externo.
- **FR-023**: Gerar endereço automaticamente do título, normalizado e limitado a 80 caracteres,
  com sufixo curto para diferenciar títulos iguais. Preservar o endereço de notícias já salvas.
  Personalização é opcional atrás da pergunta “Quer personalizar o endereço?”. Erros nesse campo
  abrem a opção e recebem foco. Não exigir preenchimento manual para salvar/publicar.

- **FR-024**: Permitir enviar capa e inserir imagens no corpo desde a criação, inclusive antes
  do título, sem exigir clique em Salvar rascunho. Registrar a notícia privada em segundo plano
  quando o envio precisar de vínculo, preservando texto e seleção sem navegar durante o upload.
  Publicar/agendar salva o conteúdo atual no mesmo fluxo, inclusive em notícia nova. Falha de
  gravação impede a publicação e mantém a edição; imagens continuam sujeitas à verificação.

### Key Entities

Notícia; revisão editorial; referência de mídia; destaque na revisão; ação agendada; disponibilidade por canal. Contas,
sessões, arquivos e eventos de auditoria continuam pertencendo à fundação existente.

## Success Criteria

### Measurable Outcomes

- **SC-001**: Criar, salvar e reabrir rascunho em até 2 minutos no cenário de homologação.
- **SC-002**: Nenhum rascunho vaza nem sobrescreve publicação nos testes de edição/consulta
  simultâneas.
- **SC-003**: Todos os cenários de acesso negado, mídia inválida e conflito falham sem
  mudança pública. Conta administrativa sem acesso a Notícias não vê entradas do
  módulo nem acessa dados privados por URL/API; revogação impede a próxima ação
  protegida, inclusive publicação programada. Perfil somente de consulta não altera;
  perfil com alteração, mas sem publicar, não publica/programa/arquiva. Leitura pública
  publicada permanece.
- **SC-004**: Repetir uma ação agendada três vezes produz um único efeito por revisão/destino.
- **SC-005**: Jornada completa por teclado sem falhas críticas de acessibilidade automatizada.

## Assumptions

- Este spec inclui a função editorial completa no painel, API de leitura e página pública.
- **Decisão do usuário em 09/09/2026**: qualquer pessoa pode ler notícias publicadas, inclusive
  as destinadas ao mobile. Regra revisável neste mesmo spec. Rascunhos, histórico, agenda e
  escrita exigem sessão ativa do painel e acesso concedido a Notícias.
- Q8 de 21/09/2026: sessão administrativa sozinha não concede Notícias. A gestão
  de acesso existente concede/revoga o módulo; preservar credenciais e os demais
  controles. MFA permanece removido conforme decisão vigente do projeto.
- App e site consultam a API pública v1 no mesmo ambiente do painel. Este repositório entrega
  o conteúdo e sua página pública; não contém o código do aplicativo mobile nem do site externo.
  Não é necessária credencial de leitura nesta fase. Não enviar push nem confirmar consumo
  externo sem evidência. Não consultar o legado.
- Vídeos/embeds permanecem indisponíveis até definir provedores permitidos. Isso não impede texto,
  rascunhos e implementação das imagens usando as regras de arquivo existentes.
- Agenda aceita horários futuros dentro de 365 dias. Retirada referencia uma publicação já
  existente; não se agenda retirada de rascunho ainda não publicado. Nova publicação invalida
  uma retirada da publicação anterior. Edição de rascunho não a invalida. Fuso visível: Brasília.
- Mídia já assinada pode permanecer acessível até expirar a URL (máximo 300 segundos); novas
  consultas revalidam publicação e disponibilidade.
- Limites técnicos iniciais de tamanho e fuso seguem plano, revisáveis neste mesmo spec.
- Mudanças de Notícias atualizam estes artefatos; função nova de outro domínio recebe outro spec.

## Correção de origem atrás de proxy — 10/09/2026

Salvar rascunhos e enviar imagens deve aceitar a origem pública configurada em
`BETTER_AUTH_URL`, mesmo quando o proxy entrega uma URL interna ao Next.js. Outras origens,
origem ausente e tokens CSRF ausentes continuam bloqueados. Cabeçalhos Host/Forwarded não
definem a origem confiável; em produção, configuração pública ausente ou inválida bloqueia a ação.

## Justificativas de criação e alteração — 14/09/2026

A regra intermediária que dispensava motivo somente na criação foi substituída
pela decisão final de 14/09/2026: nenhuma ação exige campo de motivo ou
justificativa. Preservar autor, data, alterações e motivos históricos existentes,
além de autorização, confirmação, idempotência e controle de versão.
Aceite vigente: criar e alterar sem preencher/enviar motivo, sem esse controle
na interface. Não apagar dados históricos nem inventar explicação humana.

## Descrição opcional da capa — 14/09/2026

Decisão posterior do usuário: descrever a capa é opcional. Salvar, pré-visualizar,
publicar e agendar publicação aceitam capa com descrição ausente ou vazia. Quando
fornecida, continua limitada a 500 caracteres e é preservada na apresentação.
A interface informa a opcionalidade e recomenda descrever informação relevante.
Sem descrição, renderizar `alt=""`, sem inventar uma descrição ou anunciar erro.
Esta decisão substitui a exigência anterior apenas para a capa; não altera imagens
inseridas no corpo, verificação dos arquivos, autorização ou propriedade da mídia.


## Regra vigente: nenhuma justificativa obrigatória — 14/09/2026

Decisão final do usuário: remover os campos de motivo/justificativa de todas as abas e sua obrigatoriedade no servidor. Abrange criação, edição, publicação, retirada, recuperação, arquivamento, acessos, situações, documentos, avaliações, configurações, exportações e reenvios. Esta decisão substitui as exigências anteriores, inclusive as exceções de primeira criação/publicação. Auditoria preserva ator, ação, data e alterações, sem inventar explicação humana. Dados históricos de motivo permanecem legíveis. Campos operacionais (fonte, resultado, condições e vigência), permissões, autenticação, concorrência e confirmação de ações permanecem. Aceite: jornadas funcionam sem preencher ou enviar motivo; nenhum controle de justificativa aparece na interface. Agendamentos possui primeira versão administrativa (spec 008), com app/site e expansões pendentes; OAB-BA permanece pendente da hospedagem.


Refinamento solicitado pelo usuário em 16/09/2026:

- **NP-01**: A retirada junto do salvamento compara a revisão editorial e a publicada sob
  bloqueio da notícia; falha de validação, concorrência ou auditoria desfaz toda a operação.
- **NP-02**: Retirar e salvar cancela agendamentos pendentes da notícia na mesma transação,
  para que uma publicação programada não a publique novamente. Explicar esse efeito no editor.
- **NP-03**: Após sucesso, o texto salvo fica em Rascunhos e a notícia sai das publicações da inicial, da aba Publicadas
  e dos consumidores públicos. Histórico e auditoria são preservados; erro mantém o texto no editor.


## Edições durante navegação — decisão de 16/09/2026

- Preservar campos, seleções e alterações pendentes ao consultar outra aba ou módulo e voltar,
  separados por formulário e registro, sem gravação automática no servidor.
- Salvar com sucesso, cancelar/descartar explicitamente ou encerrar a sessão encerra a edição.
  Falhas de validação/rede conservam os dados; manter as proteções de versão/autorização.
- Compartilhar a infraestrutura do painel e validar ida/volta, sem misturar registros ou usuários.

## Homologação e prontidão — 16/09/2026

Pedido atual: salvar, reabrir e editar rascunho com imagem sintética no DEV publicado. Validar evidências reais, preservar dados existentes e não declarar concluída uma aprovação institucional ausente. Homologação da OAB depende da inscrição autorizada e do resultado esperado; descarte não executa sem política aprovada.


### US4 — Exportar dados autorizados (Priority: P2)

O operador com permissão geral de exportação e consulta da função abre
“Exportar Notícias”, ajusta filtros,
seleciona/reordena colunas e escolhe Excel, CSV ou PDF para download direto.
Abrange dados/abas consultáveis da função, sem teto funcional de registros/período,
sem prazo de arquivo nem fila/histórico obrigatório. Não exportar bytes de anexos,
segredos ou campos sem autorização.

Teste independente: Conta sem user_access e sem papel não recebe Notícias; leitor/editor/publicador mantêm ações distintas; publicado público continua; três formatos não vazam revisão privada no contexto de publicada.
Em erro, manter filtros/colunas; três formatos preservam conjunto e ordem escolhidos.
Campos restritos enviados diretamente são recusados no servidor. Este detalhamento
aplica o padrão transversal já decidido, sem implementação ou nova homologação.


Checkpoint de 21/09/2026 — plan concluído: desenho, pesquisa, modelo, contratos e
roteiro atualizados. Nenhum código, serviço, migration ou teste de aplicação executado.
Tarefas serão detalhadas em seguida; políticas e funções adiadas permanecem pendentes.


Diagnóstico complementar do plan em 21/09: embora as guardas news:read/write/publish
existam, a view effective_user_permission de 0014 ainda concede as três chaves a contas
sem user_access. Remover esse baseline separadamente da migração de exportação;
preservar grants explícitos/papéis válidos e leitura pública. Q8 ainda requer essa correção.

Checkpoint de 21/09/2026 — tasks concluídas: 10 tarefas novas (T029–T038), com histórias, dependências, caminhos e aceite; nenhuma implementação/teste de aplicação executado. Ver tasks.md.

Checkpoint final de21/09/2026 — plan seguido de tasks encerrados. Conferência
documental de IDs, fases, links e preservação do histórico concluída; código,
testes de aplicação e homologações não executados. Próximo passo recomendado:
análise cruzada antes da implementação. Detalhes no relatório do programa002.
