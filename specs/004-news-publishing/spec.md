# Feature Specification: Notícias e publicação editorial

**Feature Branch**: `feature/news-publishing` **Created**: 2026-09-09 **Status**: Função completa implementada e validada. **Input**: Criar
o spec e iniciar Notícias com pesquisa atual de mercado; atualizações futuras permanecem neste spec.
Programa: [002/US2](../002-integrated-modules/spec.md).

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

1. Acesso ao painel é suficiente: não há permissão adicional de Notícias nem segunda aprovação.
2. Publicar exige título, endereço legível, conteúdo com texto ou mídia válida e ao menos um canal.
3. Prévia identifica rascunho e canal, exige o mesmo acesso ao painel e não é indexável/publicamente
   cacheada.
4. Imagens exigem descrição acessível e arquivo liberado pela verificação existente.
5. Salvar após publicar mantém o conteúdo público anterior até nova publicação explícita.
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
- **FR-004**: Reutilizar o acesso ao painel, inclusive verificação no servidor; não exigir nova
  permissão nem revisor. Decisão expressa do usuário em 09/09/2026.
- **FR-005**: Preservar a versão publicada enquanto outra revisão está em elaboração.
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

### Key Entities

Notícia; revisão editorial; referência de mídia; destaque na revisão; ação agendada; disponibilidade por canal. Contas,
sessões, arquivos e eventos de auditoria continuam pertencendo à fundação existente.

## Success Criteria

### Measurable Outcomes

- **SC-001**: Criar, salvar e reabrir rascunho em até 2 minutos no cenário de homologação.
- **SC-002**: Nenhum rascunho vaza nem sobrescreve publicação nos testes de edição/consulta
  simultâneas.
- **SC-003**: Todos os cenários de acesso negado, mídia inválida e conflito falham sem mudança
  pública.
- **SC-004**: Repetir uma ação agendada três vezes produz um único efeito por revisão/destino.
- **SC-005**: Jornada completa por teclado sem falhas críticas de acessibilidade automatizada.

## Assumptions

- Este spec inclui a função editorial completa no painel, API de leitura e página pública.
- **Decisão do usuário em 09/09/2026**: qualquer pessoa pode ler notícias publicadas, inclusive
  as destinadas ao mobile. Regra revisável neste mesmo spec. Rascunhos, histórico, agenda e
  escrita continuam com sessão ativa do painel.
- Autorização do painel já inclui o acesso a Notícias, conforme confirmação do usuário. Não alterar
  permissões de outros módulos nem o MFA administrativo existente.
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
