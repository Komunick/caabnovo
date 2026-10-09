# Disponibilizar chat interno e comentários operacionais com notificações configuráveis

**Ticket:** Disponibilizar chat interno e comentários operacionais com notificações configuráveis
(CAAB-49). Tipo História; Em Desenvolvimento por solicitação do usuário em 07/10/2026. Registro
documental, sem código implementado por esta entrega.

**Organização solicitada em 07/10/2026:** seis subtarefas nativas em Backlog, com três papéis de
subagentes e coordenação, conforme [tarefas e distribuição](tasks.md). O usuário determinou
expressamente que a implementação não seja iniciada. O pai permanece em Em Desenvolvimento; concluir
uma subtarefa não libera parte da função separadamente.

**Solicitante:** mafaltti (login Danilo-Komunick), perfil GitHub autenticado consultado nesta sessão
em 07/10/2026. **Autoria do registro:** CODEX.

## O que se pede

Entregar, em uma única entrega funcional, Chat interno com conversas diretas e grupos por convite,
comentários nos registros, anexos seguros, pesquisa e notificações configuráveis por painel,
navegador e e-mail.

Estado solicitado: Em Desenvolvimento. O plano foi definido com o usuário em 07/10/2026; este
registro e a atualização do PRD não comprovam implementação, testes ou homologação e não iniciam
código automaticamente.

## Por que é importante

Permitir que a equipe converse dentro do CAAB, mantenha o contexto do atendimento junto aos
registros, encontre decisões anteriores e receba somente os avisos relevantes ao seu trabalho.

A função corresponde ao candidato FUT01 do programa integrado. É independente de Mensagens
(campanhas/comunicados aos associados), da caixa de entrada ainda a definir e do futuro suporte por
tickets do app/site.

## Escopo e regras da entrega única

### Conversas diretas e grupos

- Todos os usuários internos ativos podem conversar, independentemente de cargo; contas externas,
  desativadas ou com sessão inválida não participam.
- Uma conversa direta por par de usuários. Reabrir a conversa recupera o mesmo histórico.
- Grupos por convite têm nome, participantes e responsáveis. O criador é o responsável inicial; pode
  convidar, remover, transferir responsabilidade, arquivar e restaurar.
- Novo integrante acessa todo o histórico; a confirmação de inclusão informa isso. Sair ou ser
  removido encerra acesso a mensagens, pesquisa e anexos; autoria permanece.
- Responsável que sair deve transferir responsabilidade. Administrador/gestor pode reatribuir quando
  o responsável estiver desativado.
- Grupo arquivado conserva consulta e bloqueia novos envios.
- Texto, respostas a mensagens, menções individuais, anexos e referências a registros. Respostas
  aparecem na sequência principal, com acesso ao original, sem árvore aninhada.
- Busca por texto, pessoa, conversa, período e módulo; filtros de não lidas e menções; resultados
  respeitam acesso atual.

### Supervisão e privacidade

- Administradores e gestores consultam todas as conversas, inclusive sem participação, e podem
  moderar conteúdo. A interface informa essa regra na entrada do chat e nas conversas; grupos são
  por convite, sem promessa de sigilo perante supervisores.
- Minhas conversas mostra participação efetiva; Supervisão mostra as demais. Supervisão não inscreve
  o usuário nem gera notificações.
- Para enviar, o supervisor precisa participar; não há ingresso silencioso.
- Abertura de conversa alheia, consulta de versões e download por supervisão são auditados. Perda de
  cargo encerra essa autoridade nas próximas operações.
- Uso é capacidade base dos usuários internos ativos. Supervisão/moderação exigem cargo vigente de
  Administrador ou Gestor, sem delegação implícita a Colaborador. Essa regra específica deve ser
  conciliada com o contrato geral de cargos.

### Comentários internos e referências

- Incluir comentários em seis tipos de registro: associado; parceiro; unidade do parceiro; unidade
  de atendimento de Agendamentos; reserva/agendamento; notícia, inclusive rascunho acessível.
- Quem consulta o registro pode ler e comentar, sem adquirir edição cadastral, publicação de notícia
  ou alteração de reserva.
- Uma discussão por registro, criada no primeiro comentário, com respostas, menções e anexos.
- Seguir/deixar de seguir é individual. Publicar inicia acompanhamento; receber menção não inscreve
  automaticamente.
- Seguidores e mencionados autorizados recebem avisos conforme preferências. Menção e
  compartilhamento não concedem acesso ao registro.
- Comentários não aparecem em app/site/portal/APIs públicas; avaliações de parceiros continuam
  separadas.
- Arquivamento/exclusão lógica do registro conserva histórico autorizado e bloqueia novos
  comentários. Inatividade simples não bloqueia colaboração. Comentários não alteram decisões de
  negócio.
- Compartilhar referências dos mesmos seis tipos. Identificação e abertura dependem do acesso de
  cada destinatário; sem acesso, mostrar “Registro indisponível para seu acesso”.
- Não copiar automaticamente CPF, documentos, contatos ou dados cadastrais para a mensagem.

### Edição, remoção e anexos

- Autor pode editar ou remover logicamente o próprio conteúdo, sem prazo artificial; mostrar
  indicação de edição/remoção.
- Administrador/gestor pode ocultar conteúdo alheio e desfazer a ocultação; não reescreve texto de
  terceiro.
- Preservar versões, acessíveis ao autor e à supervisão; participantes comuns veem a versão atual.
  Auditoria transversal guarda metadados, sem duplicar o corpo.
- PDF, JPG/JPEG e PNG, até 25 MiB por arquivo e três arquivos por publicação.
- Reutilizar PostgreSQL, checksum, quarentena e antivírus. Publicação de arquivo só após liberação;
  falha preserva texto e permite retirar/substituir o arquivo.
- Autorizar upload, finalização e leitura dos bytes. URL antiga não contorna remoção do grupo ou
  revogação. Remover/ocultar conteúdo bloqueia download comum; supervisão conserva acesso histórico.

### Interface

- Chat interno na navegação imediatamente antes de Mensagens, mantendo Mensagens antes de
  Relatórios.
- Lista, pesquisa, filtros, histórico e compositor; em celular, lista e conversa em etapas separadas
  com retorno claro. Atalho no cabeçalho com não lidas e menções.
- Comentários internos na página do registro, com contador e Seguir comentários. Preferências em
  Configurações e por conversa/discussão.
- Rascunhos em memória por identidade/contexto, preservados ao navegar e limpos ao enviar com
  sucesso, cancelar, sair ou trocar de conta.
- Novas mensagens não deslocam quem lê histórico antigo; mostrar ação para retornar às novas.
- Guia CAAB, temas claro/escuro, WCAG 2.2 AA. Enter insere linha; Ctrl/Cmd+Enter envia, com
  instrução visível.

### Notificações

- Painel, navegador e e-mail ativados/desativados independentemente.
- Cada canal oferece todas as mensagens ou apenas menções, todos os módulos ou seleção;
  conversa/discussão pode herdar, personalizar ou silenciar.
- Menção e módulo são filtros cumulativos. Silêncio/desativação prevalece inclusive sobre menções.
- Módulo vem do registro comentado, referência compartilhada ou assunto de módulo explicitamente
  escolhido no compositor; não inferir por palavras. Mensagem sem contexto não passa por filtro
  restrito a módulos.
- Chat avisa apenas participantes; comentários avisam seguidores ou mencionados com acesso vigente;
  supervisão não amplia destinatários; autor não recebe aviso próprio.
- Não lidas permanecem disponíveis mesmo com avisos desligados. Leitura exige exibição efetiva, não
  mero fetch.
- Edição não redistribui avisos gerais; nova menção pode avisar uma vez por destinatário/publicação.
- Padrão: painel ligado para todas as mensagens/todos os módulos; navegador e e-mail desligados até
  escolha; conversas herdam.
- Navegador avisa com painel aberto, inclusive em segundo plano quando suportado; permissão só pela
  ação Ativar, com estado de bloqueio/incompatibilidade. Sem Web Push com painel fechado.
- E-mail agrupa não lidas por usuário em janela de um minuto, revalidando acesso/preferências antes
  de enviar. Aviso externo genérico e link autenticado, sem corpo, nome de associado ou anexo.

## Plano técnico e interfaces

- Monólito modular existente: Next.js/BFF, Zod, PostgreSQL e pg-boss. Domínio próprio de
  colaboração, sem tabelas de campanhas.
- Modelar conversas, participantes, mensagens/comentários, versões, referências, anexos,
  acompanhamento, posição de leitura, preferências e eventos de notificação.
- Integridade referencial para registros; respostas, menções e anexos validados no mesmo contexto.
  Autorização do módulo de origem para comentários/referências.
- Interfaces internas versionadas: /api/v1/internal-chat/conversations;
  /conversations/{id}/messages; /messages/{id}; /sync; /search; /preferences. Comentários em
  /api/v1/internal-comments/{recordType}/{recordId}. Os caminhos abreviados de chat usam o prefixo
  /api/v1/internal-chat.
- Serviço de arquivos existente com finalidade específica e guardas em todas as etapas. Texto
  escapado, links validados, origem/CSRF, no-store, rate limiting e autorização server-side.
- Envio idempotente com identificador do cliente. Publicação, vínculos, versão e evento de
  notificação persistem na mesma transação.
- Cursor, ordem estável e sequência de mudanças por conversa, incluindo edições/remoções.
- Polling incremental de três segundos com aba visível e quinze em segundo plano, respeitando
  limitações do navegador; reconciliar em foco/reconexão, sem loops sobrepostos, com recuo em
  falhas.
- Meta: novas mensagens em até cinco segundos com aba visível/rede normal no cenário sintético de
  carga.
- Limites iniciais: página 50/máximo 100; texto 10.000 caracteres; grupo 100 participantes; 60
  publicações/minuto/usuário.
- Troca de identidade, mesmo com permissões iguais, aborta requisições e limpa conteúdo/rascunhos;
  respostas antigas não repovoam a tela. Reutilizar a proteção integrada na fundação e adicionar
  regressão do chat.
- Remoção/perda de acesso impede novas respostas da API e limpa conteúdo na próxima sincronização.
- SMTP/Nodemailer existente para conta será reutilizado; entrega externa homologada ainda precisa de
  comprovação. Coordenar transporte com Serviço de e-mail transacional e definição da caixa de
  entrada (CAAB-2), sem incorporar a caixa de entrada ou contratar provedor.
- Jobs duráveis com agrupamento/deduplicação e estados. Falha no aviso não desfaz mensagem salva;
  até cinco tentativas com intervalos crescentes. Resultado SMTP incerto não provoca reenvio
  automático cego; aceitação SMTP não significa entrega.
- Sem SMTP, canal aparece indisponível; a entrega completa exige recebimento em destinatário
  controlado.
- Medir latência, falhas, fila e processamento de anexos, sem conteúdo pessoal em logs.
- Descarte automático permanece desligado conforme política atual; não inventar prazo de retenção ou
  aprovação institucional.
- Rollback desabilita função/jobs e preserva dados, versões e auditoria, sem migration destrutiva.

## Sequência de execução

1. Consolidar pesquisa, decisões, spec, contratos, plano, tarefas e critérios em uma única
   branch/worktree.
2. Implementar dados, autorização, conversas e comentários.
3. Integrar interface, referências, anexos e notificações.
4. Executar testes, revisão, evidências por versão e homologação humana.

As etapas são internas à mesma entrega, sem aceite parcial ou tickets separados para testes
rotineiros. Antes de iniciar código, completar spec, contratos e tarefas próprios a partir deste
plano; o pedido atual é de registro no Jira e atualização documental.

## Critérios de aceite

- [ ] Duas pessoas conversam com texto, respostas, menções e anexos; reencontro abre a mesma
      conversa.
- [ ] Grupos validam convite/histórico completo, saída, remoção, transferência, responsável
      desativado e arquivamento.
- [ ] Todos os seis tipos de registro têm comentários; consulta permite comentar sem conceder
      alteração de negócio; nenhuma superfície pública expõe conteúdo.
- [ ] Supervisão de Administrador/Gestor é informada e auditada; Colaborador é negado; supervisor
      sem participação não envia nem recebe avisos.
- [ ] Edição concorrente não sobrescreve silenciosamente; remoção, ocultação, restauração da
      ocultação e versões respeitam autoria/acesso.
- [ ] Anexos cobrem formatos/tamanho/assinatura, malware, scanner indisponível, interrupção e
      download por URL antiga após revogação.
- [ ] Matriz dos três canais cobre todas/menções, módulos, personalização, silêncio, ausência de
      contexto, acesso perdido e cancelamento de aviso pendente; nenhum aviso próprio ou só de
      supervisão.
- [ ] E-mail recebido em destinatário controlado, com agrupamento, falha/retry e resultado incerto
      tratados sem declaração falsa de entrega.
- [ ] Simultaneidade, retries, múltiplas abas/dispositivos e reconexão não perdem nem duplicam
      publicações; leitura consistente.
- [ ] Troca entre contas com permissões iguais não revela conteúdo/rascunho da identidade anterior.
- [ ] Busca, referências, contadores e arquivos não revelam conteúdo fora do acesso atual.
- [ ] Teclado/foco/leitor de tela, zoom 200%, 1280/390/320 px, dois temas, texto longo e estados
      vazio/erro/indisponível atendem ao guia.
- [ ] Carga com 100 sessões sintéticas cumpre meta de atualização sem perda/duplicação.
- [ ] Gates aplicáveis passam: formato, lint, tipos, build, unitários, contratos, PostgreSQL, E2E,
      acessibilidade e segurança; revisão/testes IA e QA humano identificado registram versão e
      resultado.
- [ ] PRD, FUT01, mapa de módulos, contrato de cargos, guia de design e evidências são conciliados
      com a versão entregue. O executor acompanha correções durante QA.

## Limites e dependências

Sem chamadas, áudio/vídeo, canais públicos, suporte externo, integração WhatsApp/Teams/Slack, IA,
exportação de conversas ou Web Push com painel fechado. Descarte automático permanece desligado.

A função não depende do envio de campanhas. A parcela de e-mail depende do transporte de Serviço de
e-mail transacional e definição da caixa de entrada (CAAB-2). Nenhum fornecedor, conta, responsável
humano, estimativa, sprint, PR, merge ou implantação é presumido por este registro.

## Observações e referências

Modelo de organização: Disponibilizar o tema Cores Legado (CAAB-29) e Gerenciar cargos e acessos de
Administrador, Gestor e Colaborador (CAAB-19): objetivo, justificativa, critérios e referências.
História principal de uma entrega única; seis subtarefas criadas por pedido explícito do usuário em
07/10/2026, com distribuição e dependências em [tasks.md](tasks.md).

Pesquisa realizada em 07/10/2026: conversas por unidade/projeto e histórico pesquisável no caso
Credit Union 1 (relato do fornecedor); comunicação integrada no Odoo Discuss; notas por registro no
Odoo Chatter; compartilhamento sem ampliação de acesso no Dynamics 365. A supervisão ampla é decisão
do CAAB, não regra atribuída a essas referências.

- [Caso Credit Union 1 / Slack](https://slack.com/customer-stories/credit-union-1-story)
- [Odoo Discuss](https://www.odoo.com/documentation/18.0/applications/productivity/discuss.html)
- [Odoo Chatter](https://www.odoo.com/documentation/19.0/applications/productivity/discuss/chatter.html)
- [Dynamics 365 — segurança de registros e chat](https://learn.microsoft.com/en-us/dynamics365/sales/teams-integration/teams-in-dynamics-faq)
- [Notifications API](https://developer.mozilla.org/en-US/docs/Web/API/Notifications_API/Using_the_Notifications_API)

Fonte local: specs/012-internal-chat/plan.md e docs/PRD.md na worktree
.cache/pr-internal-chat-plan-20261007, branch docs/internal-chat-plan-20261007, base dev 1c21c9a.
Documentação local ainda sem publicação no Git. O plano completo está neste ticket para consulta
independente da worktree.
