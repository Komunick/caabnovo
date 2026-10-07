# Guia de validação

## Pré-requisitos

Ler AGENTS e agentcache da principal, spec e contratos. Usar a worktree desta entrega. Não iniciar
serviços ou instalar dependências para validar documentação.

## Comandos locais

Na raiz da worktree, usando Prettier já instalado na principal:

```powershell
$docs = @(Get-ChildItem specs/011-jira-confluence-organization -Recurse -Filter *.md | ForEach-Object FullName)
$docs += (Resolve-Path docs/history/reorganizacao-jira-confluence-2026-10-01.md).Path
node ../../node_modules/prettier/bin/prettier.cjs --check --ignore-path .gitignore @docs
git diff --check
git status --short
```

Esperado: formatação válida, sem whitespace inválido e apenas artefatos da entrega. Arquivos não
rastreados exigem inspeção explícita; diff vazio não os valida. Conferir 37 chaves únicas na prévia,
links locais e ausência de placeholders. Confrontar decisões 1–10 e subtarefas com a spec.

## Cenários da futura execução

| Cenário       | Verificação                                  | Resultado esperado                                                  |
| ------------- | -------------------------------------------- | ------------------------------------------------------------------- |
| Inventário    | Consultar CAAB paginado sem filtro de status | Iniciais e eventuais novos representados.                           |
| Redundância   | Comparar 2/21 e 22/23/24/25                  | Aceite consolidável; motor, módulos, relatórios e legado distintos. |
| Parcial       | Confrontar PR40 e escopo de 24               | Duas subtarefas; restante não concluído por inferência.             |
| Autoria       | Confrontar PR e histórico de 26–28           | Somente atribuição comprovada, sem herança do pai.                  |
| QA histórico  | Inspecionar merge sem prova humana           | Lacuna registrada e status preservado.                              |
| Concorrência  | Simular snapshot divergente sem escrita      | Operação bloqueada, exige releitura.                                |
| Reexecução    | Revisar operação já verificada               | Nenhuma duplicação de criação ou labels.                            |
| Transferência | Conferir páginas CAASSH/Portal e RH          | Previstas e sugestão separadas, origens vinculadas.                 |
| Histórico     | Abrir versões e corpo da página              | Conteúdo vigente sem histórico duplicado.                           |
| Definição     | Inspecionar caixa de entrada                 | Compromisso mantido, sem prontidão inventada.                       |
| Visão ativa   | Validar JQL do contrato                      | Sinalizados excluídos da visão; vazios preservados.                 |

Simulações não escrevem em produção. Após aplicação, reler cada recurso e registrar evidência
datada. Este guia não declara os cenários remotos executados.
