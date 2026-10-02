# AGENTS.md — Orientação para agentes

## Projeto

O CAAB é um sistema interno de gestão. O repositório reúne o painel administrativo, serviços de
processamento e componentes compartilhados para associados, colaboradores, parceiros, notícias,
agendamentos, auditoria, comunicação e relatórios. Também contém contratos e planejamento para
integrações com app, site e portal de parceiros.

Este arquivo é o ponto de entrada para qualquer agente que trabalhe no repositório. Define a
navegação pela documentação e as regras de execução. Requisitos de produto, detalhes de stack e
progresso das entregas pertencem às fontes indicadas abaixo. Uma funcionalidade descrita ou
planejada não deve ser presumida implementada ou homologada.

## Sequência de entrada

1. A cada prompt, consultar este AGENTS e confirmar objetivo, escopo e autorizações da tarefa. Antes
   de cada etapa, conferir as regras aplicáveis.
2. Ler [docs/agentcache.md](docs/agentcache.md): trabalho em andamento, pedidos pendentes,
   branch/worktree, impedimentos e próximo passo. Rotinas locais ficam em
   [docs/runbooks/local-workspace.md](docs/runbooks/local-workspace.md). Conferir essas informações
   nos arquivos e no Git antes de agir.
3. Localizar a documentação responsável pelo assunto no mapa abaixo. Para uma função existente, ler
   sua spec, plano, tarefas e contratos antes de alterar código.
4. Consultar as instruções adicionais do diretório afetado, quando existirem, como
   [apps/web/AGENTS.md](apps/web/AGENTS.md).
5. Implementar somente o escopo autorizado, executar as validações correspondentes e registrar
   resultados e pendências durante o trabalho.

Todos os caminhos são relativos à raiz do repositório. Em worktrees, usar as fontes da entrega ativa
e a memória local da pasta principal, identificada pelo Git e pelo mapa do agentcache. Conferir
caminhos após movimentação de pastas; não recriar ou excluir worktrees com base apenas em registros
antigos.

## Mapa da documentação

| Necessidade                                     | Fonte                                                              | Uso                                                                                   |
| ----------------------------------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------------------------- |
| Entender o produto e seus objetivos             | [docs/PRD.md](docs/PRD.md)                                         | Visão e escopo do sistema.                                                            |
| Identificar o módulo responsável                | [docs/MODULES.md](docs/MODULES.md)                                 | Responsabilidades e referências das funções; conferir a data dos estados registrados. |
| Consultar princípios de engenharia e governança | [.specify/memory/constitution.md](.specify/memory/constitution.md) | Restrições e princípios do projeto.                                                   |
| Entender arquitetura, stack e testes            | [docs/STACK.md](docs/STACK.md)                                     | Referência técnica, testes, qualidade e fontes das versões em uso.                    |
| Encontrar ferramentas e comandos                | [docs/TOOLING.md](docs/TOOLING.md)                                 | Execução e verificação documental, conforme as referências da stack.                  |
| Planejar uma alteração funcional                | [specs/](specs/)                                                   | Spec, plano, tarefas, pesquisa, contratos e evidências da função.                     |
| Alterar UI/UX                                   | [docs/caab-design.md](docs/caab-design.md)                         | Guia obrigatório; resolução do caminho e revisão na seção de design abaixo.           |
| Alterar exportações                             | [docs/EXPORT-STANDARD.md](docs/EXPORT-STANDARD.md)                 | Padrão transversal, complementado pela spec do módulo.                                |
| Preparar branch, PR ou implantação              | [docs/DELIVERY-WORKFLOW.md](docs/DELIVERY-WORKFLOW.md)             | Processo de entrega, gates, revisão, deploy e rollback.                               |
| Retomar trabalho e localizar a entrega          | [docs/agentcache.md](docs/agentcache.md)                           | Memória operacional local; não substitui especificações nem evidências.               |

Os documentos podem conter planejamento e registros históricos. Em caso de divergência, conferir a
instrução atual da tarefa, a decisão vigente e a versão da entrega; registrar ou esclarecer o
conflito antes da ação afetada. Histórico, backlog e CI aprovado não constituem autorização para
implementar, publicar ou integrar.

## Mapa do repositório

- `apps/web/`: aplicação web, páginas e APIs. `modules/` contém os domínios; `components/`, os
  componentes de interface; `tests/`, testes da aplicação.
- `apps/worker/`: processamento assíncrono.
- `packages/db/`: persistência, repositórios e migrations.
- `packages/contracts/`: contratos compartilhados; `packages/news/` e `packages/config/`: pacotes de
  notícias e configuração.
- `infra/`: configuração de infraestrutura; não comprova o estado de um ambiente implantado.
- `docs/`: referências transversais e caderno temporário em `agentcache.md`. `specs/`: documentação
  e evidências por função.
- `.cache/`: backups, arquivos históricos, artefatos e worktrees locais. Consultar o caderno e o
  runbook local para distinguir trabalho ativo de registros históricos; não incluir o diretório
  indiscriminadamente em PRs.

Versões, bibliotecas, comandos e detalhes de arquitetura devem ser consultados na stack e em suas
referências, sem duplicação neste arquivo.

## Design: leitura e revisão obrigatórias

- Antes de planejar ou implementar qualquer mudança de UI/UX, ler o `caab-design.md` e os critérios
  da função.
- O guia canônico está em [docs/caab-design.md](docs/caab-design.md), junto à documentação do
  projeto.
- Seguir a sequência: AGENTS → agentcache → guia de design e spec da função → implementação →
  revisão pelo guia.
- Antes de concluir, verificar a alteração contra o guia e registrar evidências e divergências na
  documentação da função. Registrar o estado no agentcache.
- Se o guia não estiver acessível, localizar a versão vigente antes de alterar a interface. Não
  inventar um padrão substituto.

## Branches e PRs

- Manter a pasta principal em `dev`, limpa e sincronizada com `origin/dev`. Não fazer commits ou
  pushes diretos em `dev` ou `main`.
- Conferir branch, alterações locais e divergência antes de atualizar. Fazer fetch e fast-forward no
  início/fim de alterações do repositório, antes de criar branch e após integração em `dev`.
  Informar quando a sincronização não puder ser confirmada.
- Preservar trabalho local em backup verificável antes de retirá-lo da pasta. Não descartar
  alterações, forçar sincronização ou reaplicar trabalho antigo automaticamente.
- Consultar as worktrees existentes e usar uma branch/worktree por entrega, salvo isolamento
  solicitado. Manter specs em desenvolvimento nessa worktree; não copiá-las para a principal.
- **PR aberto:** permite correções na mesma branch. A abertura não congela a branch nem exige PR
  substituto.
- **PR integrado:** encerra a branch para trabalho novo. Não alterar PR/metadados nem reutilizar a
  branch; correções posteriores usam nova entrega. Preservar a worktree até conferir alterações,
  ignorados e necessidade de retenção.
- Abrir ou reabrir PR somente após pedido explícito. Concluir implementação ou passar nos testes não
  autoriza abertura, mesmo que o fluxo geral descreva essa etapa.
- Aprovar ou integrar PR somente sob pedido explícito. Checks não substituem autorização. Merge em
  `main` é exclusivamente humano.

## Implementação e validação

- Conferir os critérios de aceite antes de implementar. Atualizar a spec, o plano e as tarefas
  existentes quando o escopo mudar; não criar documentação concorrente.
- Consultar decisões de produto ainda ausentes antes de inventar regras ou comportamentos. Não
  reconfirmar autorizações existentes nem tratar escolhas técnicas rotineiras como novas decisões de
  produto.
- Consultar `STACK.md` para selecionar testes e seguir suas referências de execução. Aplicar os
  gates do workflow e os critérios da função; não manter aqui uma cópia dos comandos ou da matriz de
  testes.
- Antes de abrir PR, concluir as validações aplicáveis e conferir evidências da versão entregue. Não
  declarar prontidão com falhas ou verificações pendentes.
- Consolidar código, documentação e evidências antes de repetir CI. Não contornar testes, revisões
  ou proteções. Registrar o que foi executado, a versão verificada e as limitações.
- Preservar dados, contas, permissões e funcionalidades aceitas. Usar dados sintéticos e ambientes
  descartáveis; não aplicar seeds no banco de uso do usuário.
- Não ativar localhost ou serviços pausados sem ordem explícita. Quando autorizado, seguir as
  restrições operacionais de [docs/runbooks/local-workspace.md](docs/runbooks/local-workspace.md),
  atualizar o preview para a versão local atual e preservar o banco.
- Não ampliar o escopo para ações destrutivas, infraestrutura, dados ou integrações sem autorização
  correspondente. Organização genérica não autoriza apagar worktrees, runtimes, dependências, `.env`
  ou backups.

## Agentcache: caderno temporário de trabalho

O arquivo `docs/agentcache.md` é um caderno temporário, compartilhado pelas tarefas e worktrees que
usam a mesma pasta principal. Ler a cada prompt e antes de retomar uma etapa. Conferir o estado nos
arquivos e no Git; a anotação não substitui evidência nem concede autorização.

- Antes de iniciar qualquer trabalho, anotar objetivo/pedido, autoria e solicitante, estado,
  branch/worktree quando aplicável, próximo passo e impedimento. Cada frente ativa tem sua nota.
- Anotar também pedidos autorizados ainda não executados e trabalhos interrompidos ou aguardando
  resposta. Atualizar imediatamente ao receber correção, mudar de etapa, obter resultado ou
  encontrar impedimento; não esperar o fim da sessão. Reler antes de salvar para preservar outras
  frentes.
- Ao terminar uma etapa, atualizar na hora. Se restar trabalho, deixar apenas o estado e o próximo
  passo necessários. Ao concluir o pedido, retirar sua nota assim que conferir o resultado.
- Antes de retirar uma nota, transferir o que precisa durar: requisitos/decisões para a spec ou
  contrato responsável, tarefas futuras para a lista existente, evidências para a entrega, regras
  para este AGENTS e procedimentos locais para o runbook. Preservar autoria e referências.
- Não arquivar cada atualização. Excluir anotações descartáveis; guardar histórico relevante em
  `docs/history/` ou nas evidências da função. Backups locais ficam em `.cache/local-backups`.
- Não transformar o caderno em backlog completo, diário de conclusões, inventário antigo ou cópia
  das regras do projeto. Remover duplicatas após conferir que a fonte responsável preserva a
  informação.
- Conclusão não depende de publicação não solicitada: registrar a entrega pronta em sua evidência e
  retirar a nota de execução. Publicar, abrir PR ou integrar exigem a autorização correspondente.
- Em worktrees, usar somente o caderno da pasta principal, localizada pelo Git. O arquivo da
  worktree serve de entrada para essa regra, sem manter uma segunda fila. Em outra cópia
  independente, registrar o trabalho daquela cópia; não presumir que o caderno represente outro
  computador.
- Se ausente, criar o arquivo e reconstruir apenas contexto verificável. Não inventar autoria,
  autorizações ou estado anterior. Ao ficar sem trabalho pendente, deixar somente a orientação de
  uso e a indicação de que não há anotações ativas.
- Registrar somente informações necessárias à retomada, sem credenciais ou dados pessoais
  desnecessários.

### Autoria e solicitante dos registros

- Identificar cada pedido, atualização ou checkpoint do agentcache no formato
  `descrição-IA-solicitante`. Usar o nome do agente que efetivamente escreveu o registro (por
  exemplo, `CODEX`); não confundir agente autor com responsável humano ou modelo presumido.
- Obter o solicitante do perfil autenticado na conexão GitHub usada na sessão. Consultar o perfil
  pela integração disponível ou pelo endpoint autenticado `gh api user`. Usar o campo `name`; se
  vazio, usar `login`. Registrar também login, fonte e data da consulta.
- Consultar a identidade uma única vez no início de cada sessão e reutilizá-la em todos os registros
  dessa sessão. Em uma nova sessão, consultar novamente a conta conectada naquele computador; não
  reutilizar automaticamente a identidade de sessões anteriores ou de outro computador. Não inferir
  o solicitante de nome de pasta, configuração de autor Git, proprietário do repositório ou exemplo
  de conversa. Se conexões retornarem contas diferentes, esclarecer qual usar.
- Assinar cada bloco independente no título; seu texto herda essa autoria. Em tabelas de pedidos ou
  registros, identificar cada linha. Abrir atualização separada quando houver outro autor ou
  solicitante; não sobrescrever a atribuição original.
- Ao revisar ou importar histórico, preservar autor e solicitante comprovados. A conta conectada
  hoje não identifica retroativamente quem fez pedidos antigos. Quando faltar evidência, usar
  `IA_NAO_IDENTIFICADA` e/ou `SOLICITANTE_NAO_VERIFICADO`, com a lacuna explícita.
- Se a consulta autenticada falhar, registrar o solicitante como não verificado e informar a
  pendência; não inventar nome nem interromper trabalho independente da identificação.
- Manter nomes de contas e evidências da consulta no agentcache, sem personalizar estas instruções
  gerais e sem armazenar tokens, e-mails ou outros dados desnecessários.

## Comunicação sobre o Jira

Ao mencionar tickets, usar o título e o código, no formato Título (CAAB-N), sem links de tickets.
Aplicar a respostas e novos registros; preservar evidências e relações nativas existentes.
