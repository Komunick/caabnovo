# Evidência — guia de design CAAB

Data: 22/09/2026. Recorte: US4, DS-FR01–08, DS-SC01–04, T133–T140. Entrega documental separada por
pedido explícito do usuário. Guia: [caab-design.md](../../../docs/caab-design.md).

## Auditoria ampliada e consolidação — 22/09/2026

Esta seção é o estado mais recente e corrige inferências da revisão inicial abaixo. Guia principal:
[caab-design.md](../../../docs/caab-design.md), versão 1.1. Base de código: **3907248**; guia de
partida 4a2b609. Somente documentação/orientação foi alterada. PR permanece fechado; sem push nesta
rodada.

### Verificações novas

| Verificação                      | Resultado e alcance                                                                                                                                                        |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Unitários e contratos existentes | **554 testes únicos aprovados em 84 arquivos**; execução inicial + repetições dos quatro arquivos com problema ambiental                                                   |
| Medidas de componentes reais     | **43 observações de cenário/tema/largura**, incluindo simulação de texto a 200%; **516 comparações de estilos computados aprovadas** nos 42 cenários com raiz padrão       |
| Interação isolada no Chromium    | **21 verificações: 19 aprovadas e 2 divergências da regra desejada**, ambas sobre erro antes do blur; sem erro JavaScript                                                  |
| Axe 4.13.0                       | **18 análises**, três cenários × dois temas × 1280/390/320px; nenhuma violação automática, uma categoria de revisão manual de ARIA no contêiner da tabela em seis amostras |
| Overflow da página               | Ausente nos 43 cenários medidos; isso não prova legibilidade de todas as colunas                                                                                           |
| Inventário documental            | **215 Markdown versionados**, 46 candidatos relacionados por busca de conteúdo; comparação dos guias gerais e das seções pertinentes                                       |

Resumo legível por ferramenta: [resultado da auditoria](caab-design-audit-2026-09-22.json).

Validação documental final após mover o guia para `docs/`: **90 referências locais e 20 âncoras
novas verificadas**, 25 pares de cores comparados aos tokens e dez medidas representativas
conferidas no CSS. Oito requisitos e oito tarefas rastreados, primeiras oito seções visuais na ordem
prevista. Prettier aprovou os 15 Markdown alterados e o resumo JSON; `git diff --check` sem erros.
T139/T140 concluídas; nenhuma alteração de código de aplicação incluída.

Os testes usam o código da worktree e dependências existentes da mesma versão, sem instalação. Na
primeira execução, 544 testes passaram; três arquivos não carregaram bibliotecas locais de
exportação e um teste de processo filho foi bloqueado pelo sandbox. Resolvida a leitura usando as
bibliotecas já instaladas e autorização do executor, os quatro arquivos passaram (14 + 9 testes, com
13 sucessos sobrepostos à primeira execução). O total 554 não conta repetições. Arquivos gerados por
testes de exportação contêm 100 registros sintéticos; verificaram Excel/CSV/PDF com leitores
independentes, ordem/conteúdo, texto longo, Unicode, múltiplas páginas/abas e proteção de fórmulas.

A bancada carrega os componentes reais UserForm, ExportScreen, Button, FormField, máscaras, Dialog,
busca/filtros e tabelas, com tokens/CSS globais reais. Navegação, permissões e fetch são simulados;
requisições externas são bloqueadas. Ela não inicia servidor e não reproduz o shell completo nem
estilos próprios de tabelas de cada módulo. O catálogo de exportação vem do adaptador de
Colaboradores; não houve criação de conta, salvamento, consulta externa de CEP ou download por API.

As 12 larguras da bancada foram 1440, 1280, 1101, 1100, 901, 900, 761, 760, 601, 600, 390 e 320px.
Medições aguardaram atualização das media queries e estabilização do tema. As tentativas
preliminares sem essa espera capturavam estilos da largura/tema anterior; foram descartadas, sem
mudar o CSS para fazer o teste passar. Retorno de foco aguardou o fechamento do diálogo e hover foi
medido após a rolagem automática do executor. As duas divergências de validação permaneceram
reproduzíveis.

Teclado de diálogo (Tab/Escape/retorno), foco de input/botão, filtro recolhível, máscara de
CPF/CNPJ/telefone/CEP/OAB, colagem sintética, remoção junto da pontuação, correção de erro e
ordenação de colunas por Enter passaram. Cores forçadas tiveram uma verificação de visibilidade, sem
homologação visual completa nesse modo. Aumento da raiz para 200% é simulação de texto ampliado, não
teste de zoom de todos os navegadores. Clipboard real do sistema e leitores de tela humanos não
foram usados.

### Comparação visual efetivamente realizada

| Referência inspecionada                                                                               | Comparação com o guia e limite                                                                                                                                     |
| ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Parceiros, cadastros claros 1440px e campos escuros 390px, imagens versionadas na spec 007            | Cabeçalho/Plus, abas, filtro recolhível, tabela e campos coerentes; menu/fonte refletem captura histórica, não medir tokens atuais por ela                         |
| Associados, detalhe mobile da spec 005, 10/09                                                         | Captura anterior à harmonização: azul, botões/links, quadros e espaçamento diferem; preservada como história, rejeitada como modelo visual atual                   |
| Colaboradores, lista clara 1280px e escura 390px, CI 35734927572                                      | Inclusão fora do quadro; exportação dentro; busca antes de filtros; tabela com rolagem no celular                                                                  |
| Colaboradores, cadastro 1280/390px e ações escuras 1280px, CI 35734927572                             | Endereço em coluna única; ação principal central no desktop/início no celular; senha e desativação separadas dos dados                                             |
| Exportação de Colaboradores 1280/390px, CI 35736033889                                                | Filtros, seleção/ordem, três formatos; no celular setas e downloads empilhados explicam o aumento de altura                                                        |
| Capturas novas da bancada: formulário claro 1280px, exportação escura 390px e controles escuros 390px | Confirmaram cores finais de erro, medidas/compactação e exceções; ausência de shell e diferenças de fonte do sistema impedem comparação pixel a pixel com CI Linux |

Foram inspecionadas **10 capturas existentes e 3 capturas novas** nesta rodada. Capturas históricas
versionadas: [lista de Parceiros](../../007-partners-management/evidence/cadastros-light-1440.png),
[endereço escuro de Parceiros](../../007-partners-management/evidence/address-fields-dark-390.png) e
[Associados anterior à harmonização](../../005-members-management/evidence/associados-mobile.png). O
CI 35734927572 usou e9d05ed; entre essa origem e 3907248 só mudou um teste de exportação no conjunto
apps/packages. O CI 35736033889 usou 027d1f6; **apps/packages, manifests/lock, configuração Vitest e
workflow CI são idênticos à base 3907248**. Jobs quality/browser/security anteriores passaram.
Build, lint, typecheck, integração com banco e E2E completos desse CI são evidência da mesma base de
código, **não novas execuções locais nem aprovação da consolidação documental**.

### Achados e tratamento

| ID   | Achado                                                                                   | Tratamento                                                                                                                             |
| ---- | ---------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| DV01 | O raio da tabela foi apresentado como único: 0,65rem                                     | Corrigido: regra mais específica de filho direto de panel usa raio zero                                                                |
| DV02 | Inferência de baixo contraste em FormField a partir apenas do token danger               | Corrigido: role=alert prevalece; pares finais 9,48:1 claro e 10,73:1 escuro; não há defeito comprovado nesses erros                    |
| DV03 | Guia não explicitava o erro durante a primeira digitação                                 | Regra desejada preservada; observação e pendência registradas. Duas verificações falharam em texto incompleto/CPF antes do blur        |
| DV04 | Compactação não esclarecia endereço vertical, ação central e setas empilhadas            | Exceções e oportunidades documentadas, sem afirmar que a interface já foi compactada novamente                                         |
| DV05 | TableContainer parecia garantir sozinho região nomeada e colunas legíveis                | Documentado que nome/caption/semântica e largura mínima dependem do uso; tabela genérica da bancada quebrou palavras demais no celular |
| DV06 | Faltavam navegação global, paginação e distinção entre controles comuns e especializados | Incorporados ao guia junto de seleções, conteúdo rico, arquivos, exceção da busca de Notícias após 350ms e limites de testes           |
| DV07 | Guias paralelos e opções históricas de densidade poderiam orientar mudanças conflitantes | Consolidação abaixo; STACK deixa claro que não existe seletor geral de densidade                                                       |

DV03 é pendência funcional, não erro remanescente do texto corrigido. O aviso manual de ARIA em DV05
foi isolado numa conferência adicional: `.table-scroll` é um div focável com aria-label e sem role
explícito; a ferramenta informa que o nome não é bem suportado nesse elemento. O aviso não foi
transformado em certificação nem em defeito confirmado; exige conferência assistiva no uso real. Não
foram alterados componentes para encerrar os achados. Nenhuma spec institucional, cargo, acesso,
retenção ou política de documento foi reaberta pela auditoria.

<a id="consolidacao-documental"></a>

### Consolidação documental

| Documento/grupo comparado                                 | Destino das informações e decisão                                                                                                                               |
| --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| UI-BUTTONS.md                                             | Uso de Button/buttonVariants, links de paginação, controles especializados e estados absorvidos; medidas antigas não reaplicadas. Arquivo removido              |
| VISUAL-REVIEW-2026-09-11.md                               | Distinção de ícones, marca sem caixa, navegação/linhas clicáveis, menu ao rolar, Início com dados reais e precedência das revisões absorvidos. Arquivo removido |
| STACK, PRD, PRINCIPLES                                    | Mantidos por arquitetura/objetivos/princípios; apontam ao guia. Catálogo duplicado de tokens/densidade retirado de STACK                                        |
| Mapa de interface de Parceiros                            | Mantido pelas sete páginas, abas e jornadas de domínio; lista de normas gerais substituída por referência ao guia                                               |
| Specs, planos, pesquisas e tarefas dos dez módulos        | Mantidos por contrato, escopo, decisões e continuidade próprios; trechos históricos não viram catálogo vigente                                                  |
| Evidências common-fields, us4-accessibility, módulos e CI | Mantidas: são resultados datados, não guias de UI/UX substituíveis                                                                                              |
| EXPORT-STANDARD                                           | Mantido: contrato transversal de formatos/acesso/completude, referenciado pelo guia, não apenas aparência                                                       |
| Constituição, arquitetura, segurança e runbooks           | Mantidos por finalidade própria; menção à interface não os torna redundantes                                                                                    |
| TOOLING, workflow, frontend AGENTS e template de PR       | Atualizados para orientar consulta e manutenção do guia principal                                                                                               |

Não foi criada cópia substituta dos dois guias removidos. Seu conteúdo integral permanece no Git:
[botões na base 3907248](https://github.com/Komunick/caabnovo/blob/39072489ce6ffc1c7136eb4f0f0b8031015746e8/docs/UI-BUTTONS.md)
e
[revisão visual na base 3907248](https://github.com/Komunick/caabnovo/blob/39072489ce6ffc1c7136eb4f0f0b8031015746e8/docs/VISUAL-REVIEW-2026-09-11.md).
As 28 conferências de botões de 10/09 e os resultados da revisão de 11/09 continuam históricos, com
as mesmas limitações originais; não se somam aos 554 testes desta rodada. Backups locais verificados
por SHA-256 foram guardados antes da remoção. Nenhum runtime, worktree, .env ou backup foi removido;
o nome anterior design.md deixa de existir por renomeação para `docs/caab-design.md`, sem segunda
cópia. O destino em `docs/` foi definido pelo usuário; links internos e referências de entrada foram
recalculados para essa pasta.

### Reprodutibilidade e limites

Artefatos operacionais locais estão em .cache/design-audit-20260922 na pasta principal: logs e JSON
Vitest, fixture/runner do navegador, medições, 516 asserções, capturas, inventário e hashes dos
arquivos removidos. Usam Node 24.20.0, Vitest 4.1.11, Playwright 1.62.1 e Axe 4.13.0 já presentes. O
runner e a configuração temporária de bibliotecas são auxiliares de auditoria, não dependências
novas do produto. Critérios externos reconferidos em 22/09:
[texto ampliado](https://www.w3.org/WAI/WCAG22/Understanding/resize-text.html),
[contraste](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html) e
[alvos mínimos](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html).

Não houve localhost, Docker, banco, migração, envio de mensagem, mudança funcional ou PR novo. A
revisão usa fontes existentes e testes cabíveis ao guia; não declara perfeição de toda a UI,
conformidade WCAG completa ou homologação de fluxos não exercitados.

## Registro da criação inicial — histórico

## Base e preservação

Pesquisa inicial consultou a entrega do PR #37 em `027d1f6` e as alterações documentais locais então
existentes. Usuário pediu separação; a única seção adicionada à spec antiga foi retirada e o
conteúdo original restaurado byte a byte com hash conferido. Nenhuma implementação ou metadado do PR
#37 foi alterado nesta tarefa.

Nova entrega criada a partir de `dev` em `af6f096`. Após confirmar o
[merge do PR #37](https://github.com/Komunick/caabnovo/pull/37), principal e nova branch receberam
`39072489ce6ffc1c7136eb4f0f0b8031015746e8` por fast-forward. As cinco adições documentais próprias
foram isoladas e preservadas antes da atualização, depois incorporadas aos documentos integrados;
nenhuma versão antiga do produto foi reaplicada. Essa é a base final de código consultada.

## Processo Spec Kit executado

| Fase      | Execução e resultado                                                                                                                                                                             |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Specify   | Template resolvido e constituição lidos; incremento na US4 da spec 001 existente, conforme regra de não duplicar função; oito requisitos e quatro critérios de sucesso                           |
| Clarify   | Resolução de caminhos executada; dez categorias de cobertura claras no recorte documental; zero perguntas adicionais necessárias; instruções posteriores de branch e campos/filtros incorporadas |
| Plan      | `setup-plan.ps1 -Json` preservou plano existente; pesquisa, estrutura, limites, verificação constitucional e rollback acrescentados                                                              |
| Tasks     | `setup-tasks.ps1 -Json` resolveu template; seis tarefas T133–T138 sequenciais com caminhos e cobertura; nenhuma implementação antiga reaberta                                                    |
| Analyze   | `check-prerequisites.ps1 -Json -RequireTasks -IncludeTasks`; análise somente leitura dos requisitos/plano/tarefas DS e princípios; resultado abaixo                                              |
| Implement | Mesmo prerequisite e inspeção dos checklists; execução limitada ao documento expressamente autorizado, sem tarefas funcionais antigas, serviços ou dados                                         |

Não há `.specify/extensions.yml` nesta base; nenhum hook antes/depois foi executado. Não foram
criadas entidades artificiais em data-model ou contratos de API para um guia de leitura.

Checklist histórico `requirements.md`: **13/16 → 13/16**, sem alterar marcadores. Permanecem as
ressalvas gerais sobre detalhes de implementação e ambiguidade de requisitos antigos. Isso não
representa aprovação global da Fundação. O recorte documental solicitado possui requisitos
verificáveis e sua autorização não reabre implementação institucional pendente.

## Analyze — relatório do recorte

| ID  | Categoria                                         | Severidade | Localização                  | Resultado                                                     |
| --- | ------------------------------------------------- | ---------- | ---------------------------- | ------------------------------------------------------------- |
| —   | Duplicação, ambiguidade, cobertura e consistência | —          | Seções DS de spec/plan/tasks | Nenhum achado que exija remediação no planejamento documental |

O complemento de campos/botões/máscaras/filtros detalha DS-FR03 e T135. A conferência após essa
inclusão preservou os mesmos oito grupos e a cobertura, sem criar tarefa órfã. Fontes antigas de
produto são contexto; não se confundem com o conteúdo DS analisado.

| Requisito | Tarefas          | Evidência no guia                                                     |
| --------- | ---------------- | --------------------------------------------------------------------- |
| DS-FR01   | T134, T136       | Entrada, versão/data/base, índice; link em TOOLING                    |
| DS-FR02   | T133, T134       | Colors, Typography, Layout, Elevation & Depth, Shapes                 |
| DS-FR03   | T135             | Components; matrizes de posição, filtros, máscaras e três composições |
| DS-FR04   | T135             | Interaction; nove estados e limites dos rascunhos                     |
| DS-FR05   | T135             | Accessibility; matriz de jornadas/temas/telas/teclado                 |
| DS-FR06   | T135, T138       | Overview, Exportação e Adoption; OAB e pendências explícitas          |
| DS-FR07   | T136, T138       | Maintenance e referência vigente em UI-BUTTONS                        |
| DS-FR08   | T133, T137, T138 | Pesquisa oficial, esta evidência e validações documentais             |

Métricas: **8 requisitos, 6 tarefas, 100% de cobertura planejada, 0 tarefas sem requisito, 0
ambiguidades bloqueadoras, 0 duplicações no recorte, 0 conflitos constitucionais identificados**.
Próxima ação após analyze: implementação documental solicitada. Nenhuma correção de aplicação foi
autorizada ou aplicada pela análise.

## Fontes visuais e limites

Imagens já existentes foram abertas e inspecionadas nesta sessão:

| Captura                                | Procedência                                                                     | O que foi conferido                                                              |
| -------------------------------------- | ------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `partners-cadastros-light-1440.png`    | Validação sintética de Parceiros em 14/09/2026                                  | Cabeçalho, inclusão com Plus, abas, busca/lupa, filtros, quadro e tabela         |
| `collaborator-list-dark-390.png`       | [CI 35734927572](https://github.com/Komunick/caabnovo/actions/runs/35734927572) | Tema escuro e celular, posição de exportação, busca, filtros e rolagem da tabela |
| `collaborator-export-filters-1280.png` | [CI 35736033889](https://github.com/Komunick/caabnovo/actions/runs/35736033889) | Filtros em grade, colunas/ordem e os três botões de download                     |

São referências históricas sintéticas, não nova execução de UI. Os arquivos operacionais permanecem
locais, sem depender de seus caminhos no guia. Evidência funcional de base em
[validação de Colaboradores](collaborators-2026-09-22-validation.md). Revisão por screenshot não
verifica foco, teclado, leitores de tela, zoom ou comportamento de erro.

## Contraste estático e divergências

Razões calculadas usando sRGB linearizado, luminância relativa e
`(LmaisClaro + 0,05) / (LmaisEscuro + 0,05)`, com os pares sólidos declarados nos tokens:

| Par                  | Tema   | Razão   |
| -------------------- | ------ | ------- |
| text / surface       | Claro  | 14,27:1 |
| muted / surface      | Claro  | 6,06:1  |
| action-ink / action  | Claro  | 8,31:1  |
| text / surface       | Escuro | 14,74:1 |
| action-ink / action  | Escuro | 7,94:1  |
| danger / surface     | Escuro | 2,60:1  |
| danger / danger-soft | Escuro | 2,64:1  |

**Conclusão inicial corrigida por DV02 acima:** os dois últimos pares não atendem a 4,5:1 para texto
normal. O guia os identifica como pendência; não corrige estilos nem afirma que todo uso de danger
falha. Botão com texto branco é outra combinação. A associação então feita a `.field-error` foi
refutada pela medição da regra posterior `role="alert"`; não usar esta hipótese inicial como
pendência funcional confirmada. Superfícies translúcidas e todos os demais pares não foram
auditados. Estes cálculos não constituem certificação WCAG.

Outras divergências tratadas documentalmente: medidas antigas de UI-BUTTONS; sombras declaradas
substituídas em `.panel`; foco de inputs substituindo o global; Inter declarada sem carregamento
explícito no layout; CPF de busca parcial diferente de CPF cadastral; filtros com aplicação imediata
e explícita coexistentes. Nenhuma dessas observações autoriza alterar produto automaticamente.

## Validações desta entrega

Conferência concluída: nove documentos passaram por Prettier explícito com
`--ignore-path .gitignore --check`; `git diff --check` sem falhas. Inspeção do diff e leitura do
guia confirmaram escopo documental. Verificação dos links novos por árvore Markdown: 70 destinos
locais e 20 âncoras válidos; 25 linhas de cores comparadas a tokens claro/escuro; dez medidas
representativas encontradas nas fontes e revisadas quanto à cascata. Valores restantes de
campos/medidas conferidos por leitura dos contratos e componentes. Oito requisitos únicos, seis
tarefas e ordem das oito seções visuais conferidos. DS-SC01–04 atendidos pela revisão documental e
matrizes do guia.

O verificador foi auxiliar local descartável, sem dependência ou suíte nova no produto. A pesquisa
externa foi consultada via navegador de pesquisa; links de CI apenas identificam evidência anterior.
T133–T138 concluídas, incluindo a compactação solicitada: densidade por região, medidas existentes,
ordem dos grupos, limites de legibilidade e alvos, comportamento no celular e critério de comparação
antes/depois. Complemento incorporado a DS-FR03, plano e T135; reanálise sem conflitos ou lacunas de
cobertura. A compactação foi promovida de subseção de Layout a seção principal “Compactação e
densidade visual”, com subtítulos por assunto, destaque no índice e acesso direto no início, após o
usuário relatar dificuldade para localizá-la. Conteúdo e medidas preservados; as oito seções visuais
originais mantêm sua ordem. Verificação final: 70 destinos locais/20 âncoras válidos. Nenhum teste
visual novo foi alegado por essas regras documentais.

**Orientação final: não abrir PR ainda.** O [PR #38](https://github.com/Komunick/caabnovo/pull/38)
havia sido aberto em rascunho antes da mensagem; foi fechado sem merge, preservando a branch. Nenhum
novo PR/reabertura; complemento de compactação e fechamento mantidos localmente, sem push. CI
iniciado anteriormente pertence à versão remota anterior e não valida o complemento local.
Lint/typecheck/build/E2E não foram executados localmente nesta tarefa. Principal dev sincronizada
por fetch/ff-only e divergência 0/0. Localhost, Docker, dados, contas, migrations, permissões e
dependências permaneceram inalterados.
