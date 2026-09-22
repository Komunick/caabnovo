# Evidência — guia de design CAAB

Data: 22/09/2026. Recorte: US4, DS-FR01–08, DS-SC01–04, T133–T138. Entrega documental separada por
pedido explícito do usuário. Guia: [design.md](../../../design.md).

## Base e preservação

Pesquisa inicial consultou a entrega do PR37 em `027d1f6` e as alterações documentais locais então
existentes. Usuário pediu separação; a única seção adicionada à spec antiga foi retirada e o
conteúdo original restaurado byte a byte com hash conferido. Nenhuma implementação ou metadado do
PR37 foi alterado nesta tarefa.

Nova entrega criada a partir de `dev` em `af6f096`. Após confirmar o
[merge do PR37](https://github.com/Komunick/caabnovo/pull/37), principal e nova branch receberam
`39072489ce6ffc1c7136eb4f0f0b8031015746e8` por fast-forward. As cinco adições documentais próprias
foram isoladas e preservadas antes da atualização, depois incorporadas aos documentos integrados;
nenhuma versão antiga do produto foi reaplicada. Essa é a base final de código consultada.

## Processo Spec Kit executado

| Fase      | Execução e resultado                                                                                                                                                                             |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Specify   | Template resolvido e constituição lidos; incremento na US4 da spec001 existente, conforme regra de não duplicar função; oito requisitos e quatro critérios de sucesso                            |
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

| Captura                                | Procedência                                                                    | O que foi conferido                                                              |
| -------------------------------------- | ------------------------------------------------------------------------------ | -------------------------------------------------------------------------------- |
| `partners-cadastros-light-1440.png`    | Validação sintética de Parceiros em 14/09/2026                                 | Cabeçalho, inclusão com Plus, abas, busca/lupa, filtros, quadro e tabela         |
| `collaborator-list-dark-390.png`       | [CI35734927572](https://github.com/Komunick/caabnovo/actions/runs/35734927572) | Tema escuro e celular, posição de exportação, busca, filtros e rolagem da tabela |
| `collaborator-export-filters-1280.png` | [CI35736033889](https://github.com/Komunick/caabnovo/actions/runs/35736033889) | Filtros em grade, colunas/ordem e os três botões de download                     |

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

Os dois últimos pares não atendem a 4,5:1 para texto normal. O guia os identifica como pendência;
não corrige estilos nem afirma que todo uso de danger falha. Botão com texto branco é outra
combinação. Há risco aplicável a `.field-error`, que usa danger como texto; validar renderização e
estados nas telas afetadas em futura correção. Superfícies translúcidas e todos os demais pares não
foram auditados. Estes cálculos não constituem certificação WCAG.

Outras divergências tratadas documentalmente: medidas antigas de UI-BUTTONS; sombras declaradas
substituídas em `.panel`; foco de inputs substituindo o global; Inter declarada sem carregamento
explícito no layout; CPF de busca parcial diferente de CPF cadastral; filtros com aplicação imediata
e explícita coexistentes. Nenhuma dessas observações autoriza alterar produto automaticamente.

## Validações desta entrega

Conferência concluída: nove documentos passaram por Prettier explícito com
`--ignore-path .gitignore --check`; `git diff --check` sem falhas. Inspeção do diff e leitura do
guia confirmaram escopo documental. Verificação dos links novos por árvore Markdown: 68 destinos
locais e 18 âncoras válidos; 25 linhas de cores comparadas a tokens claro/escuro; dez medidas
representativas encontradas nas fontes e revisadas quanto à cascata. Valores restantes de
campos/medidas conferidos por leitura dos contratos e componentes. Oito requisitos únicos, seis
tarefas e ordem das oito seções visuais conferidos. DS-SC01–04 atendidos pela revisão documental e
matrizes do guia.

O verificador foi auxiliar local descartável, sem dependência ou suíte nova no produto. A pesquisa
externa foi consultada via navegador de pesquisa; links de CI apenas identificam evidência anterior.
T133–T138 concluídas; [PR38](https://github.com/Komunick/caabnovo/pull/38) aberto em rascunho, sem
aprovação ou merge. CI automático iniciado pelo push/PR e ainda em andamento no fechamento;
lint/typecheck/build/E2E de produto não foram executados localmente nem declarados aprovados para
esta entrega. Conferir os checks atuais do PR antes de integrar. Localhost, Docker, dados, contas,
migrations, permissões e dependências permaneceram inalterados.
