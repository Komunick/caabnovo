# Decisões e entradas por domínio

Data: 09/09/2026. Fontes oficiais e análise de produto em
[direção de produto](../../docs/analise-direcao-produto-2026-09-09.md); sua ordem de entregas foi
substituída pelo escopo integrado. Pesquisa técnica no projeto novo, documentação Next.js instalada
e revisão independente da fusão, somente leitura. Nenhum legado consultado.

## Decisões técnicas

| Decisão                                         | Racional                                                                                                           | Alternativas rejeitadas                                                                 |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------- |
| Uma área Auditoria com Eventos e Processamentos | Reaproveitar serviços e dados sem ampliar acesso.                                                                  | Tabela unificada, permissão única ou duas entradas principais.                          |
| Menu visível com audit:read OU jobs:read        | Operador só de jobs deve entrar sem ler eventos. Destino /audit se pode ler eventos, senão /audit/jobs.            | Guarda audit:read em toda a árvore, que também bloquearia exportações com audit:export. |
| Catálogo único                                  | AuthorizedNav, WorkspaceControls e dashboard repetem a mesma lista. Busca preserva sinônimos “operações” e “jobs”. | Manter três listas divergentes ou anunciar módulo ainda não implementado.               |
| Canônicas /audit/jobs e detalhe                 | Rotas antigas redirecionam; APIs /api/v1/jobs e serviços permanecem. Sem migration.                                | Copiar páginas/serviços ou perder favoritos.                                            |
| Reutilizar fundação                             | Better Auth, RBAC, arquivos, PostgreSQL e pg-boss já existem.                                                      | Novo login, storage ou fila por módulo.                                                 |
| Payload/Lexical previstos                       | Escolha atual de STACK, a verificar com auth/arquivos atuais antes de integrar.                                    | Trocar stack sem evidência ou importar CMS como autoridade de todo domínio.             |

Achados: lista de jobs limitada a 100 exige paginação/filtros na entrega. Reenvio verifica
jobs:redrive antes de alterar, mas consulta o resultado com jobs:read depois: acrescentar exigência
de leitura antes da mutação e regressão em tarefa específica. Portal exige escopo por organização
ainda novo.

## Decisões institucionais rastreadas

| História | Entrada necessária                                                          | Até definição                                                     |
| -------- | --------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| US2      | Publicadores/revisores, aprovação, canais, mídias e contratos.              | Conteúdo/consumidor sintético; sem distribuição real presumida.   |
| US3      | Vínculos, documentos, campos mínimos, fontes e matriz de elegibilidade.     | Não automatizar consequências; estado não verificado explícito.   |
| US4      | Serviços/recursos, duração/capacidade, jornada, cancelamento e falta.       | Configuração sintética; não apresentada como política CAAB.       |
| US5      | Condições, vigência, visibilidade e moderação.                              | Não publicar oferta real incompleta.                              |
| US6      | Unidades/setores, escopos, recuperação e campos sensíveis.                  | Reutilizar contas sem conceder novos privilégios automaticamente. |
| US7      | Públicos congelados/dinâmicos, preferências, canais e volumes.              | Sem contratação/envio real ou confirmação fictícia.               |
| US8      | Finalidade, unidade/conversão, limites, validade, uso/correção e aprovador. | Sem equivalência monetária ou concessão real presumida.           |
| US9      | Tarefas delegáveis, estados de solicitação e relação com créditos.          | QR é identificador; sem liquidação presumida.                     |
| US10     | Finalidade, campos e público de relatórios.                                 | Apenas métricas derivadas e com significado explícito.            |

Essas entradas são tarefas por história e não bloqueiam US1. T089/T095 continuam gates de produção.
