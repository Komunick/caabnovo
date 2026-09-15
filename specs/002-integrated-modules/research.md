# Decisões e entradas por domínio

## Gestão de Agendamentos pela CAAB — 15/09/2026

O usuário definiu administração pela CAAB no painel, acessível para consulta e
alterações a qualquer pessoa com acesso válido ao painel, sem concessão adicional
de Agendamentos. A unidade oferece vários serviços, com profissionais, procedimentos,
horários de funcionamento e avaliações. O módulo administra o serviço de reservas
do app/site. Não pressupor contas administrativas independentes para profissionais.

Pesquisa atual em fontes oficiais de Cal.com, Trinks, SimplyBook.me e Fresha:
[relatório, evidências, propostas e questões abertas](pesquisa-gestao-agendamentos-2026-09-15.md).
Constatadas configurações separadas de catálogo/equipe, funcionamento/disponibilidade,
exceções, recursos e operação de avaliações. A nomenclatura varia entre produtos;
o mapeamento serviço/procedimento da CAAB ainda precisa de validação.

Cal.com serve de referência; **integração somente se nenhuma outra possibilidade
for encontrada**, por determinação do usuário. A pesquisa não demonstra essa condição
e não propõe integração. Solução própria permanece a direção a avaliar; nenhuma prova
técnica de implementação foi executada. Nenhuma dependência, conta ou infraestrutura criada.

O registro de 14/09 abaixo é histórico onde divergir destas decisões. Implementação
permanece pendente; o acesso amplo definido aqui não altera outros módulos.

## Pesquisa de mercado de Agendamentos — 14/09/2026

O usuário esclareceu que o módulo permitirá aos profissionais configurar sistemas
de reservas para áreas diversas: barbearia, medicina, futevôlei, fisioterapia,
psicologia, spa e zumba. Restaurantes são apenas possibilidade futura. Solicitou
**somente pesquisa e registro para revisão posterior**, sem iniciar implementação.

Conclusões e fontes oficiais em
[pesquisa-mercado-agendamentos-2026-09-14.md](pesquisa-mercado-agendamentos-2026-09-14.md).
O relatório diferencia evidência de fornecedor, inferência e decisão ainda pendente.
Sugere avaliar modelos individuais/coletivos e recursos físicos, com grade recorrente,
inscrição fixa e séries de sessões como conceitos distintos. Não define arquitetura,
regras clínicas, políticas comerciais, permissões ou primeira entrega como aprovadas.

## Revisão de nomenclatura e disponibilidade — 14/09/2026

Fonte de negócio: o usuário corrigiu o nome para **Agendamentos**, solicitou novo
brainstorming para uma grande evolução e desativou CAASSH até revisão. A sugestão
anterior de regras configuráveis sem penalidades não foi confirmada.

Inspeção: CAASSH existe apenas como cartão informativo em `app/(admin)/page.tsx`;
não existem rotas, serviços ou tabelas de créditos no código atual. A alteração
explicita o estado textual e mantém o cartão sem ação. Não exige feature flag,
migration ou remoção de infraestrutura.

Referência oficial consultada em 14/09/2026:
[Next.js — Pages](https://nextjs.org/docs/app/api-reference/file-conventions/page),
com conferência da documentação instalada de Next.js 16.3.4. Manter renderização
no servidor para estes textos estáticos, sem JavaScript ou dependência adicional.
A pesquisa de concorrência anteriormente iniciada não determina o novo escopo;
uma pesquisa específica acompanhará o desenho resultante do brainstorming.

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


## Regra vigente: nenhuma justificativa obrigatória — 14/09/2026

Fonte de negócio: instrução expressa do usuário nesta data para remover motivos de todas as abas. A [OWASP Logging Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html), consultada em 14/09/2026, orienta registrar contexto da ação e identidade. Decisão do projeto: rastreabilidade é automática e não depende de justificativa escrita. O inventário encontrou validações em UI, contratos, serviços e CHECKs SQL; retirar todas as camadas da obrigatoriedade, preservando histórico e permissões. Não presumir que o usuário forneceu um motivo automático.
