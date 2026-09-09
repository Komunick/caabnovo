# Pesquisa e decisões — Notícias

Data: 09/09/2026. Evidência documental oficial atual; não houve teste de demos nem consulta ao
legado.

## Mercado atual

| Referência                                                                               | Prática documentada                                                                       | Decisão CAAB                                                              |
| ---------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| [Payload Drafts](https://payloadcms.com/docs/versions/drafts)                            | Rascunho e publicado coexistem, com histórico e agendamento                               | Salvar não publica; restaurar produz rascunho                             |
| [Sanity Scheduled Drafts](https://www.sanity.io/docs/studio/scheduled-drafts)            | Revisão agendada dentro de release individual                                             | Fixar revisão e destinos da ação                                          |
| [Contentful Scheduled Publishing](https://www.contentful.com/help/scheduled-publishing/) | Publicação/retirada com acompanhamento de ações; limite próprio de 200 entradas pendentes | Mostrar ação, data, cancelamento e resultado; não copiar limite comercial |

Sanity [substitui o agendamento antigo](https://www.sanity.io/docs/studio/scheduled-publishing) por
Scheduled Drafts/Content Releases. Pesquisar novamente ao evoluir a função evita reproduzir soluções
descontinuadas. Mercado orienta interação; regras locais continuam sendo decisão da CAAB.

## Decisão de acesso confirmada

O usuário confirmou que pessoas já autorizadas ao painel podem operar Notícias, sem nova permissão
ou segunda aprovação. O layout atual usa resolveCurrentUser/loadActiveSession. Reutilizar a mesma
identidade ativa, também em serviços/API. Não criar news:*; não modificar permissões de arquivos,
usuários ou auditoria. Mídias exigem integração com files respeitando seus controles existentes.

## CMS e compatibilidade

Decisão: manter Payload/Lexical previsto na stack. Candidato estável
[v3.88.0](https://github.com/payloadcms/payload/releases/tag/v3.88.0), publicado em 11/08/2026.
[Manifesto Next](https://raw.githubusercontent.com/payloadcms/payload/v3.88.0/packages/next/package.json)
declara Next >=16.2.6 <17 e Node ^18.20.2 ou >=20.9.0;
[manifesto Lexical](https://raw.githubusercontent.com/payloadcms/payload/v3.88.0/packages/richtext-lexical/package.json)
aceita React/DOM ^19.0.1, ^19.1.2 ou ^19.2.1. As versões locais satisfazem essas faixas. Isso não
comprova instalação, build ou integração. Main do fornecedor está em canary 4, não é referência para
instalar a versão estável.

Racional: conteúdo estruturado, versões e editor existentes evitam recriar CMS. Alternativas:
Sanity/Contentful acrescentariam serviço externo e outra operação; implementação própria de versões
duplicaria capacidades já escolhidas. Nenhuma contratação é necessária para iniciar contratos
locais.

## Integração sem duplicatas

Decisão: Local API somente atrás do domínio; Better Auth continua autoridade de identidade.
[Custom Strategies](https://payloadcms.com/docs/authentication/custom-strategies) permite substituir
login local, mas exige usuário Payload; não presumir bridge sem coleção espelho.
[Local API](https://payloadcms.com/docs/local-api/overview) tem bypass de acesso/lock por padrão: o
adaptador deve declarar explicitamente autorização e concorrência; nunca expor acesso direto.
Propagar req transacional. Não assumir atomicidade entre conexões Payload e audit-writer distintas.

[Postgres](https://payloadcms.com/docs/database/postgres) e
[migrations](https://payloadcms.com/docs/database/migrations): usar migration revisada com push
desativado; schemaName é experimental. Testar falha de auditoria e rollback antes de expor mutação.
Reutilizar stored_file para mídia e pg-boss para agenda, evitando upload e executor concorrentes.

## Início implementável

Contratos estritos de metadados, preparação de rascunhos e pré-condições de publicação não dependem
de instalar o CMS nem dos contratos externos. Dados de revisão, acesso e verificação de arquivos
serão carregados pelo serviço, nunca aceitos como evidência do cliente. A validação não substitui
transação/controle concorrente nem sanitização do corpo Lexical; esses itens permanecem nas tarefas.

## Atualização: versões e editor textual — 09/09/2026

Reconsulta às fontes oficiais: [Payload Drafts](https://payloadcms.com/docs/versions/drafts) mantém
rascunho separado da publicação; [Versions](https://payloadcms.com/docs/versions/overview) oferece
consulta e recuperação de versões. A CAAB copia a versão escolhida para um rascunho novo, para não
restaurar acidentalmente o estado publicado.
[Contentful Versions](https://www.contentful.com/help/content-and-entries/versions/) reforça a
utilidade do histórico e recuperação no fluxo editorial.

A documentação atual de [plugins Lexical](https://lexical.dev/docs/react/plugins) recomenda
extensões quando disponíveis. A versão 0.41.0 instalada contém LexicalExtensionComposer,
RichTextExtension e ListExtension; essas APIs foram conferidas no pacote local e usadas no editor.
[Integração React](https://lexical.dev/docs/getting-started/react) orienta serialização via toJSON e
estado de editor não controlado. A extensão fica estável e só reinicia ao recuperar outra versão.

Instalação, transações, build e jornada textual agora estão demonstrados em evidence.md. A
configuração oficial withPayload foi adotada após o primeiro build tentar incluir ferramentas de
migration no bundle. Nenhum Admin ou endpoint nativo do CMS foi exposto.

## Atualização: capa e destinos mobile — 09/09/2026

A API oficial do [Contentful](https://www.contentful.com/developers/docs/references/content-management-api/overview/)
separa operações de upload, processamento e publicação de assets. A documentação de
[uploads do Payload](https://payloadcms.com/docs/upload/overview) descreve a capacidade nativa de
arquivos. Decisão CAAB: aproveitar os estados de upload/quarentena já existentes, mantendo uma
única infraestrutura de arquivos. A capa pode ficar vinculada ao rascunho enquanto é verificada;
prévia e publicação exigem evidência de disponibilidade e verificação no servidor.

Por orientação do usuário, o app mobile é consumidor de parte das funções. Site e app mantêm
destinos separados e compartilham o cadastro editorial; publicar no app não implica push. O
serviço interno já foi testado com canal app exclusivo. Contrato de entrega/consulta e credenciais
serão definidos antes de conectar consumidores reais; essa decisão não exige novo spec.

## Atualização: imagens no corpo e contrato de consumo — 09/09/2026

[Lexical Nodes](https://lexical.dev/docs/concepts/nodes) permite DecoratorNode para componentes no
corpo. O bloco CAAB guarda dados serializáveis e referências a arquivos, sem URLs livres. Essa
escolha permite descrição/legenda, ordenação, revisão e renderização própria no site/mobile. APIs
de React, serialização e histórico foram conferidas também no pacote 0.41.0 instalado.

[Contentful API basics](https://www.contentful.com/developers/docs/references/api-basics/) distingue
entrega somente leitura para apps/sites da API de prévia. [Sanity Drafts](https://www.sanity.io/docs/content-lake/drafts)
mantém rascunhos ao lado do publicado. Decisão CAAB: projetar apenas o registro publicado, por
canal, com contrato versionado e campos editoriais explícitos. Consulta pelos consumidores é o
desenho recomendado; a interface de dados já pode ser testada sem assumir APIs/credenciais reais.

O E2E encontrou Desfazer sem estado inicial após reabrir o editor. O HistoryPlugin instalado cria
histórico vazio por padrão; inicializá-lo com editor.getEditorState() preserva a primeira operação
e tags HISTORY_PUSH_TAG separam ações de bloco. A jornada corrigida passou com imagens, prévia,
recuperação e Axe em 390px.

## Fechamento da decisão de distribuição em 09/09/2026

O usuário determinou leitura aberta por qualquer pessoa, revisável futuramente. Adotada API
de consulta pública por canal, mantendo sessão para escrita/prévia/histórico. Isso resolve
a dúvida inicial de autenticação/transporte sem inventar credenciais de um consumidor externo.
Disponibilidade do conteúdo não significa confirmação de consumo.

[Contentful References](https://www.contentful.com/help/references/) documenta reutilização
por referência. Destaques usam a própria notícia/revisão, capa e destinos, com ordem explícita,
sem copiar texto para um cadastro de slides. [Scheduled publishing](https://www.contentful.com/help/scheduled-publishing/)
expõe publicação/retirada e linha do tempo; aplicamos agenda no editor, revisão fixa e
cancelamento. [Payload versions](https://payloadcms.com/docs/versions/overview) e
[drafts](https://payloadcms.com/docs/versions/drafts) sustentam a separação entre edição e
publicação. O executor permanece pg-boss existente; não habilitamos um segundo scheduler CMS.

A indicação anterior de esbuild incompatível foi resolvida com override específico de
drizzle-kit>esbuild 0.28.2, comprovado por peers sem erros e geração offline de migration.
