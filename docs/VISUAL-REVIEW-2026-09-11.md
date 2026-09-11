# Revisão visual — 11/09/2026

Solicitação: diferenciar Colaboradores de Associados, usar azul, branco e vermelho,
preservar o modo escuro e retirar o fundo acrescentado à logo CAAB.

## Alterações

- Colaboradores usa ContactRound (identificação); Associados mantém UsersRound.
- Paleta centralizada em styles/tokens.css: azul institucional #214f86, branco e vermelho
  #c72f42 no claro; fundos azul-marinho, texto claro, ações #91bbef e detalhes #ff8b98 no escuro.
- Logo original sem fundo/borda/sombra. CSS usa versão branca no escuro e no painel azul
  da autenticação; o PNG original foi preservado.
- Menu, estado ativo, perfil, cards, botões, campos e estados usam cores compatíveis com o tema.
- Corrigida rolagem horizontal do menu provocada pelo deslocamento no hover. Grupo de
  permissões de Colaboradores ganhou borda temática própria, sem afetar filtros de Associados.

## Verificação

Inspeção visual no Chrome do localhost:3106, no viewport desktop existente:
Início claro/escuro; formulário de Colaboradores escuro e tabela clara; Associados claro/escuro;
menu da conta claro. Ícones diferentes e logo sem caixa de fundo confirmados visualmente.
Tema alternado pelo controle real e mantido durante navegação; preferência inicial clara restaurada.
Nenhum formulário foi enviado e nenhum cadastro foi modificado.

Medição dos tokens: 20 combinações de texto/superfície, texto secundário, links, ações normais
ou hover, menu e estados ficaram acima de 4,5:1; menor razão 5,04:1. Isso não representa
uma auditoria WCAG completa. Sete testes existentes de navegação passaram; lint do catálogo aprovado.
Formatação dos arquivos alterados e integridade do diff conferidas. Não houve build completo,
execução E2E automatizada, inspeção mobile ou implantação nesta revisão.

Estilos compartilhados estão no worktree .cache/pr-members, que atende o preview. O ícone de
Colaboradores também foi atualizado no rascunho .cache/pr-employees. Reconciliar estes arquivos
na futura entrega para preservar a padronização, sem substituir o trabalho funcional de Associados.

## Linhas dos cadastros e botão do menu — 11/09/2026

A pedido do usuário, Associados e Colaboradores abrem o perfil ao clicar em qualquer ponto
na linha. O link nativo existente foi estendido com CSS, mantendo as tabelas, Tab/Enter,
foco visível na linha e rotas/permissões atuais. Não foram adicionados handlers de navegação.

Corrigido o botão de recolher: o aside passa a ser o contêiner sticky, com altura de viewport,
incluindo conteúdo e botão. Antes apenas sidebar-inner era sticky e o botão absoluto era
posicionado pelo aside que rolava. O comportamento móvel continua usando o drawer fixo.

Validação no Chrome do localhost: cliques na última coluna de uma linha de Associados e de
Colaboradores abriram os respectivos perfis; Tab alcançou o link e Enter abriu o colaborador.
Inspeção visual confirmou destaque de foco e botão presente após rolagem, nos estados expandido
e recolhido. Menu expandido restaurado. Lint das páginas, formatação e integridade do diff aprovados.
Sem envio de formulário, alteração de cadastro, nova suíte de testes, push, PR ou merge.
Mudanças em feature/members-management, worktree .cache/pr-members, preview 3106.

## Inicial e harmonização das páginas — continuação de 11/09/2026

Inicial refeita com atalhos autorizados, quatro notícias publicadas mais recentes (capa,
categoria, data, resumo e acesso à versão pública), rascunhos recentes e cadastros sem análise.
Os espaços de Atendimentos, Parceiros, Caassh, Mensagens e Relatórios são identificados como
planejamento e não apresentam métricas fictícias. Removidos os gráficos decorativos e contadores
de permissões/sessão da inicial anterior.

Cabeçalhos, largura de conteúdo, painéis, formulários e ações usam o mesmo padrão. Notícias,
Associados e Auditoria usam ModuleNavigation logo abaixo do cabeçalho; as seções do perfil
seguem o mesmo estilo. Ações de criar/exportar ficam no cabeçalho. Removida a linha antiga das
abas de Processamentos. Ações destrutivas no perfil de colaborador têm espaço próprio.
Lupa e calendário dos campos compartilham dimensões, centralização vertical e margens;
fundo transparente, contorno temático e nenhuma translação no hover/clique.

Inspeção visual interativa no Chrome (localhost:3106), com os dados locais existentes:

- Inicial, lista de associados, configurações e campos de lupa/calendário nos dois temas.
- Notícias publicadas, rascunhos e editor existente; troca de abas confirmada.
- Lista e perfil de colaboradores; perfil de associado nas seções Situações e Cadastro;
  formulário de novo associado e abertura/fechamento do calendário, sem escolher data.
- Auditoria, lista e detalhe de processamento, incluindo nova posição das abas e ausência
  da linha abaixo delas.
- Largura de 390 px: rascunhos e inicial. Corrigida a largura mínima dos cards que provocava
  corte horizontal na inicial. Viewport normal restaurado ao finalizar a inspeção móvel.

Validação automatizada: TypeScript web aprovado, lint dos arquivos TS/TSX alterados aprovado,
12 testes unitários existentes de workspace/colaboradores aprovados e um teste de integração
novo aprovado em PostgreSQL descartável. O teste verifica limite de quatro notícias,
ordem cronológica entre canais, deduplicação, exclusão de arquivadas/rascunhos e preservação
da versão publicada após edição privada. Formatação e git diff --check conferidos.
Não executados build de produção nem suíte E2E com seed. Nenhum formulário foi enviado,
nenhum registro local foi alterado e nenhuma consulta externa OAB foi acionada.

Auditoria em linguagem simples registrada como tarefa pendente T014 em
specs/003-audit-operations/tasks.md, sem antecipar sua implementação nesta revisão.
Todas estas mudanças continuam locais em feature/members-management, sem push/PR/merge.

## Verificação final e autorização de entrega — 11/09/2026

O usuário confirmou Associados como pronto e autorizou preparar todos os PRs concluídos
ainda ausentes de dev. A consulta externa OAB continua fora desta rodada de testes;
homologação de credenciais deve ocorrer separadamente. A integração permanece desabilitada
por padrão e a evidência automatizada usa respostas simuladas.

Validação local desta revisão:

- 259 testes unitários/de contrato passaram em 40 arquivos.
- 58 testes de integração de Associados, consulta OAB simulada e Notícias passaram em
  três arquivos, usando bancos PostgreSQL descartáveis.
- Lint completo, typecheck de todos os pacotes e formatação completa passaram.
- Inspeção visual de buscas/filtros nos temas claro e escuro, botões de adicionar com `+`,
  acentuação de Notícias e layout de 390 px. Busca por `Ctrl + K` abriu com foco único visível.
- Campos de busca e ações de lupa/calendário compartilham alinhamento e fundo transparente;
  filtros reutilizam o padrão recolhível de Associados. Corrigidos textos que haviam sido
  salvos com `?` no lugar de letras acentuadas.

Nenhum seed/reset do banco compartilhado, consulta externa OAB ou envio de formulário real
foi usado nesta verificação. Build e E2E completos serão verificados no ambiente isolado do
CI dos PRs; resultados serão registrados após sua execução.
