# Contrato de preparação e aplicação

## Entradas e pré-condições

Projeto CAAB, espaço CAABNOVO (1867811), repo Komunick/caabnovo. Conferir identidade e permissões da
conexão, metadados de tipos/campos/transições, inventário paginado e histórico. Nunca registrar
tokens. Cada proposta contém ID estável, alvo, campos antes/depois, fonte, justificativa,
dependências e resultado esperado. A prévia revisável deve existir antes de aplicação remota.

## Jira

1. Ler item e comparar os campos afetados com o snapshot. Divergência exige atualizar a proposta.
2. Confirmar tipo, pai e conversão disponível. Usar conversão nativa; se ferramenta não suportar,
   deixar operação manual descrita e bloqueada, sem recriar/apagar item.
3. Atualizar somente campos previstos; adicionar labels sem eliminar etiquetas independentes.
4. Para assignee, cruzar autor do PR do recorte, histórico de saída do Backlog e conta Jira ativa.
   Associação de contas precisa ser verificável. Divergências ficam pendentes, sem escolha
   arbitrária.
5. Buscar equivalentes antes de criar. Registrar chave retornada imediatamente; retry consulta a
   chave ou a relação inequívoca antes de repetir criação.
6. Consolidar 21 em 2 apenas após confirmar incorporação do aceite; manter 21 com link/label/status.
7. Relê-se cada item para confirmar tipo, pai, status, responsável, conteúdo e etiquetas.

Filtro proposto para visão ativa separada:

```jql
project = CAAB AND (labels IS EMPTY OR labels NOT IN
(transferido-confluence, consolidado, historico-planejamento)) ORDER BY Rank ASC
```

Validar JQL no projeto antes de salvar a visão; não editar configuração compartilhada do quadro.

## Confluence

Página inicial 1867914; proposta publicada 7143436; visão do projeto 819227; Home 2588761; Banco de
Consulta da I.A. 3244094; Regras 2621487; Skills/Ferramentas/Tecnologias 2588776. Conferir
identidade e versão atuais; IDs acima são referências observadas, não garantia de conteúdo.

Estrutura de destino: Visão do projeto, Funcionalidades previstas, Sugestões, Guias de uso,
Decisões, Referência técnica e Banco de Consulta da I.A. Reutilizar seções equivalentes antes de
criar. CAASSH/Portal compartilham página própria em previstas; RH fica separado em sugestões. Regras
permanece acessível no Banco. Stack deve ser referência para equipe, com link no Banco e sem segunda
cópia normativa. Comparar fontes da entrega ativa com dev e explicitar o que ainda é proposta.

Antes de editar/mover: ler conteúdo, pai, versão e rascunho; preparar corpo completo para revisão.
Publicar com versão esperada; conflito ou rascunho desconhecido bloqueia somente aquela página.
Reler título, pai, corpo, versão e links. Só marcar ticket transferido após verificar página e
vínculo. Sugestão aprovada move a mesma página e recebe link de execução. Histórico visível dispensa
histórico duplicado no corpo. A página 7143436 deve ser conciliada com Clarify na futura aplicação.

## Falhas e recuperação

Sem operações destrutivas. Registrar o último resultado confirmado; parar dependentes em caso de
falha, continuar itens independentes. Não desfazer alterações de terceiros. Correção compensatória
usa snapshot, nova leitura e mesma autorização, sem apagar o histórico. Se perder resposta de uma
criação, pesquisar o resultado antes de repetir. Nenhuma falha autoriza ampliar permissões/escopo.
