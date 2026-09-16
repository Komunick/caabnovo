# Pesquisa da fusão

## Processamentos US3 — pesquisa de 15/09/2026

Fontes oficiais consultadas antes do código:

- [AWS Step Functions, ListExecutions](https://docs.aws.amazon.com/step-functions/latest/apireference/API_ListExecutions.html): consulta operacional por estado, resultados recentes primeiro e continuação mantendo filtros.
- [PostgreSQL, LIMIT/OFFSET](https://www.postgresql.org/docs/current/queries-limit.html): paginação requer ordem única; grandes offsets ainda calculam registros descartados.
- [OWASP, Authorization](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html): validar autorização em cada requisição, negar por padrão e testar controles.

Decisão: cursor por created_at/id decrescentes, 25 registros por padrão e máximo 100;
filtros exatos de estado e tipo no servidor; próxima página e retorno ao início mantêm
filtros. Preservar microssegundos do PostgreSQL no cursor, sem conversão intermediária
para Date. Consulta é ao estado atual, sem promessa de snapshot se um worker alterar
estados entre páginas. Tipos existentes continuam consultáveis por campo digitável.
Verificar jobs:read e jobs:redrive no serviço e na rota antes de iniciar fila/transação.
Sem nova API pública, tabela, dependência ou política de retry. Fontes são referências
de desenho, sem integração AWS nem adoção de suas regras de expiração de tokens.

Decisão, racional, alternativas e revisão técnica em
[pesquisa do programa](../002-integrated-modules/research.md). Somente código do projeto novo.

Decisão: mostrar Auditoria com audit:read OU jobs:read; destino /audit para eventos, /audit/jobs
para operador só de jobs. Layout não bloqueia toda árvore com audit:read: exportação depende de
audit:export e jobs dependem de jobs:read. Guardas ficam nas páginas/serviços.

Alternativas rejeitadas: segunda tabela/central de jobs, acesso unificado concedido automaticamente,
duplicação de páginas ou perda dos favoritos. Catálogo único elimina três listas equivalentes.

Nenhuma decisão institucional bloqueia essa funcionalidade. Limite conhecido de 100 jobs e
pré-condição de reenvio ficam explicitamente fora desta fusão, rastreados como próximas funções do
programa.


## Regra vigente: nenhuma justificativa obrigatória — 14/09/2026

Fonte de negócio: instrução expressa do usuário nesta data para remover motivos de todas as abas. A [OWASP Logging Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html), consultada em 14/09/2026, orienta registrar contexto da ação e identidade. Decisão do projeto: rastreabilidade é automática e não depende de justificativa escrita. O inventário encontrou validações em UI, contratos, serviços e CHECKs SQL; retirar todas as camadas da obrigatoriedade, preservando histórico e permissões. Não presumir que o usuário forneceu um motivo automático.

## Retirada do armazenamento legado — 15/09/2026

Decisão de 15/09/2026: backend único PostgreSQL, conforme pesquisa da [fundação](../001-project-foundation/research.md). Mantém a transação já existente dos bytes/metadados e reduz infraestrutura, sem mudar finalidade ou acesso à exportação.
# Pesquisa T014 — 15/09/2026

Fontes oficiais consultadas: [OWASP Logging Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html) orienta registrar momento, autoria, ação e alvo, proteger acesso e excluir dados sensíveis. [GOV.UK, Style and formatting](https://www.gov.uk/government/uploads/system/uploads/attachment_data/file/466003/Research_Publication_-_Formatting_and_Style_guide.pdf) recomenda escrita clara e evitar jargão desnecessário.

Decisão: derivar frases em português de códigos conhecidos, conservar evidência original nos detalhes e no JSONL e limitar enriquecimento aos nomes autorizados. Nomes atuais não provam nomes históricos: esclarecer isso na tela. Não usar geração livre de texto, inferir identidades ou inserir valores privados na frase. Não expandir a pesquisa para retenção ou regras jurídicas, fora desta mudança de apresentação.
## Reformulação após revisão do usuário — 15/09/2026

O usuário não aprovou a apresentação inicial e solicitou pesquisa de mercado e reformulação.

| Referência oficial | Padrão observado | Aplicação no CAAB |
| --- | --- | --- |
| [GitHub, revisão do audit log](https://docs.github.com/en/organizations/keeping-your-organization-secure/managing-security-settings-for-your-organization/reviewing-the-audit-log-for-your-organization) | Evento contextualiza autor, ação, pessoa afetada e momento; filtros por autor/ação/data. | Resumo principal com autoria e ação em português, horário e categoria discretos; manter filtros e cursor no servidor. |
| [Atlassian, view audit log activities](https://support.atlassian.com/security-and-access-policies/docs/view-audit-log-activities/) | Lista filtrada por atividade, usuário e datas; painel lateral para examinar um evento sem sair da lista. | Substituir expansão de JSON dentro da tabela por painel lateral acessível com resumo, mudanças e seção técnica recolhida. |
| [Microsoft Entra, audit logs](https://learn.microsoft.com/en-us/entra/identity/monitoring-health/concept-audit-logs) e [filtros](https://learn.microsoft.com/en-us/entra/identity/monitoring-health/howto-customize-filter-logs) | Informações essenciais visíveis; valores anteriores/novos nos detalhes; atividades disponíveis dependem da categoria. | Mostrar antes/depois dos campos reconhecidos em linguagem simples e agrupar opções de ação por área. |

Decisão de design: histórico compacto agrupado por data, com ícone da área, frase principal e horário; filtros diretos por pessoa, área, ação e período; detalhe lateral que preserva posição/filtro e funciona em tela cheia no celular. Essa organização é uma adaptação ao público administrativo do CAAB, não uma cópia literal dos produtos pesquisados. Sem gráficos decorativos, contagens globais inventadas, estados de sucesso inferidos ou captura de IP inexistente. Não alterar retenção, registro imutável ou permissões. Atualizar preview com build remoto para preservar o limite de recursos do PC.

## Camadas do modal — 16/09/2026

Referência oficial: [W3C APG Dialog Modal](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/) recomenda conteúdo de fundo inerte e visualmente obscurecido. Diagnóstico: backdrop z-index10 estava abaixo do topbar20; painel também20 e navegação móvel60. Decisão: backdrop80/dialog90 no componente visual compartilhado, validando ordem real de pintura além dos números CSS. Manter foco/semântica Radix existentes e revisar os demais diálogos no E2E completo.


## Estado ao navegar — 16/09/2026

Os guias locais do Next16.3.4 (preserving-ui-state e cacheComponents) confirmam que layouts
compartilhados conservam estado; Activity do framework retém somente três rotas e não atende
à preservação geral solicitada. Usar contexto em memória no layout autenticado, separado por
identidade e formulário; manter versões originais para conflito seguro. O padrão do campo UF
usa input/list: [MDN datalist](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/datalist).
Sugestões não validam sozinhas a seleção; conferir identificador válido antes de enviar.
