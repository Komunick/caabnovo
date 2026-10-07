# Conciliação Jira e projeto — 02/10/2026

Autoria: CODEX. Solicitante não verificado: consulta gh api user retornou HTTP 401 nesta sessão.
Autorização: aplicar os ajustes da auditoria e atualizar documentação. Não houve nova autorização de
implementação, publicação de código ou retomada de Agendamentos.

## Resultado

Inventário completo de 42 tickets relido. Aplicadas 19 descrições e quatro transições, sem criar ou
excluir tickets, alterar responsáveis ou declarar QA humano. As descrições dos 12 concluídos
receberam delimitação de escopo, fontes e lacunas da homologação histórica.

| Ticket                                                                      | Estado confirmado  | Trabalho restante                                                                 |
| --------------------------------------------------------------------------- | ------------------ | --------------------------------------------------------------------------------- |
| Restringir criação de contas ao fluxo administrativo (CAAB-18)              | Em Teste / QA      | Aceite humano do bloqueio público e preservação dos fluxos administrativos        |
| Gerenciar cargos e acessos de Administrador, Gestor e Colaborador (CAAB-19) | Em Desenvolvimento | Matriz de aceite humano e decisão sobre contas sem cargo                          |
| Mostrar apenas funções autorizadas na navegação (CAAB-20)                   | Em Teste / QA      | Aceite de navegação/servidor/revogação e conversão nativa de tipo/pai             |
| Disponibilizar motor compartilhado de download direto (CAAB-22)             | Em Teste / QA      | Aceite humano do núcleo, incluindo revalidação e limites da evidência             |
| Definir canais institucionais de comunicação (CAAB-33)                      | Backlog            | M016/T003 explícito: revisão de aderência e continuidade antes de nova construção |

Implementação (CAAB-4) e UI e UX (CAAB-5) continuam históricos, com status preservado e orientação
para exclusão do acompanhamento ativo. A consulta JQL retornou 36 de 42 tickets e excluiu exatamente
esses históricos, Validação de e-mail incorporada ao CAAB-2 (CAAB-21), Portal de Parceiros —
funcionalidade prevista (CAAB-34), CAASSH — funcionalidade prevista (CAAB-35) e RH — sugestão em
avaliação (CAAB-36). Etiquetas e relações existentes foram preservadas.

## Documentação

MODULES reconcilia a base integrada 748539d com incrementos locais. PRD e STACK apontam para esse
estado, corrigindo cadastro público, cargos, acessos e recorte de exportação de Relatórios. TOOLING
e AGENTS local registram referências por título e código, sem links de tickets. Spec, plano e
tarefas desta entrega registram o complemento autorizado.

Confluence: Visão do projeto (819227) e Organização do Jira e Confluence — proposta e modelos
(7143436) atualizadas e relidas na versão 4, mantendo IDs e pais. Incluem estado integrado/local, QA
pendente, M016/T003 e regra de referência a tickets. As páginas avisam que a atualização dos
arquivos do repositório permanece local, sem publicação em dev.

## Validação e limites

- Textos relidos e comparados com a proposta; única normalização relevante foi espaçamento da lista
  de aceite de Mensagens. Caminho da spec de Notícias corrigido para 004-news-publishing.
- Todos os 42 IDs preservados; 12 concluídos mantêm status; responsáveis, labels e pais preservados.
- Snapshot antes da escrita e comparação de updated por ticket; versões do Confluence relidas antes
  da substituição do HTML e depois da publicação.
- Consulta JQL completa, sem paginação restante; filtro compartilhado não alterado.
- Formatação Markdown, referências locais novas e git diff --check conferidos no fechamento.
- Não foram executados testes funcionais novos nem homologação/deploy.

## Pendências técnicas de operação

1. Mostrar apenas funções autorizadas na navegação (CAAB-20): continua Tarefa sem pai. Conversão
   pela edição genérica já falhou na execução anterior; requer operação nativa no mesmo ticket.
2. Salvar filtro separado de trabalho ativo. JQL está validada e publicada na página de organização,
   mas o conector não oferece salvar filtro.

Inventário de navegadores vazio; tentativas de abrir Chrome e IAB retornaram indisponibilidade. Não
foram recriados tickets ou alterado o quadro para contornar esses limites. A pendência anterior do
índice do Banco de Consulta da I.A. permanece na execução original, fora deste ajuste.

Artefatos: proposta e snapshot anterior em `coherence-2026-10-02-plan.json`; releitura e resultados
em `coherence-2026-10-02-results.json`. São evidências privadas preservadas na worktree histórica
`.cache/pr-jira-confluence-20261001`, sem publicação de identificadores de contas Atlassian. Entrega
local na branch docs/jira-confluence-organization-20261001, sem commit, push ou PR.
