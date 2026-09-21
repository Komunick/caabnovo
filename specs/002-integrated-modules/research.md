# Pesquisa vigente — 21/09/2026

**Decisão:** Ordenar as adequações de todas as funções, manter escopo institucional adiado e rastrear validações por módulo sem reconstruir funções aceitas.

**Fundamento:** Percorrer a matriz de módulos/subáreas, três formatos, zero descoberta sem acesso, dados completos e campos autorizados; reconciliar tarefas/evidências por função e políticas adiadas sem marcar homologação ausente.

**Alternativas:** rejeitar cópia de cadastro, concessão implícita, exportar pela página
visual, gerar Buffer integral e reintroduzir fila/limites funcionais. Quando a função
não implementa exportação nesta fase, preservar seus controles existentes.

**Evidência local:** `docs/EXPORT-STANDARD.md`, `docs/MODULES.md`, `docs/STACK.md`.
Desenho concreto em [plan.md](plan.md). Fontes oficiais, data, limitações e alternativas
na [pesquisa transversal](../002-integrated-modules/research-2026-09-21.md).
Essa revisão não homologa dependências, desempenho ou produto; testes estão no quickstart.

## Pesquisa anterior — contexto histórico

Decisões de fluxo/armazenamento/exportação anteriores são substituídas pelo plan de 21/09
onde conflitarem; referências antigas não autorizam funções adiadas.

# Decisões e entradas por domínio

## Contraste durante troca de tema — 15/09/2026

Fonte oficial reconsultada antes da correção: [W3C, WCAG 2.2, contraste mínimo](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html).
O E2E da agenda encontrou contraste de 3,83:1 no texto pequeno do menu da conta
durante a animação do fundo. Decisão: cores do texto e fundo mudam juntas;
preservar somente a animação da borda, conforme os botões compartilhados existentes.
Validar transição por amostras em frames e Axe, sem desativar a regra de contraste.

## Planejamento incremental — 15/09/2026

Pesquisa complementar e decisões da primeira entrega em
[spec 008/research.md](../008-scheduling-management/research.md). Usuário escolheu
operar primeiro pelo painel; conexão real app/site depois. Pesquisa apoia lista
diária com ações, catálogo e horários mínimos; essa escolha é inferência de adequação
ao recorte, não superioridade universal de lista sobre calendário. Três etapas em
[roadmap](../008-scheduling-management/roadmap.md). Nenhuma implementação nesta etapa.

## Horários e separação entre legado e sugestões — 15/09/2026

O usuário determinou deixar funções ausentes do site antigo como sugestões,
citando controle de salas, e pediu detalhamento do gerenciamento de horários.
Inspeção somente leitura do código local anterior: horários semanais da unidade
e profissional, almoço, indisponibilidades por período e agenda extra possuem
modelos e telas; antecedência mínima e limite futuro foram confirmados na API.
Não houve validação do site publicado. [Fontes e limites](horarios-legado-2026-09-15.md).
Recursos e práticas de mercado sem confirmação no legado não integram automaticamente
o escopo. Administração, acesso amplo ao painel e restrição sobre Cal.com permanecem.

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

## Revisão de homologação — 16/09/2026

GitHub documenta rulesets públicos, checks vinculados ao GitHub App e exigência de PR: https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/available-rules-for-rulesets . A API do repositório confirmou acesso administrativo e ruleset ativo de dev nesta data; conferir main e promoção sem push direto nem merge.

O guia da ANPD identifica os papéis de agentes de tratamento e encarregado: https://www.gov.br/anpd/pt-br/centrais-de-conteudo/materiais-educativos-e-publicacoes/guia-orientativo-para-definicoes-dos-agentes-de-tratamento-de-dados-pessoais-e-do-encarregado . Esta pesquisa não define prazos da CAAB nem substitui aprovação nominal exigida pelo projeto.

## Mensagens — 16/09/2026

Pesquisa oficial e decisões em [009-messaging/research.md](../009-messaging/research.md): revalidação de segmentos/preferências na programação e distinção entre solicitação e evidência de entrega. A decisão do usuário adia canais e dispensa um papel separado de aprovação/envio dentro do módulo.
