# Revisão da evidência pública do PR48 — 07/10/2026-CODEX-mafaltti

## Escopo

O usuário apresentou três achados de revisão: a regressão de expiração dos grants de upload cobria
somente finalização; documentos públicos relacionavam nomes pessoais a tickets; referências citavam
evidências omitidas do PR. Esta correção não altera tickets, atribuições remotas, decisões de
produto ou permissões.

## Cobertura de uploads

A regra existente de revalidação de Associados/arquivos após lock vale para criação, replay e
finalização. O teste de `e5c94c7` comprovava dinamicamente só o terceiro caminho. A nova matriz de
`apps/web/tests/integration/scheduling-absence.test.ts` acrescenta criação e replay, com espera
observável no PostgreSQL, vencimento pelo relógio do banco e snapshots que comprovam negação sem
efeitos adicionais. A sessão e Agendamentos permanecem válidos para isolar a causa da negação.

O PR46 já foi integrado em dev `1c21c9a`; essa base foi incorporada à branch do PR48 sem conflitos.
O CI anterior de `e5c94c7` permanece histórico e não comprova a nova matriz nem esta composição. O
resultado da nova ponta será registrado no corpo do PR após o CI. PostgreSQL e E2E não foram
executados localmente por esta correção.

## Publicação e preservação

Referências pessoais da evidência pública são apresentadas por papéis, mantendo IA autora, decisões,
códigos de tickets, datas, estados e referências de commits/PRs. Identificadores de conta e nomes
completos usados no levantamento original não são necessários para explicar a reorganização.
Originais foram preservados em backups locais ignorados pelo Git, com hashes verificados antes da
alteração; não se substituiu a identidade histórica pelo solicitante atual.

Os arquivos omitidos por privacidade, incluindo `capabilities.md`, constituem evidência local do
levantamento original. As referências públicas passam a declarar esse limite em texto, sem links
relativos para arquivos inexistentes ou alegação de que essas provas estão publicadas. Não se
inventou conteúdo substituto, nem se apagou o original. A alteração da árvore atual não reescreve
commits históricos.

## Validação e limites

Conferir formato explícito dos Markdown/JSON alterados, links e diff; revisar independentemente os
três caminhos de lock e a preservação de evidência. A nova matriz PostgreSQL e os gates completos
dependem do CI da ponta publicada. Nenhum resultado do relatório truncado fornecido na conversa é
atribuído automaticamente a esta versão. Revisão humana específica e homologação permanecem
independentes do CI.
