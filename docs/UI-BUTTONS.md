# Padrão de botões do painel

Decisão do usuário em 10/09/2026: adotar o visual dos botões de Notícias nas demais áreas.
Branch: `feature/button-style-standardization`, baseada em `origin/dev` (`be46efa`).

## Uso

- Ações usam `Button`; links de ação usam `buttonVariants()` de `components/ui/button.tsx`.
- A ação principal usa `intent="primary"`; ações secundárias usam o padrão `secondary`.
  Ações destrutivas preservam `danger`, com texto que identifica a consequência.
- Altura mínima padrão de 3,1 rem; variante compacta de 2,85 rem; fonte de 0,95 rem,
  borda de 1,5 px, cantos de 0,65 rem e espaçamento horizontal de 1,25 rem.
- Botões secundários têm fundo suave, borda visível e sombra discreta. As cores usam
  os tokens do tema; foreground e background mudam juntos para preservar contraste.
- Manter foco visível por teclado, indicação de desabilitado e o nome acessível dos
  botões que exibem apenas ícone. Não remover estados ou permissões ao aplicar o estilo.
- Nomes de registros em tabelas continuam sendo links de conteúdo. Links de paginação
  usam o estilo de botão e permitem quebra de linha em telas pequenas.

## Implementação

O estilo antes limitado a `.news-module .button` passa ao CSS compartilhado em
`apps/web/app/globals.css`. Tokens `--color-control-bg` e `--color-control-border`
também alimentam os controles específicos de Notícias, evitando duas paletas independentes.
As classes antigas `primary-button`/`compact-button`, ainda usadas em Usuários e
Configurações, recebem os mesmos estilos, preservando a largura original dos formulários.
Controles especializados de navegação, conta e visibilidade da senha conservam seu formato.

Os ajustes específicos de Associados (links de retorno, paginação, lupa e posição no menu)
pertencem a `feature/members-management`. O preview dessa branch recebe os arquivos
compartilhados para revisão visual, sem incluir Associados no escopo de entrega desta branch.

## Validação

No preview local com as duas partes combinadas, 28 conferências aprovadas em Chromium:
sete telas (Notícias, lista/novo/detalhe de Associados, Usuários, Configurações e Auditoria),
em larguras de 1366 e 390 px, nos temas claro e escuro. Medidas e cores comparadas ao botão
de Notícias; axe nos botões, foco visível da lupa, posição interna da lupa e ausência de
rolagem horizontal verificados. Capturas de Associados em desktop e celular inspecionadas.
Os dados e a sessão local existentes foram usados somente para leitura, sem criar fixtures.

Lint dos arquivos TypeScript alterados, typecheck de `@caab/web`, formatação e integridade
do diff aprovados. Artefatos locais em `.cache/button-style-validation/` no preview de
Associados; o executor descartável é `.cache/verify-button-style.mjs`. A lista de
processamentos não possui botões de ação no estado consultado e não integra as 28 medições.
Nenhum PR, push ou deploy foi feito; a validação descrita não substitui os gates de uma entrega.
