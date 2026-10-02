# Consolidação documental — 02/10/2026

Autoria: CODEX. Solicitante não verificado: `gh api user` retornou HTTP401 nesta sessão. Entrega:
`docs/documentation-roles-20260923`, worktree `.cache/pr-docs-roles-20260923`. Escopo: Conciliar a
documentação do projeto (CAAB-38) e recorte documental de Consolidar o guia de design do projeto
(CAAB-39). Durante a execução, o usuário pediu divisão para abrir outra worktree; o fechamento de
acessos foi encaminhado a uma instância separada. Nenhuma publicação autorizada.

## Preservação e base

Inventário inicial confirmou 20 alterações documentais em `89d2356`. Antes de atualizar a base,
foram copiados os 20 arquivos, patches binários de working tree/índice e status para
`.cache/local-backups/docs-roles-20261002-114857` da principal. `manifest.json` registra caminhos e
SHA-256; todas as cópias foram verificadas. Fetch e fast-forward para `748539d` concluídos; os 20
hashes foram novamente comparados e permaneceram idênticos após a atualização. Não houve stash,
reset, remoção de pasta, aplicação de migration ou descarte de trabalho.

A principal permanece em dev; seus quatro documentos locais não rastreados foram preservados. Código
versionado limpo não significa pasta inteiramente limpa. Nenhum commit/push/PR foi criado. O caderno
da worktree continua somente como orientação para usar o caderno principal.

## Fontes e decisões conciliadas

O [manifesto de fontes](documentation-sources-2026-10-02.json) registra os hashes e caminhos
relativos à principal. Caminhos `.cache` são procedência local, não dependências disponíveis num
clone; os critérios e decisões necessários à entrega estão nos documentos consolidados abaixo. Não
copiar o diretório de evidências de outra frente nem converter suas notas em fila concorrente.

| Fonte                                                                          | Conteúdo incorporado e limite                                                                                                                                                                                                                                                                                 |
| ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Entrega documental de23/09 e seus 20 arquivos                                  | Mantida como base editorial. Preservados históricos, 21 pedidos assinados, contratos e regras de execução. [Evidência anterior](documentation-roles-2026-09-23.md) não foi reescrita.                                                                                                                         |
| Principal: AGENTS, guia, runbook e caderno                                     | Regra de títulos/códigos Jira, autorizações e decisões atuais. Caderno lido novamente antes de cada atualização; outras frentes preservadas.                                                                                                                                                                  |
| Entrega Jira/Confluence de01–02/10                                             | Estados integrado/local/QA, prioridade e responsabilidades. MODULES/PRD/STACK/TOOLING e topo do plano002 comparados por conteúdo. Mantidas as melhorias editoriais da entrega documental em vez de sobrepor documentos mais antigos.                                                                          |
| Spec011: application-summary, coherence, worktree-audit e worktree-publication | Evidências históricas da reorganização e publicação, com autoria original. Preservadas conversão nativa de Mostrar apenas funções autorizadas na navegação (CAAB-20), filtro salvo e índice do Banco como pendências da frente Jira. Não houve nova consulta/publicação remota nem cópia integral da spec011. |
| Design `ab643a5`                                                               | Guia e duas evidências já estavam idênticos. Incorporados seletivamente os blocos DS de spec/plano/tarefas/pesquisa/quickstart, ausentes nesta entrega, e os pontos de entrada frontend/template de PR. PR38 fechado sem integração não é entrega em dev.                                                     |
| Agendamentos `4e9abac` e Relatórios `748539d` com alterações locais            | Checkpoints/specs/evidências consultados somente para atualizar o mapa; não editados nem copiados. Validação atual permanece com os responsáveis pelas frentes.                                                                                                                                               |

As evidências originais de design usam T133–T140. Nesta conciliação, suas tarefas/referências foram
qualificadas como **DS-T133–DS-T140**, evitando colisão de T139/T140 com cargo único, integrado
posteriormente. Conteúdo e relações dos oito requisitos DS-FR, quatro critérios DS-SC e oito tarefas
foram preservados. A evidência original mantém seus IDs e resultados históricos sem reatribuição.

Os documentos UI-BUTTONS e VISUAL-REVIEW continuam históricos, com apontador explícito para o guia.
Essa preservação foi adotada na entrega de23/09; não repetir a remoção da antiga branch de design.
Os relatos DS importados identificam a remoção como acontecimento da fonte original. Guia único,
compactação, regras de campos/filtros, temas, rascunhos e critérios de revisão permanecem vigentes.
O mapa de interface de Parceiros e os contratos de cada função não foram substituídos por catálogo
visual. Não houve alteração de UI nem nova certificação visual/acessível.

## Resultado nos documentos

- [MODULES](../../../docs/MODULES.md): base integrada versus incrementos locais/aceite; permissões,
  navegação e bloqueio público não são mais apresentados como reconstrução pendente.
- [PRD](../../../docs/PRD.md): versão0.4, ordem atual e limites de comunicação/app/site, mantendo
  requisitos e decisões institucionais.
- [STACK](../../../docs/STACK.md): base748539d, autorização já integrada da cadeia de Auditoria e
  separação entre exportação direta do detalhe de Relatórios e caminhos legados. Manifests continuam
  autoridade de versões; sem instalação ou alteração de tecnologia.
- [TOOLING](../../../docs/TOOLING.md): referências Jira por título/código, sem links de tickets;
  validação documental explícita mantida.
- [Plano](../../002-integrated-modules/plan.md) e
  [tarefas do programa](../../002-integrated-modules/tasks.md): coordenação atual prevalece sobre
  prioridades históricas; pedidos e assinaturas preservados.
- Fundação: requisitos DS e fontes recuperados sem substituir os incrementos integrados de cargos.
  AGENTS do frontend e template de PR apontam ao guia. Contrato de cargos não foi modificado nesta
  execução; conserva a decisão pendente registrada em23/09.

## Decisões e trabalho que permanecem

1. Gerenciar cargos e acessos de Administrador, Gestor e Colaborador (CAAB-19): definir alcance do
   cargo base para contas atualmente sem cargo; não atribuir retroativamente. A nova instância
   prepara a matriz de aceite junto de Restringir criação de contas ao fluxo administrativo
   (CAAB-18) e Mostrar apenas funções autorizadas na navegação (CAAB-20). Esta entrega não declara
   esses aceites concluídos nem altera seu status remoto.
2. E-mails: integração e homologação adiadas por inexistência do serviço, em Entregar os avisos
   operacionais de Agendamentos por e-mail (CAAB-42) e Homologar os avisos operacionais após
   disponibilizar o serviço de e-mail (CAAB-45), dependentes de Serviço de e-mail transacional e
   definição da caixa de entrada (CAAB-2). Destinatários e caráter operacional já definidos.
3. Agendamentos/Relatórios: integrações/E2E da versão conciliada e entrega dos modos restantes de
   Relatórios pertencem às respectivas frentes. Evidência local não é integração ou QA humano.
4. Design: FormField com validação precoce, revisão assistiva de TableContainer e Tema Cores Legado
   permanecem no índice de pedidos do programa. Homologação humana do guia e correções funcionais
   não estão concluídas por esta conciliação; não promover cada observação de CSS a defeito
   confirmado.
5. Retenção, reanálise documental de dependentes, OAB institucional, Mensagens M016/T003 e canais
   externos mantêm decisões/limites nas fontes responsáveis. Não foi inventada regra institucional.

## Verificações da primeira etapa

- Prettier existente da principal, executado na worktree com `--ignore-path .gitignore`: escrita e
  conferência dos 30 arquivos da entrega (28 Markdown e dois JSON) aprovadas. Nenhuma dependência
  instalada. Comando:
  `node C:/Projetos/caabnovo/node_modules/prettier/bin/prettier.cjs --ignore-path .gitignore --check <arquivos alterados>`.
- `git diff --check` aprovado; diff da entrega contém somente documentação/evidência. Código,
  manifests, migrations e arquivos das frentes008/010/011 não foram editados por esta consolidação.
- Verificador local dos 28 Markdown alterados: 381 links relativos inline e 20 âncoras, zero
  destinos ausentes ou âncoras inválidas. URLs externas, links em bloco de código e outras formas
  Markdown não foram auditados integralmente. Caminhos com parênteses foram tratados pelo parser.
- Backup inicial: 20 cópias SHA-256 válidas; guia, relatório e JSON do design continuam idênticos
  byte a byte à fonte `ab643a5`. Nenhuma reexecução da auditoria original foi alegada.
- Conteúdo anterior dos cinco documentos da Fundação preservado integralmente, desconsiderando
  whitespace do formatador; acréscimos restritos aos blocos DS. Os 21 pedidos/assinaturas no
  programa foram preservados e nenhum dos 73 identificadores de requisitos do PRD desapareceu.
- Conferência de coerência: acesso/base integrada, exportação por consumidor, motivo obrigatório
  somente nas solicitações de exclusão, matriz de dependentes parcialmente definida, retenção
  adiada, módulos suspensos e envio real de e-mails não foram confundidos com entrega/homologação.
- Fetch final e comparação de refs: principal dev, origin/dev e HEAD da entrega em `748539d`, sem
  divergência. Worktree documental permanece com alterações locais; não houve commit/push/PR.

Testes de aplicação, builds, servidores, banco, browser, CI remoto e QA humano não foram executados
neste recorte documental. Resultados de22/09 importados continuam exclusivamente históricos. A
preparação de aceite de acessos foi transferida durante a execução; não está concluída por este
relatório. A entrega documental está preparada localmente, sem depender de publicação não
solicitada.

## Fechamento complementar após a divisão — 02/10/2026

Pedido: continuar a parte documental e fornecer resultado à instância de coordenação. Autoria:
CODEX; solicitante não verificado, reutilizando a consulta desta sessão. Mesma branch e base748539d.
A conferência complementar encontrou e corrigiu lacunas concretas no programa002:

| Documento       | Correção                                                                                                                                                                       | Limite preservado                                                                  |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| Spec002, FR-007 | Exceção de motivo para solicitações de exclusão de Colaboradores/Associados e precedência sobre o registro de14/09.                                                            | Sem alterar política, código, históricos ou contratos de acessos.                  |
| Modelo002       | Colaboradores referencia contas/RBAC existentes; remove interpretação ativa de cadastro separado de RH. Exportação direta distingue export_operation de jobs/arquivos legados. | Entidades futuras não são implementação autorizada; dados não alterados.           |
| Contratos002    | Estado integrado/local por consumidor, P01 parcialmente definido, análise manual, retenção e revisão de Mensagens preservados.                                                 | Três formatos/permissões/reautorização continuam exigidos; nenhum novo endpoint.   |
| Plano002        | Constituição2.1.0, bibliotecas já adotadas e correção da antiga reserva0028 para sobreposição: numeração0031–0034 pertence a Agendamentos.                                     | Não modificar SQL nem reservar números em nome de outra frente.                    |
| Tarefas002      | DOC01 histórico concluído, complemento documental concluído e T099 ainda aberta para revisão transversal final por função.                                                     | Não marcar T098/T100–T108, QA humano ou aceites de outras frentes como concluídos. |
| PRD/MODULES     | Distingue estados da agenda integrada/local e implementação local dos modos restantes de Relatórios, já registrada pela frente.                                                | Integração, validação final e homologação não presumidas.                          |

Os achados foram resolvidos por edição dos trechos responsáveis, sem nova spec ou sobrescrita dos
documentos das outras instâncias. A entrega pronta para revisão local não conclui T099, cujo alcance
inclui contratos/modelos/planos das funções em execução. Acessos continuam com a instância separada;
contas sem cargo permanecem decisão pendente. Não houve publicação, serviços ou validação funcional.

Validação final do complemento: 34 arquivos documentais (32 Markdown/dois JSON); formatação
explícita e `git diff --check` aprovados; 407 destinos locais e 20 âncoras conferidos sem falhas.
Mantidos os20 backups válidos, os21 pedidos assinados e os73 identificadores do PRD; guia e suas
evidências continuam idênticos à fonte. Conteúdo pré-existente da Fundação preservado, sem
alterações funcionais ou arquivos editados nas outras worktrees. Limites do verificador permanecem
os descritos na primeira etapa. O manifesto de fontes registra o resultado atualizado.

A frente de acessos iniciou em `.cache/pr-access-review-20261002`, branch
`docs/access-review-20261002`, base748539d, confirmada no caderno e Git. Na conciliação futura,
preservar os blocos DS adicionados nesta entrega e incorporar somente os trechos de acessos; não
substituir spec/plan/tasks inteiros. A conferência de código já realizada aqui serviu apenas ao mapa
documental e não substitui a matriz em preparação naquela instância.
