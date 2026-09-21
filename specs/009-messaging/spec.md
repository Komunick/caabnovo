# Mensagens — preparação e acompanhamento

## Checkpoint de revisão de código — 21/09/2026

Protótipo contém campanhas/modelos/públicos, segmentação, preferências e programação. Worker prepara
e bloqueia sem canal; não envia mensagens. M016 permanece revisão de produto, M009/M010 adiadas.
Exportação própria ainda ausente (DX01), sem ampliar o escopo para chat/tickets.

Revisão estática da base `ed31baf`; nenhum teste de aplicação ou homologação nesta etapa. Evidências
e limites: [revisão transversal](../002-integrated-modules/code-audit-2026-09-21.md).

**Data:** 16/09/2026. **Estado atualizado em 21/09/2026:** protótipo com finalidade confirmada;
aderência e continuidade pendentes de revisão. Responsável funcional: US7 do plano integrado.

**Decisão vigente — 21/09/2026:** a finalidade de Mensagens foi confirmada: comunicados e campanhas
aos associados, com seleção de público e programação. O código existente continua sendo um
protótipo, sem homologação do produto. A definição de finalidade substitui a pendência de 17/09;
revisão de aderência do protótipo e critérios de continuidade permanecem em M016. Meios, provedores
e envio real continuam adiados. Conversa interna do painel e suporte por tickets do app/site são
possibilidades de módulos futuros separados, com nomes e funcionamento sujeitos a pesquisa
posterior; não estão em implementação.

## Clarifications

### Session 2026-09-21

- Q: Qual deve ser a finalidade principal do módulo Mensagens? → A: Comunicados e campanhas aos
  associados, com seleção de público e programação (A). Registrar separadamente duas possibilidades
  futuras, com nomenclatura a definir: conversa interna entre usuários do painel administrativo e
  suporte para usuários do app/site abrirem tickets, conversarem sobre problemas e receberem
  atendimento até a resolução. Pesquisar como esses módulos serão feitos e usados antes de definir
  escopo e construção.

Checkpoint de 21/09/2026: Q5 registrada; M015 concluída pela decisão explícita do usuário, M016 e
M009/M010 pendentes. Nenhum código, pesquisa nova, envio ou teste executado nesta etapa.
Possibilidades futuras acompanhadas no programa 002.

## Escopo e decisão do usuário

Mensagens destina-se a comunicados e campanhas aos associados, com seleção de público e programação.
Conversa interna entre usuários do painel e atendimento por tickets não fazem parte deste módulo.

Qualquer pessoa autenticada no painel com `messages:access` pode consultar, preparar, editar e
solicitar envio. Não há aprovação editorial nem permissão adicional de envio. Os meios, fornecedores
e políticas específicas de cada canal serão definidos depois. Nenhuma operação desta entrega
transmite mensagens.

## Histórias e aceite

1. Criar, editar, duplicar, arquivar e restaurar campanhas. Guardar nome interno, assunto, texto,
   público e versão; rascunhos aceitam conteúdo incompleto. Conflitos de edição não sobrescrevem
   trabalho.
2. Criar e reutilizar modelos de conteúdo e públicos dinâmicos, com filtros de estado OAB e presença
   de contato. Público de associados não arquivados, exclusões explícitas e bloqueio geral de
   comunicação. Não presumir consentimento: público elegível para preparação não significa
   autorizado para um futuro canal.
3. Prévia com personalização limitada a nome e primeiro nome, validação de variáveis, contagens de
   incluídos/excluídos e amostra mínima de nomes. Sem HTML executável, CPF, documentos ou contatos
   completos na seleção.
4. Solicitar envio imediato ou programado com confirmação concreta de conteúdo e público. Sem canal:
   execução termina bloqueada com motivo; nunca aceita/enviada/entregue. Programações reavaliam
   público, bloqueios e acesso do solicitante; cancelamento interrompe programação. Não reativar
   automaticamente tentativas antigas quando canais forem adicionados.
5. Histórico imutável de execuções, versão/conteúdo/público capturados, contagens e motivo.
   Repetições da mesma solicitação não criam execuções duplicadas. Duplicar campanha cria novo
   rascunho.
6. Aceite da finalidade: preparar um comunicado para um público de associados, revisar
   conteúdo/destinatários e programar; o módulo não apresenta caixa de conversa interna nem
   abertura/atendimento de tickets. Sem canal configurado, nenhuma etapa afirma que ocorreu envio
   real.
7. Campanhas, modelos, públicos e preferências acessíveis por navegação do módulo, botões de adição,
   filtros e paginação. UI usa os componentes e padrões atuais, acessível em teclado e celular,
   temas claro/escuro. Edição preservada ao sair e voltar entre módulos; cancelar descarta
   explicitamente.

## Limites

Sem anexos, importação de contatos externos, eventos (módulo inexistente), links públicos de
descadastro, cobrança, métricas de provedor, credenciais ou disparos reais. Integrações futuras
deverão definir consentimento/finalidade por canal, supressão, limites, assinatura de callbacks,
idempotência destinatário/canal e evidência de entrega. Não exibir essas integrações como
existentes.

## Correção de escopo exigida pelo usuário — 16/09/2026

A entrega anterior não concluiu a segmentação nem tornou o agendamento suficientemente visível. Sem
teto funcional de destinatários, inclusive seleção/exclusão manual; toda a base de 30–40 mil ou mais
deve ser contada no banco, sem truncar a audiência. Limites de bytes protegem requests; paginação e
amostras não limitam destinatários. Filtros combináveis: categoria cadastrada, gênero cadastrado,
titular/dependente pelo vínculo vigente, cidade, faixa etária inclusiva, UF de residência, UF OAB
separada, contato disponível e situação administrativa. Atalho explícito para todos os cadastros;
filtro de situação Ativa/Inativa (sem obrigatoriedade de conta ativa, conforme correção do usuário).
Dependente = possui titular vigente; titular = não possui titular vigente. Valores ausentes não
atendem filtros específicos. Não inferir dados nem vincular contas por email/CPF. Aba Agendamentos
própria com busca, status, data, paginação, abertura da campanha, cancelamento e reagendamento
auditado/atômico com proteção de versão. Editor mostra etapa Agendamento desde a criação e mantém
data digitada ao salvar o novo rascunho. Meios e entregas reais continuam adiados pelo usuário;
nunca simular envio. Aceite: teste com 100 cadastros sintéticos, filtros cruzados e fronteiras de
idade, bloqueios/arquivados, migração compatível de públicos existentes e jornada de agendamento.

Notícias é o primeiro módulo após Início; Mensagens é o penúltimo, imediatamente antes de Auditoria.
Sessões e configurações permanecem utilidades da conta.

### US8 — Exportar dados autorizados (Priority: P2)

O operador com permissão geral de exportação e consulta da função abre “Exportar Mensagens”, ajusta
filtros, seleciona/reordena colunas e escolhe Excel, CSV ou PDF para download direto. Abrange
dados/abas consultáveis da função, sem teto funcional de registros/período, sem prazo de arquivo nem
fila/histórico obrigatório. Não exportar bytes de anexos, segredos ou campos sem autorização.
Executar somente após revisão de aderência e decisão de continuidade M016; envio real continua
adiado.

Teste independente: Após M016, conferir preparo/segmentação/programação sem envio real; exports
respeitam a projeção mínima e formatos/colunas; nenhum botão/tela de chat ou ticket; alterações no
protótipo dependem do gate registrado. Em erro, manter filtros/colunas; três formatos preservam
conjunto e ordem escolhidos. Campos restritos enviados diretamente são recusados no servidor. Este
detalhamento aplica o padrão transversal já decidido, sem implementação ou nova homologação.

Checkpoint de 21/09/2026 — plan concluído: desenho, pesquisa, modelo, contratos e roteiro
atualizados. Nenhum código, serviço, migration ou teste de aplicação executado. Tarefas serão
detalhadas em seguida; políticas e funções adiadas permanecem pendentes.

Checkpoint de 21/09/2026 — tasks concluídas: 8 tarefas novas (T001–T008), com histórias,
dependências, caminhos e aceite; nenhuma implementação/teste de aplicação executado. Ver tasks.md.

Checkpoint final de21/09/2026 — plan seguido de tasks encerrados. Conferência documental de IDs,
fases, links e preservação do histórico concluída; código, testes de aplicação e homologações não
executados. Próximo passo recomendado: análise cruzada antes da implementação. Detalhes no relatório
do programa002.

Complemento de cargos I1 — 21/09/2026: a regra anterior de messages:access para todas as operações
será conciliada com001/contracts/roles.md. Gestor tem consulta/exportação de Mensagens, mas
preparação/edição/programação dependem de concessão adicional; Administrador tem todas as funções
disponíveis. Separar autorização por operação antes de conceder consulta global, coordenando001 T114
e009 M016/T003. Não implementar envio real nem dispensar M016.

Checkpoint de21/09/2026: revisão técnica de finalidade registrada em
[purpose-review.md](evidence/purpose-review.md). Continuidade limitada à separação
consulta/alteração necessária a001 T114, autorizada pelo usuário. Homologação, canais reais e
adaptador de exportação de Mensagens permanecem pendentes.
