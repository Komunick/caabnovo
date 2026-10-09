# Tarefas — Chat interno e comentários operacionais

**Data:** 07/10/2026. **Autoria:** CODEX. **Solicitante:** mafaltti, login Danilo-Komunick,
verificado pelo perfil GitHub da sessão.

**Estado:** organização aprovada; implementação NÃO iniciada, conforme ordem explícita do usuário.
Pai: Disponibilizar chat interno e comentários operacionais com notificações configuráveis
(CAAB-49), Em Desenvolvimento por solicitação anterior. As subtarefas nativas estão em Backlog;
nenhum responsável humano foi atribuído.

Escopo funcional e pesquisa no [plano](plan.md); requisitos CHAT no
[PRD](../../docs/PRD.md#910-chat-interno-e-comentários-operacionais). A subdivisão não altera a
entrega única. Cada subtarefa inclui seus testes/revisão; validação interna não libera a função
parcialmente.

## Distribuição e dependências

| Ordem | Subtarefa nativa                                                              | Subagente futuro                | Pré-requisitos internos | Estado  |
| ----- | ----------------------------------------------------------------------------- | ------------------------------- | ----------------------- | ------- |
| 1     | Definir contratos, dados e permissões da colaboração interna (CAAB-50)        | A — domínio e interface do chat | —                       | Backlog |
| 2     | Implementar conversas, grupos, supervisão e sincronização do chat (CAAB-51)   | A — domínio e interface do chat | 1                       | Backlog |
| 3     | Integrar comentários e referências aos seis tipos de registro (CAAB-52)       | B — comentários e anexos        | 2                       | Backlog |
| 4     | Proteger anexos de conversas e comentários em todas as etapas (CAAB-53)       | B — comentários e anexos        | 2, 3                    | Backlog |
| 5     | Configurar e entregar avisos do chat por painel, navegador e e-mail (CAAB-54) | C — preferências e notificações | 2                       | Backlog |
| 6     | Construir a interface integrada de conversas e supervisão (CAAB-55)           | A — domínio e interface do chat | 2                       | Backlog |

Pré-requisitos numerados correspondem à coluna Ordem. Os vínculos Blocks nativos representam as
dependências técnicas; o encerramento integrado exige também as interfaces consumidoras e
fornecedoras funcionando juntas.

Dependência externa: Serviço de e-mail transacional e definição da caixa de entrada (CAAB-2)
bloqueia a conclusão da parcela de e-mail de Configurar e entregar avisos do chat por painel,
navegador e e-mail (CAAB-54) e o aceite final do pai. Não bloqueia preparar painel/navegador e não
inclui a caixa de entrada.

## Trabalho dos subagentes

- **A — domínio e interface do chat:** contratos/modelo/permissões; núcleo de conversas; depois
  página de chat, compositor e supervisão.
- **B — comentários e anexos:** comentários/referências nos seis registros; depois segurança e
  integração dos arquivos nos dois contextos.
- **C — preferências e notificações:** preferências, destinatários, avisos do painel/navegador,
  eventos/jobs e e-mail; fornece componentes para A/B montarem.
- **Coordenação principal:** único ponto de integração em migrations e registradores centrais,
  catálogos/exportações, shell/navegação, proteção de identidade/rascunhos e bootstrap do worker;
  conserva plano/PRD/tarefas/evidências/Jira e gate final.

Uma branch/worktree para a entrega. Um escritor por arquivo compartilhado; agentes entregam
propostas à coordenação em vez de editar o mesmo alvo. Mudanças de contrato são combinadas antes de
afetar consumidores. Após a fundação e o núcleo, A (interface), B (comentários/anexos) e C (avisos)
podem avançar em paralelo. O contrato estável de eventos/seguidores/leitura permite preparação
independente; o aceite usa integrações reais.

Os três subagentes acionados em 07/10/2026 trabalharam somente na decomposição de backend, interface
e aceite. Os papéis A/B/C acima descrevem execução futura; nenhum subagente implementador foi
iniciado.

## Subtarefas e aceite próprio

### 1. Definir contratos, dados e permissões da colaboração interna (CAAB-50)

**Papel:** A — domínio e interface do chat. **Escrita exclusiva:** Arquivos novos de
contratos/modelo da colaboração. Coordenação controla migrations, exports/registradores centrais e
conciliação de cargos.

- Consolidar spec, modelo de dados, contratos e matriz de autorização a partir do plano aprovado,
  preservando todas as decisões de produto.
- Preparar a base relacional de conversas, participantes, publicações/versões, comentários,
  referências, anexos, leitura, preferências e eventos duráveis; definir integração dos seis
  registros.
- Definir contratos de criação/envio/edição/moderação/busca/sync/avisos e capacidades base de uso
  versus supervisão por cargo.
- Implementação futura: migrations aditivas, constraints e estruturas comuns somente após liberação
  para iniciar código; numeração e arquivos centrais passam pela coordenação.

**Aceite:**

- [ ] Spec e contratos cobrem os 15 requisitos CHAT e o plano completo, sem decisões funcionais
      novas por inferência.
- [ ] Unicidade da conversa direta, idempotência, integridade referencial e transação
      conteúdo/evento têm contratos e validação PostgreSQL.
- [ ] Matriz explicita participantes, autor, supervisor, acesso a registro, revogação e conta/sessão
      desativada; nenhum acesso nasce de referência ou menção.
- [ ] Interfaces compartilhadas estabilizadas para as demais frentes; testes de contratos e
      migrations incluídos na própria subtarefa.
- [ ] Registrar versão, comandos, resultados e limitações reais; testes/revisão pertencem à própria
      frente.

### 2. Implementar conversas, grupos, supervisão e sincronização do chat (CAAB-51)

**Papel:** A — domínio e interface do chat. **Escrita exclusiva:** Serviços, repositórios, rotas e
testes exclusivos de chat. Coordenação integra mudanças em autenticação, catálogos e registradores.

- Backend de conversas diretas/grupos, responsáveis, convite/histórico completo, saída/remoção,
  transferência e arquivamento.
- Publicação idempotente, respostas, menções, versões, edição/remoção pelo autor e
  ocultação/restauração por supervisão.
- Busca, paginação, não lidas e sincronização incremental com políticas de acesso comuns usadas
  também por anexos e avisos.
- Auditar consultas alheias, versões e downloads por supervisão sem duplicar corpos na auditoria;
  expor eventos duráveis aos consumidores.

**Aceite:**

- [ ] Conversas diretas são únicas e retries/concorrência não duplicam publicação nem evento.
- [ ] Supervisor sem participação consulta/modera com trilha, mas não envia nem recebe notificações;
      perda de cargo revoga autoridade.
- [ ] Remoção de participante e perda de acesso bloqueiam busca, conteúdo e operações seguintes;
      respostas antigas não ressuscitam estado.
- [ ] Testes de domínio/API/PostgreSQL cobrem grupos, concorrência, autorização horizontal/vertical
      e reconexão; integração visual é consolidada pela frente de interface.
- [ ] Registrar versão, comandos, resultados e limitações reais; testes/revisão pertencem à própria
      frente.

### 3. Integrar comentários e referências aos seis tipos de registro (CAAB-52)

**Papel:** B — comentários e anexos. **Escrita exclusiva:** Domínio/componente de comentários e
montagens nos seis módulos. Não alterar componentes da página de chat, preferências globais ou
serviço compartilhado de arquivos fora da sua fatia.

- API, seção visual e integrações para associado, parceiro, unidade de parceiro, unidade de
  atendimento, reserva/agendamento e notícia.
- Uma discussão por registro, respostas/menções, seguir/deixar de seguir, publicação que inicia
  acompanhamento e menção que não inscreve.
- Revalidar consulta do registro sem conceder edição; proteger identificação das referências e
  impedir exposição em app/site/portal/APIs públicas.
- Arquivamento/exclusão lógica bloqueia publicação e conserva histórico autorizado; inatividade
  simples permite colaboração. Consumir os contratos de arquivos e avisos das frentes
  correspondentes.

**Aceite:**

- [ ] Os seis tipos têm a jornada completa de comentário, referência, acompanhamento, edição e
      moderação autorizados.
- [ ] Consulta permite comentar sem liberar ações de negócio; destinatário sem acesso recebe somente
      a indicação de registro indisponível.
- [ ] Avaliações de parceiros e comentários internos permanecem distintos; nenhuma API pública expõe
      comentários.
- [ ] Testes de API/PostgreSQL/E2E e temas, teclado, foco, 1280/390/320 px e zoom cobrem a fatia de
      comentários nos seis contextos. A subtarefa pode concluir sua validação interna com os
      contratos de anexos/avisos definidos; a jornada integrada com esses recursos prontos pertence
      ao gate do pai e não bloqueia o início da subtarefa de anexos.
- [ ] Registrar versão, comandos, resultados e limitações reais; testes/revisão pertencem à própria
      frente.

### 4. Proteger anexos de conversas e comentários em todas as etapas (CAAB-53)

**Papel:** B — comentários e anexos. **Escrita exclusiva:** Integração nos
serviços/rotas/repositórios de arquivos e testes pertinentes. B só inicia esta fatia após
estabilizar a autorização de comentários; coordenação é escritora dos registradores e contratos
globais.

- Reutilizar PostgreSQL/bytea, checksum, quarentena e scanner para PDF/JPEG/PNG, 25 MiB por arquivo
  e três por publicação.
- Integrar a finalidade de chat/comentário ao upload, finalização e leitura dos bytes, consumindo a
  política de acesso do contexto.
- Bloquear arquivo não liberado, URL antiga após revogação e download comum de conteúdo
  removido/oculto; preservar histórico permitido ao supervisor.
- Integrar estados de processamento/erro/retry que conservam o texto e permitem retirar ou
  substituir arquivo; coordenar alterações compartilhadas de files/jobs/worker.

**Aceite:**

- [ ] Validar tipo declarado e real, tamanho, checksum, malware e scanner indisponível; nenhum
      conteúdo em quarentena é publicado.
- [ ] Sessão/acesso são revalidados no upload, finalização e bytes; identificador ou URL copiada não
      permite acesso indevido.
- [ ] Revogação/remoção/ocultação, inclusive concorrentes, são cobertas em ambos os contextos;
      supervisão histórica é auditada.
- [ ] Testes de upload e integração PostgreSQL/worker, regressões do serviço existente e jornadas de
      falha/retry pertencem à subtarefa.
- [ ] Registrar versão, comandos, resultados e limitações reais; testes/revisão pertencem à própria
      frente.

### 5. Configurar e entregar avisos do chat por painel, navegador e e-mail (CAAB-54)

**Papel:** C — preferências e notificações. **Escrita exclusiva:** Domínio de preferências/avisos,
componentes próprios e handlers de worker. Entregar componentes aos agentes A/B; coordenação monta
atalho/shell e registra jobs. Não implementar caixa de entrada nem trocar fornecedor.

- Preferências gerais/contextuais, canais independentes, todas/menções, módulos explícitos,
  herança/personalização/silêncio e padrões do plano.
- Seleção de destinatários apenas por participação ou acompanhamento/menção autorizados; sem aviso
  próprio nem só por supervisão; revalidar acesso/preferências.
- Componentes de preferências/avisos/contadores, Notifications API com painel aberto e permissão
  explícita, eventos duráveis e jobs pg-boss.
- Agrupamento de e-mail em um minuto, deduplicação, até cinco tentativas, tratamento de resultado
  SMTP incerto, conteúdo externo genérico e recebimento controlado.

**Aceite:**

- [ ] Matriz de canais × todas/menções × módulos × silêncio funciona e não lidas continuam
      disponíveis com avisos desligados.
- [ ] Sem contexto de módulo, a mensagem não passa por filtro restrito; editar não repete aviso
      geral e nova menção avisa uma vez por publicação/destinatário.
- [ ] Revogação, leitura, remoção da conversa e mudanças de preferência são reavaliadas antes do
      envio; falha de aviso não desfaz publicação.
- [ ] Navegador informa bloqueio/incompatibilidade e não solicita permissão sem ação; e-mail tem
      teste real controlado e não confunde aceite SMTP com entrega.
- [ ] Testes de regra/contrato, fila/PostgreSQL, preferências/E2E/a11y e falhas estão na subtarefa;
      aceite de e-mail depende do transporte de Serviço de e-mail transacional e definição da caixa
      de entrada (CAAB-2).
- [ ] Registrar versão, comandos, resultados e limitações reais; testes/revisão pertencem à própria
      frente.

### 6. Construir a interface integrada de conversas e supervisão (CAAB-55)

**Papel:** A — domínio e interface do chat. **Escrita exclusiva:** Componentes/estilos/testes
exclusivos da página de chat e cliente local. Coordenação controla shell, navegação, provider de
identidade/drafts e arquivos compartilhados.

- Página Chat interno com lista, filtros/busca, histórico/compositor, diretas/grupos, responsáveis e
  Minhas conversas/Supervisão.
- Respostas, menções, referências, anexos, edição/moderação, aviso explícito de supervisão e
  histórico completo ao convidar.
- Responsividade, leitura sem salto, Enter/Ctrl+Enter, rascunhos em memória por identidade/contexto
  e limpeza/abort em troca de conta.
- Integrar componentes de preferência/avisos da frente C e arquivos da frente B. Coordenação faz
  montagem do shell, navegação antes de Mensagens e atalho.

**Aceite:**

- [ ] Jornada direta/grupo/supervisão funciona com APIs reais; supervisor não envia sem participação
      e cargo/acesso revogado é respeitado.
- [ ] Falhas conservam texto, novos eventos não deslocam histórico e retries não duplicam; troca de
      identidade com permissões iguais não vaza dados/rascunhos.
- [ ] Claro/escuro, teclado/leitor de tela/foco, zoom 200%, 1280/390/320 px e estados obrigatórios
      atendem ao guia CAAB.
- [ ] E2E e a11y incluídos; aceite integrado requer anexos e notificações concluídos. Gate de 100
      sessões/atualização até cinco segundos e QA completo permanece no pai.
- [ ] Registrar versão, comandos, resultados e limitações reais; testes/revisão pertencem à própria
      frente.

## Gate integrado do pai

- [ ] Concluir as seis subtarefas e verificar cobertura de todos os critérios do plano.
- [ ] Validar conversas, seis contextos de comentários, anexos, supervisão e três canais na mesma
      versão.
- [ ] Validar 100 sessões sintéticas, atualização em até cinco segundos com aba visível/rede normal,
      sem perda/duplicação.
- [ ] Verificar troca entre contas com permissões iguais, revogação concorrente, múltiplas
      abas/dispositivos, leitura e reconexão.
- [ ] Consolidar formato, lint, tipos, build, unitários, contratos, PostgreSQL, E2E, acessibilidade
      e segurança conforme a stack.
- [ ] Registrar revisão de design/segurança, evidências da versão e homologação humana identificada.
- [ ] Conciliar contrato de cargos e guia de design com a implementação; atualizar PRD, módulos e
      FUT01 se houver mudanças autorizadas.
- [ ] Conferir rollback que desabilita função/jobs sem descartar dados, versões ou auditoria.

Publicação, PR, merge, serviços e aplicação em banco de uso seguem suas autorizações específicas. O
estado do ticket não autoriza iniciar a implementação.
