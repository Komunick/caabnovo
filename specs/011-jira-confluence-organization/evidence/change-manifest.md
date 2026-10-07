# Prévia para revisão — manifesto de mudanças

**Estado da prévia original:** preparada antes da aplicação. 127 operações propostas, com valores
exatos em `change-manifest.json`, evidência privada preservada na worktree histórica
`.cache/pr-jira-confluence-20261001`, sem publicação de identificadores de contas Atlassian. O
usuário pediu revisão antes das alterações. Analyze não identificou conflitos críticos. Aplicação
remota depende desta revisão e das pré-condições de cada operação.

**Resultado atual:** aprovação recebida e123/127 operações verificadas. Consulte
[aplicação e pendências](application-summary.md) antes de executar qualquer operação desta prévia.

## O que muda

37 tickets existentes preservados; até cinco novos tickets (três tarefas de Agendamentos e duas
subtarefas de 24); sete páginas existentes preservadas/reorganizadas e seis páginas novas propostas.
Nenhum apagamento. As seis páginas são estrutura/conteúdo Confluence, não seis tickets adicionais.

Nove atribuições propostas a Gabriel: 3, 7, 8, 13, 14, 15, 16, 17 e 28. Jailson permanece em 24.
26/27 ficam sem responsável por falta de PR do recorte. Históricos 4/5 e 9–12 não recebem autoria
apenas pela movimentação.

CAAB-24: QA → Em Desenvolvimento no pai; parcela do PR40 vira subtarefa em QA, restante fica em
Backlog. Outros status existentes permanecem. Isso distingue recorte integrado e escopo total.

## Ler os textos finais

- [Conteúdo e categorias dos 37 tickets](jira-content-proposal.md).
- [Cinco novos registros](new-items-proposal.md).
- [Responsáveis](responsibility-proposal.md) e [status/evidências](workflow-proposal.md).
- [Árvore do Confluence](confluence-structure-proposal.md).
- [Páginas de produto e navegação](product-pages-proposal.md).
- [Regras e stack reconciliadas](technical-pages-proposal.md).
- [Página de organização e modelos](organization-page-proposal.md).

## Limites verificados

1. Conversão para subtarefa requer mecanismo nativo confirmado. Sem clonar item para contornar.
2. Leitura HTML de Regras não retornou snapshotToken solicitado nem demonstrou ausência de rascunho.
   Antes de atualizar páginas existentes, conferir concorrência pela interface ou mecanismo
   suportado.
3. Lookup não comprova conta ativa/atribuível para qualquer operação. Revalidar antes de escrever.
4. Salvar filtro separado exige capacidade não exposta pelo conector. JQL validada retorna 37 itens
   antes de aplicar etiquetas. Não alterar quadro compartilhado.
5. Checkpoint de Agendamentos tem correções locais de 30/09; leitura não retoma essa frente nem
   prova integração, autoria humana do restante ou homologação.

## Resumo por ticket

| Ticket  | Tipo final | Pai final | Status final       | Responsável final |
| ------- | ---------- | --------- | ------------------ | ----------------- |
| CAAB-2  | Tarefa     | nenhum    | Backlog            | sem atribuição    |
| CAAB-3  | Tarefa     | nenhum    | Concluído          | Gabriel Pinheiro  |
| CAAB-4  | Tarefa     | nenhum    | Em Desenvolvimento | sem atribuição    |
| CAAB-5  | Tarefa     | nenhum    | Em Desenvolvimento | sem atribuição    |
| CAAB-7  | Tarefa     | nenhum    | Concluído          | Gabriel Pinheiro  |
| CAAB-8  | Tarefa     | nenhum    | Concluído          | Gabriel Pinheiro  |
| CAAB-9  | Tarefa     | nenhum    | Concluído          | sem atribuição    |
| CAAB-10 | Tarefa     | nenhum    | Concluído          | sem atribuição    |
| CAAB-11 | Tarefa     | nenhum    | Concluído          | sem atribuição    |
| CAAB-12 | Tarefa     | nenhum    | Concluído          | sem atribuição    |
| CAAB-13 | Tarefa     | nenhum    | Concluído          | Gabriel Pinheiro  |
| CAAB-14 | Tarefa     | nenhum    | Concluído          | Gabriel Pinheiro  |
| CAAB-15 | Tarefa     | nenhum    | Concluído          | Gabriel Pinheiro  |
| CAAB-16 | Tarefa     | nenhum    | Concluído          | Gabriel Pinheiro  |
| CAAB-17 | Tarefa     | nenhum    | Concluído          | Gabriel Pinheiro  |
| CAAB-18 | Tarefa     | nenhum    | Backlog            | sem atribuição    |
| CAAB-19 | História   | nenhum    | Backlog            | sem atribuição    |
| CAAB-20 | Subtarefa  | CAAB-19   | Backlog            | sem atribuição    |
| CAAB-21 | Tarefa     | nenhum    | Backlog            | sem atribuição    |
| CAAB-22 | Tarefa     | nenhum    | Backlog            | sem atribuição    |
| CAAB-23 | História   | nenhum    | Backlog            | sem atribuição    |
| CAAB-24 | Tarefa     | nenhum    | Em Desenvolvimento | Jailson Junior    |
| CAAB-25 | Tarefa     | nenhum    | Backlog            | sem atribuição    |
| CAAB-26 | Tarefa     | CAAB-37   | Em Desenvolvimento | sem atribuição    |
| CAAB-27 | Tarefa     | CAAB-37   | Em Desenvolvimento | sem atribuição    |
| CAAB-28 | Tarefa     | CAAB-37   | Em Desenvolvimento | Gabriel Pinheiro  |
| CAAB-29 | História   | nenhum    | Backlog            | sem atribuição    |
| CAAB-30 | História   | CAAB-37   | Backlog            | sem atribuição    |
| CAAB-31 | Tarefa     | nenhum    | Backlog            | sem atribuição    |
| CAAB-32 | Tarefa     | nenhum    | Backlog            | sem atribuição    |
| CAAB-33 | Tarefa     | nenhum    | Backlog            | sem atribuição    |
| CAAB-34 | Tarefa     | nenhum    | Backlog            | sem atribuição    |
| CAAB-35 | Tarefa     | nenhum    | Backlog            | sem atribuição    |
| CAAB-36 | Tarefa     | nenhum    | Backlog            | sem atribuição    |
| CAAB-37 | Epic       | nenhum    | Em Desenvolvimento | Gabriel Pinheiro  |
| CAAB-38 | Tarefa     | nenhum    | Em Desenvolvimento | Gabriel Pinheiro  |
| CAAB-39 | Tarefa     | nenhum    | Backlog            | sem atribuição    |

## Ordem e revisão

REVIEW é condição externa, satisfeita somente pela revisão explícita desta prévia. Criar seções
antes das páginas filhas; confirmar página antes de sinalizar transferência. Incorporar aceite de 21
em 2 antes de consolidar. Converter 37 antes de vincular filhos. Escritas em um mesmo recurso são
serializadas e o snapshot esperado é atualizado após cada resultado próprio confirmado. Mudança de
terceiros interrompe a operação afetada.

NEW-* são referências locais, sem chave Jira/ID Confluence inventados. Resolver vínculos com os IDs
retornados na criação. O manifesto não contém exclusão, alteração de permissões ou serviços.
