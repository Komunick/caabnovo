# Pesquisa e decisões — 01/10/2026

## Escopo responsável

Decisão: criar spec 011 para governança Jira/Confluence. Justificativa: 001 cobre fundação e 002 o
programa funcional; DOC01 de 002 é conciliação técnica anterior concluída. A pesquisa delegada de
leitura na principal e entrega documental existente não encontrou spec desta reorganização.
Alternativa rejeitada: acrescentar mais um escopo administrativo ao programa 002 e duplicar suas
regras.

## Granularidade e fluxo

Decisão: checklist por padrão; subtarefa para acompanhamento independente; manter tipos disponíveis
e fluxo atual. Justificativa: atende às decisões do usuário sem aumentar artificialmente o backlog.
Alternativas: criar N1–N9 ou transformar toda entrega em história/spike, rejeitadas pelo usuário.
Merge comprova integração, não validação humana. PR40 cobre somente o recorte detalhado sem
agrupamento.

## Conversão sem recriação

Decisão: usar conversão nativa no mesmo item, após conferir metadados e restrições. Justificativa:
preserva continuidade e evita duplicatas. Itens com subtarefas não podem ser convertidos diretamente
em subtarefa; diferenças de workflow/campos podem exigir Move. Não presumir que um PUT genérico
resolve qualquer conversão. Alternativa rejeitada: clonar e apagar o original. Fonte:
[Atlassian — work items e subtasks](https://support.atlassian.com/jira-software-cloud/docs/create-a-work-item-and-a-subtask/).

## Etiquetas e concorrência

Decisão: alterações por campo e etiquetas aditivas, com releitura imediatamente antes/depois.
Justificativa: a API aceita operações add/remove em labels e depende dos metadados de edição.
Alternativa rejeitada: substituir todo o conjunto de etiquetas ou aplicar snapshot antigo
integralmente. Fonte:
[Jira REST v3 — Edit issue](https://developer.atlassian.com/cloud/jira/platform/rest/v3/api-group-issues/#api-rest-api-3-issue-issueidorkey-put).

## Conhecimento para a equipe

Decisão: páginas existentes preservam IDs; sugestões aprovadas mudam de posição; versões substituem
histórico repetido no corpo. Justificativa: Confluence fornece comparação/restauração de versões.
Alternativa rejeitada: nova página para cada revisão ou Confluence limitado a instruções para IA.
Fonte:
[Atlassian — páginas e histórico](https://support.atlassian.com/confluence-cloud/docs/create-edit-and-publish-a-page/).

Decisão: checar versão e rascunhos antes de publicar. Se o conector não expõe rascunho/concorrência,
registrar limitação e não sobrescrever conteúdo desconhecido. A API pode reconciliar texto publicado
e rascunho, inclusive sobrescrever rascunho divergente. Alternativa rejeitada: atualização cega.
Fonte:
[Confluence REST v2 — Update page](https://developer.atlassian.com/cloud/confluence/rest/v2/api-group-page/#api-pages-id-put).

## Limites resolvidos por contrato

Não há dependência de biblioteca nova nem runtime a escolher. Permissões de conversão, accountIds,
status atual, rascunhos e existência de equivalentes são pré-condições verificáveis na execução, não
decisões de produto pendentes deste plano. Escopo da caixa de entrada permanece pendência da própria
funcionalidade; organizar seu registro não autoriza inventar ou implementar esse escopo.
