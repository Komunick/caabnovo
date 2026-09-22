# CAAB — Guia de design

Versão documental 1.0 · Revisado em 22/09/2026 · Escopo: painel administrativo CAAB.

Base de código conferida: `3907248` em `dev`, após integração do PR37. O guia é uma entrega
documental separada; não representa nova alteração de interface nem homologação global.

Este é o ponto de entrada para desenhar, implementar e revisar interfaces deste projeto. Reúne a
linguagem visual de Parceiros/Associados e as decisões posteriores confirmadas para o painel. A
intenção é tornar a próxima tela reconhecível e previsível para quem já usa a CAAB.

**Leitura rápida:** preserve a estrutura da página; use os componentes existentes; aplique os tokens
por significado; trate estados e permissões; revise as jornadas nos dois temas e em tela pequena. Um
resultado visualmente parecido ainda precisa funcionar com teclado, erros e dados reais.

**Índice:** [visão geral](#overview) · [cores](#colors) · [tipografia](#typography) ·
[layout](#layout) · [profundidade](#elevation--depth) · [formas](#shapes) ·
[componentes](#components) · [faça e evite](#dos-and-donts) ·
[posição dos campos e ações](#posicao-dos-campos-e-acoes) ·
[filtros](#localizacao-formato-e-aplicacao-dos-filtros) ·
[máscaras e validação](#mascaras-e-validacao) · [interação](#interaction) ·
[acessibilidade](#accessibility) · [adoção](#adoption) · [manutenção e adaptação](#maintenance).

## Overview

### Identidade e intenção

A CAAB é um sistema de gestão interna. O trabalho principal é localizar informações, cadastrar,
revisar e executar ações com clareza sobre suas consequências. A interface combina azul
institucional, superfícies claras, texto azul profundo e vermelho pontual. No escuro, fundos
azul-marinho e ações azul-claro preservam a hierarquia. A densidade é adequada a tabelas e
cadastros; espaço serve para agrupar informações, sem transformar cada módulo em uma página
promocional.

O padrão de referência é **Parceiros/Associados**: título e descrição curtos, inclusão explícita,
abas, quadro de consulta, busca/filtros e tabela. Colaboradores incorpora o padrão mais recente de
exportação dentro do quadro. Início, autenticação e editor de Notícias têm composições próprias para
suas finalidades, usando a mesma base visual.

### Como interpretar este documento

| Rótulo    | Significado                                                                       |
| --------- | --------------------------------------------------------------------------------- |
| Regra     | Decisão vigente do projeto ou critério de aceite; orienta novas alterações.       |
| Observado | Encontrado nas fontes da versão consultada; não atesta conformidade universal.    |
| Pendente  | Regra ainda não aplicada integralmente ou lacuna que precisa de trabalho próprio. |
| Histórico | Evidência de outra data/versão; não substitui a conferência da entrega atual.     |

As tabelas visuais abaixo são **valores observados**, exceto onde houver indicação diferente. Os
parágrafos de orientação são **regras de uso**. A [matriz de adoção](#adoption) explicita limites.

Decisões confirmadas e a [constituição](.specify/memory/constitution.md) definem o que deve valer.
Os specs de cada função definem suas regras de negócio. Este guia organiza sua aplicação visual; não
concede acessos, não autoriza funcionalidades e não substitui o
[fluxo de entrega](docs/DELIVERY-WORKFLOW.md). Código e capturas mostram o que existe: uma
divergência de implementação deve ser registrada, sem reescrever silenciosamente a decisão.

Fontes executáveis: [tokens](apps/web/styles/tokens.css), [CSS global](apps/web/app/globals.css),
[componentes compartilhados](apps/web/components/ui/button.tsx) e estilos dos módulos. O layout
importa tokens antes do CSS global. Ao conferir um valor, considerar a última regra aplicável, a
especificidade, o tema e o breakpoint; não copiar a primeira ocorrência do seletor.

## Colors

### Paleta semântica

Usar `var(--color-…)` pelo papel da cor. Não criar um azul próprio para cada módulo nem aplicar
hexadecimais destas tabelas diretamente em componentes novos.

| Token CSS                  | Claro                    | Escuro                | Uso                                  |
| -------------------------- | ------------------------ | --------------------- | ------------------------------------ |
| `--color-canvas`           | `#f3f6fa`                | `#0b1422`             | Fundo da área de trabalho            |
| `--color-canvas-warm`      | `#eaf0f7`                | `#111e30`             | Variação de fundo existente          |
| `--color-surface`          | `#ffffff`                | `#142238`             | Painéis e controles secundários      |
| `--color-surface-subtle`   | `#f7f9fc`                | `#1a2b43`             | Agrupamentos e cabeçalhos suaves     |
| `--color-surface-elevated` | `rgb(255 255 255 / 82%)` | `rgb(20 34 56 / 94%)` | Camadas sobrepostas existentes       |
| `--color-text`             | `#142b49`                | `#f3f6fc`             | Texto principal                      |
| `--color-muted`            | `#52647a`                | `#a7b8cf`             | Descrição e metadados                |
| `--color-muted-strong`     | `#3b526e`                | `#c4d0e1`             | Texto auxiliar com maior destaque    |
| `--color-border`           | `#dce4ee`                | `#2a3e59`             | Separação de superfícies             |
| `--color-border-strong`    | `#b7c7db`                | `#496181`             | Borda reforçada                      |
| `--color-action`           | `#214f86`                | `#91bbef`             | Ação principal, links e seleção      |
| `--color-action-hover`     | `#173b67`                | `#b5d4fa`             | Ação em hover                        |
| `--color-action-ink`       | `#ffffff`                | `#10233d`             | Texto sobre ação principal           |
| `--color-action-soft`      | `#e8f0fa`                | `#203956`             | Destaque suave de ação               |
| `--color-accent`           | `#c62828`                | `#ff3b30`             | Acento institucional pontual         |
| `--color-success`          | `#16754d`                | `#83d5ac`             | Sucesso, sempre acompanhado de texto |
| `--color-success-soft`     | `#e7f4ed`                | `#17392f`             | Fundo de sucesso                     |
| `--color-danger`           | `#ba2828`                | `#ba2828`             | Ação destrutiva; ver ressalva abaixo |
| `--color-danger-soft`      | `#fff1f0`                | `#301b1b`             | Fundo de aviso de erro               |
| `--color-warning`          | `#72580b`                | `#f0d18c`             | Atenção                              |
| `--color-warning-soft`     | `#fff4ca`                | `#382e1b`             | Fundo de atenção                     |
| `--color-info`             | `#175b7a`                | `#a6c9f4`             | Informação                           |
| `--color-info-soft`        | `#e3f2f8`                | `#1b3653`             | Fundo informativo                    |
| `--color-focus`            | `#235ea1`                | `#a7ccfa`             | Indicador de foco                    |
| `--color-focus-contrast`   | `#ffffff`                | `#0b1422`             | Separação do foco do fundo           |

O menu usa sua própria família semântica: `--color-sidebar`, `--color-sidebar-deep`,
`--color-sidebar-text`, `--color-sidebar-muted` e `--color-sidebar-hover`; consultar os
[valores na fonte](apps/web/styles/tokens.css). `--color-violet` é um nome histórico que hoje aponta
para vermelho, e `--color-accent-cyan` aponta para azul: não interpretar esses nomes como
autorização para acrescentar roxo ou ciano à identidade.

`--color-control-bg` e `--color-control-border` são misturas calculadas no CSS global. Algumas
regras finais usam diretamente surface/text/border-strong; a existência de um token não significa
que ele governa todos os componentes com nome semelhante.

### Contraste e temas

Trocar primeiro os papéis de fundo e texto em conjunto. O tema é aplicado por `data-theme` na raiz;
a [inicialização](apps/web/app/layout.tsx) usa a preferência salva ou a preferência do sistema.
Respeitar o [controle existente](apps/web/components/workspace-controls.tsx).

**Pendente de revisão:** `--color-danger` como texto sobre `--color-surface` no escuro produz
aproximadamente **2,60:1**, abaixo do mínimo para texto normal. Sobre danger-soft escuro, cerca de
**2,64:1**. São cálculos dos pares sólidos declarados, não medição de todas as telas. Não adotar
esses pares como exemplo aprovado. O botão danger usa texto branco sobre vermelho, combinação
diferente. Registrar e validar a correção na tarefa funcional responsável; este guia não altera a
paleta.

## Typography

`--font-sans` e `--font-display` declaram a mesma pilha: Inter, ui-sans-serif, system-ui,
-apple-system, BlinkMacSystemFont, Segoe UI, sans-serif. O layout consultado não carrega Inter por
arquivo ou serviço; **não presumir que a fonte renderizada é Inter**. A interface pode usar a fonte
de sistema. Qualquer adoção de arquivo de fonte é mudança própria, com conferência visual e de
carregamento.

| Papel no painel                       | Tamanho                         | Peso/ritmo observado                      |
| ------------------------------------- | ------------------------------- | ----------------------------------------- |
| Título da página (`h1`)               | `clamp(1.65rem, 2.5vw, 2.1rem)` | 750; linha 1,2; tracking −0,035em         |
| Título de quadro (`h2`)               | `1.15rem`                       | Linha 1,35; tracking −0,015em             |
| Subseção (`h3`)                       | `1rem`                          | Linha 1,45                                |
| Contexto acima do título (`.eyebrow`) | `0.68rem`                       | 750; tracking 0,1em                       |
| Descrição da página                   | Herdado                         | Cor muted; linha 1,55                     |
| Rótulo de campo                       | `0.85rem`                       | 650                                       |
| Botão padrão e células de tabela      | `0.875rem`                      | Botão 650, linha 1,35                     |
| Botão de inclusão (`size="add"`)      | `0.95rem`                       | Mesma família dos botões                  |
| Cabeçalho de tabela                   | `0.67rem`                       | Cor muted; conferir legibilidade com zoom |

Os títulos genéricos maiores do início do CSS não são a escala final do painel. Não usar tamanho de
título para substituir a hierarquia semântica: uma página tem seu `h1`, quadros usam `h2` e
subseções `h3`. Manter rótulos visíveis, permitir nomes longos e evitar caixa alta em textos
extensos.

## Layout

### Estrutura de uma listagem

```text
Estrutura do painel: menu lateral + barra superior + conteúdo
  Cabeçalho: contexto, título, descrição          [ + Novo cadastro ]
  Abas do módulo
  Quadro da listagem
    Título do quadro                             [ ↓ Exportar módulo ]
    Busca com lupa no próprio campo              [ Filtros ] [ Limpar filtros ]
    Filtros expandidos, quando acionados
    Tabela ou mensagem de vazio
    Paginação, preservando a consulta
```

A inclusão fica no cabeçalho, com `Plus` e o nome do cadastro; continua visível quando não há
registros, desde que a pessoa tenha permissão. Exportação fica **dentro do quadro, acima dos
filtros**, como ação secundária com `Download`. Esta é uma regra de posição; só mostrar ações
implementadas e autorizadas. Não acrescentar exportação à Consulta OAB.

Referências: [Parceiros](apps/web/modules/partners/ui/partner-list-page.tsx),
[Associados](<apps/web/app/(admin)/members/page.tsx>) e
[Colaboradores](<apps/web/app/(admin)/users/page.tsx>). Abas internas de um cadastro têm hierarquia
própria, abaixo do contexto do registro, sem competir visualmente com as abas do módulo.

### Medidas e ritmo

| Elemento                      | Valor observado                                                  |
| ----------------------------- | ---------------------------------------------------------------- |
| Conteúdo `.page-stack`        | 100% da largura disponível; máximo `88rem`; centralizado         |
| Espaço entre blocos           | `1.25rem`; `1rem` até 760px                                      |
| Área administrativa           | `2rem clamp(1rem, 3vw, 3rem) 3rem`                               |
| Área administrativa até 760px | `1.25rem 1rem 2rem`                                              |
| Barra superior                | Altura mínima `4.5rem`                                           |
| Menu expandido/recolhido      | `--sidebar-width: 15.5rem` / `--sidebar-width-collapsed: 5.5rem` |
| Quadro `.panel`               | Padding `1.35rem`; `1rem` até 760px                              |
| Campos/filtros em grade       | Intervalo usual `1rem`; colunas dependem do conteúdo             |
| Células da tabela             | Padding `0.85rem 0.8rem`                                         |

A escala disponível de espaçamento é `--space-1/2/3/4/5/6/8/10/12`, respectivamente
`0.25/0.5/0.75/1/1.25/1.5/2/2.5/3rem`. Preferir a escala ao criar intervalos novos; as medidas
específicas existentes acima não devem ser arredondadas silenciosamente.

### Tela pequena

Até 760px, o cabeçalho vira uma coluna e a inclusão fica abaixo dos textos; o menu lateral passa a
abrir sobre o conteúdo. Até 600px, ações de `PanelHeading` podem ocupar uma linha própria. Grades
dos módulos têm pontos de quebra específicos: por exemplo, Parceiros reduz seus formulários a uma
coluna até 600px; a ordenação de colunas da exportação usa uma coluna até 900px.

Permitir quebra de ações e texto. Não comprimir todas as colunas de uma tabela até torná-las
ilegíveis: usar `TableContainer`, com rolagem horizontal confinada ao quadro e nome acessível.
Formulários, cabeçalhos e a página inteira não devem depender de rolagem horizontal.

## Elevation & Depth

A hierarquia cotidiana vem de superfícies, bordas e espaçamento. O painel final usa borda de 1px e
sombra discreta `0 2px 5px rgb(10 30 60 / 3%)`; hover mantém essa sombra e a borda. Não elevar ou
animar um quadro inteiro como se fosse um botão.

Os tokens `--shadow-panel` e `--shadow-panel-hover` continuam declarados, mas não descrevem a sombra
final de `.panel`. `--shadow-dialog` é `0 1.5rem 5rem rgb(3 9 22 / 30%)`; o diálogo existente usa
superfície elevada e fundo sobreposto. Reutilizar sua implementação para manter foco, empilhamento e
rolagem, em vez de simular um modal com uma caixa posicionada.

Gradientes e elementos decorativos pertencem a contextos existentes, como autenticação. Não
transportar a apresentação promocional do login para páginas de cadastro.

## Shapes

| Uso                                      | Valor observado      |
| ---------------------------------------- | -------------------- |
| Controle/botão (`--control-radius`)      | `0.6rem`             |
| Quadro `.panel`                          | `0.85rem`            |
| Contêiner de tabela `.table-scroll`      | `0.65rem`            |
| Escala disponível `--radius-sm/md/lg/xl` | `0.5/0.8/1.1/1.5rem` |

A escala declarada não substitui os raios finais dos componentes. Manter a família de formas
existente; não dar a cada módulo seu próprio estilo de cartões ou controles. Avatares podem ser
circulares e indicadores podem ter formato de cápsula conforme o componente existente.

**Marca:** usar [Brand](apps/web/components/brand.tsx) e o
[asset CAAB](apps/web/public/caab-logo.png), preservando proporção e nome alternativo. A marca não
recebe caixa decorativa, borda ou sombra nova. O tema escuro usa o tratamento existente do logo; não
redesenhar a marca com texto, ícones ou imagem gerada.

**Ícones:** Lucide React é a biblioteca padrão. `Plus` acompanha inclusão, `Download` exportação,
`Search` busca e `SlidersHorizontal` filtros. Ícones decorativos usam `aria-hidden`; botões só com
ícone precisam de nome acessível. Nomear a ação pelo resultado, não pelo desenho do ícone.

## Components

### Catálogo e escolhas

| Necessidade                   | Reutilizar                                                                                                                | Orientação                                                                     |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Executar ação                 | [Button](apps/web/components/ui/button.tsx)                                                                               | `type="submit"` ao enviar formulário; tipo padrão é button                     |
| Navegar com aparência de ação | `buttonVariants()` com link                                                                                               | Preservar link nativo, URL e navegação por teclado                             |
| Cabeçalho de quadro com ações | [PanelHeading](apps/web/components/ui/panel-heading.tsx)                                                                  | Título à esquerda; ações à direita e quebráveis                                |
| Abas que navegam              | [ModuleNavigation](apps/web/components/ui/module-navigation.tsx)                                                          | Região nomeada, link ativo com `aria-current="page"`                           |
| Busca/filtros                 | [SearchField e FilterToggle](apps/web/components/ui/search-controls.tsx)                                                  | Lupa interna; expansão com estado e região associada                           |
| Campo com rótulo/erro         | [FormField](apps/web/components/ui/form-field.tsx) e [Input](apps/web/components/ui/input.tsx)                            | Dica e erro ligados ao controle, sem depender de placeholder                   |
| Telefone, CPF, CNPJ, CEP, OAB | [MaskedContactInput](apps/web/components/ui/masked-contact-input.tsx)                                                     | Reusar máscara/colagem/edição; validação do domínio permanece no servidor      |
| Endereço brasileiro           | [BrazilianAddressFields](apps/web/components/ui/brazilian-address-fields.tsx)                                             | Consulta CEP revisável e alternativa manual; obrigatoriedade depende da função |
| Edição preservada             | [WorkspaceDrafts](apps/web/components/workspace-drafts.tsx) e [Draft controls](apps/web/components/ui/draft-controls.tsx) | Isolar por rota/cadastro/formulário; não criar armazenamento paralelo          |
| Dados tabulares               | [Table e TableContainer](apps/web/components/ui/table.tsx)                                                                | Cabeçalhos, caption e região de rolagem identificada                           |
| Confirmação/diálogo           | [Dialog](apps/web/components/ui/dialog.tsx)                                                                               | Título, consequência, fechar/cancelar e retorno de foco                        |
| Carregamento de página        | [PageLoading](apps/web/components/ui/page-loading.tsx)                                                                    | Texto de estado; esqueleto decorativo escondido de leitura assistiva           |
| Erro que exige atenção        | [Alert](apps/web/components/ui/alert.tsx)                                                                                 | `role="alert"`; sucesso/progresso rotineiro usa região de status               |
| Exportação direta             | [ExportScreen](apps/web/modules/exports/ui/export-screen.tsx)                                                             | Filtros, colunas e ordem antes dos três downloads                              |

### Botões

| Variante             | Quando usar                                                               |
| -------------------- | ------------------------------------------------------------------------- |
| `primary`            | Ação principal do contexto, como criar/salvar                             |
| `secondary` (padrão) | Exportar módulo, voltar, filtrar, cancelar e ações auxiliares             |
| `neutral`            | Ação discreta cinza já adotada para gerar nova senha em Colaboradores     |
| `danger`             | Ação destrutiva identificada por texto e confirmação aplicável            |
| `ghost`              | Controles discretos existentes, como a lupa interna; não remove nome/foco |

`default` e `compact` têm altura mínima final de `--control-height: 2.75rem` (44px com raiz de
16px), padding `0.65rem 1rem`, fonte `0.875rem` e borda de 1px. Não reaplicar as antigas medidas
3,1/2,85rem do documento de 10/09. `add` tem mínimo de `3rem`, padding `0.8rem 1.25rem`, fonte
`0.95rem` e ícone de 20px. Medidas em pixels aqui são equivalências, não substituem rem.

Manter texto, indicador de atividade e bloqueio de envio duplicado durante salvamento. Diferenciar
desabilitado por estado da operação de ausência de permissão. Hover e active não devem deslocar a
ação. Botões e links seguem o foco global: contorno de 3px, afastamento de 3px e separação de 6px.
Inputs/selects/textareas têm regra posterior de 2px, afastamento −1px e sem sombra; não presumir o
mesmo desenho em todos os controles. Conferir recorte por contêineres e contraste efetivo.

### Abas, busca e tabelas

Abas do módulo navegam entre páginas. Seções dentro do cadastro seguem o tratamento existente de
Parceiros: texto, faixa contextual e linha inferior ativa. Esse padrão visual não transforma
automaticamente botões em um widget ARIA de tabs; manter semântica compatível com a interação real.

Filtros mostram rótulos e mantêm os critérios ao paginar. Limpar filtros é ação explícita.
Diferenciar “nenhum cadastro” de “nenhum resultado para estes filtros”, oferecendo próximo passo
autorizado. Não colocar formulário de inclusão permanente acima da tabela.

<a id="localizacao-formato-e-aplicacao-dos-filtros"></a>

### Localização, formato e aplicação dos filtros

| Elemento          | Localização e apresentação                                                                              | Comportamento                                                                         |
| ----------------- | ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Busca principal   | Primeira linha do quadro, abaixo de seu título/exportação; rótulo acima; lupa à direita dentro do campo | Enter ou lupa submete a busca; dizer no rótulo o que pode ser encontrado              |
| Filtros           | Ao lado da busca no desktop; botão secundário com SlidersHorizontal                                     | Expande/recolhe a região abaixo; comunica expansão e quantidade conforme o módulo     |
| Limpar filtros    | Na mesma faixa de ações, quando houver busca, filtros ou região expandida                               | Restaura os padrões do módulo e a consulta; não apaga rascunhos de outros formulários |
| Campos adicionais | Grade abaixo da busca, antes dos resultados; sem quadro decorativo extra                                | Rótulo acima de cada controle; opções “Todos/Todas” deixam o significado explícito    |
| Período           | Par de campos de/até na grade                                                                           | Validar início/fim; manter valores inválidos visíveis para correção                   |
| Aplicar filtros   | Na região de filtros quando há critérios com aplicação explícita, como datas em Colaboradores           | Usa os critérios preenchidos; evita múltiplos envios enquanto atualiza                |
| Paginação         | Depois dos resultados                                                                                   | Preserva critérios aplicados; nova consulta volta à primeira página                   |

Formato observado em `.list-filters`: quatro colunas; duas até 1100px; uma até 600px. Intervalo de
1rem e margem superior de 1rem. `.filter-toolbar` usa flex com quebra e intervalo de 0,65rem; busca
cresce a partir de 18rem e ocupa a linha até 600px. Campos têm altura de `--control-height`, borda
de 1px, raio `--control-radius`, superfície do tema, texto principal e fonte de 0,95rem. A busca
reserva 3rem à direita para a lupa. Rótulos e foco seguem os controles compartilhados.

**Aplicação observada:** selects de Parceiros/Associados/Colaboradores atualizam a consulta ao
mudar; busca textual é submetida por Enter/lupa. Datas de Colaboradores esperam “Aplicar filtros”.
Preservar esse comportamento ao documentar ou reutilizar a tela; uma mudança para aplicação uniforme
precisa ser especificada, não feita apenas para o desenho ficar igual.

| Módulo de referência                                          | Busca e filtros próprios                                                                                                        |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| [Parceiros](apps/web/modules/partners/ui/partner-filters.tsx) | Nome ou CNPJ; categoria e situação. Benefícios usa benefício/parceiro, situação e canal                                         |
| [Associados](apps/web/modules/members/ui/member-filters.tsx)  | Nome, CPF ou inscrição OAB; estado da OAB, análise, arquivamento, exclusão e situação administrativa                            |
| [Colaboradores](apps/web/modules/users/ui/user-filters.tsx)   | Nome, CPF ou e-mail; situação, cadastros atuais/pendentes/excluídos/todos, função/sem função quando disponível, cadastro de/até |
| [Exportação](apps/web/modules/exports/ui/export-screen.tsx)   | Critérios do catálogo do módulo, em tela própria; seleção/ordem de colunas abaixo dos filtros                                   |

Busca mista não recebe máscara de CPF/CNPJ: ela precisa continuar aceitando nomes e termos parciais.
Na exportação de Colaboradores, CPF aceita máscara ou parte dos dígitos; isso não equivale à
validação de CPF completo no cadastro. Não copiar todos os filtros para todos os módulos nem ampliar
uma consulta silenciosamente quando a entrada for inválida.

Tabelas usam cabeçalhos associados às colunas e nomes como links de conteúdo. Quando a linha inteira
é navegável, preservar o link nativo e não criar ações aninhadas que disputem o clique. Estado
precisa de texto, mesmo acompanhado de cor. Não ocultar colunas ou truncar valores essenciais
silenciosamente.

### Formulários e seletores

```text
Cabeçalho: Novo cadastro / nome do registro      [ Voltar ]
Navegação de seções, se necessária
Quadro: dados relacionados
  Rótulo
  Controle
  Dica ou erro associado
  Demais campos em grade que vira uma coluna no celular
  Resultado da operação                         [ Cancelar ] [ Salvar ]
```

<a id="posicao-dos-campos-e-acoes"></a>

### Posição dos campos e ações

Manter a ordem de leitura e de Tab igual à ordem visual: esquerda para direita, depois a linha
seguinte; no celular, de cima para baixo. Agrupar por assunto com títulos/legendas, sem alternar
dados cadastrais, permissões e ações destrutivas no mesmo bloco. Colunas largas recebem textos
longos; não fixar larguras que cortem nome, endereço ou mensagem de erro.

Cada campo usa esta sequência: **rótulo → controle → dica → erro**. A dica pode coexistir com o
erro; ambos ficam associados ao controle. A mensagem de falha geral aparece no contexto do
formulário, perto das ações, sem substituir o erro específico. Ação embutida, como lupa/mostrar
senha, fica à direita com espaço reservado, sem cobrir a digitação.

| Contexto                   | Ordem/posição a preservar                                                                                                                                         |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Criação de Colaboradores   | Instruções; nome e CPF; e-mail e telefone; endereço em bloco de largura completa; funções iniciais se permitidas; resultado da operação; Criar colaborador        |
| Endereço compartilhado     | CEP; rua, bairro, número, complemento; cidade e UF. O componente conserva os limites/obrigatoriedade recebidos da função                                          |
| Formulário de outra função | Seguir o formulário de referência da função; não impor os campos ou a ordem de Colaboradores a Associados/Parceiros                                               |
| Ações finais               | Depois dos campos do formulário correspondente; quando houver `.button-row`, alinhadas ao fim e com quebra. Cancelar/voltar é secundário; salvar/criar é primário |
| Detalhe de Colaboradores   | Gerar nova senha em cinza junto de funções/revogações, acima de Desativar colaborador; exclusão em seção própria, visível para desativados conforme acesso/estado |
| Confirmação                | Título, registro/consequência, motivo apenas quando exigido, cancelar e confirmar; não misturar com o salvamento comum                                            |

O esquema acima expressa composição; não afirma que todo formulário atual tenha botão Cancelar ou
que todas as ações usem `.button-row`. Ao criar esse comportamento, preservar a regra de limpar
apenas o rascunho cancelado e validar a jornada. Referências:
[cadastro de colaborador](apps/web/modules/users/ui/user-form.tsx),
[detalhe](<apps/web/app/(admin)/users/[userId]/page.tsx>),
[endereço](apps/web/components/ui/brazilian-address-fields.tsx).

<a id="mascaras-e-validacao"></a>

### Máscaras e validação

Usar campos estruturados, máscaras e limites já definidos nos contratos. A máscara facilita entrada;
não comprova validade. Marcar obrigatoriedade e opcionalidade com clareza; nunca inferir exigência
institucional a partir de uma decisão estética.

| Campo                         | Apresentação/entrada                                                              | Validação e limite observado                                                                          |
| ----------------------------- | --------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| CPF cadastral                 | `000.000.000-00`; teclado numérico; colagem com/sem pontuação                     | 11 dígitos e verificadores válidos; unicidade de Colaboradores também inclui contas excluídas         |
| CNPJ                          | `00.000.000/0000-00`; máscara aceita letras nas posições permitidas pelo contrato | 14 posições, normalização em maiúsculas e verificadores; não forçar campo numérico puro               |
| Telefone                      | `(00) 0000-0000` ou `(00) 00000-0000`                                             | DDD e oito/nove dígitos locais; contrato armazena sem máscara; não comprova existência da linha       |
| CEP                           | `00000-000`                                                                       | Oito dígitos quando informado; consulta não substitui revisão do endereço                             |
| Inscrição OAB                 | Dígitos, até seis; UF em controle próprio                                         | Contrato específico e preservação de valor legado ao abrir; busca geral permanece mista               |
| E-mail                        | Campo de e-mail, sem máscara                                                      | Formato e limite de 254 caracteres; obrigatoriedade por contexto; troca de e-mail segue fluxo próprio |
| Site                          | Texto/URL, sem máscara                                                            | `http://` ou `https://`, domínio válido, até 500 caracteres no contrato comum                         |
| Número do endereço            | Texto, exemplos `123`, `12A`, `s/n`                                               | Até 20 caracteres no componente; não usar input numérico                                              |
| Rua/bairro/complemento/cidade | Texto com autocomplete apropriado                                                 | Limites do componente: 300/100/150/100 caracteres; exigência depende da função                        |
| UF                            | Digitar ou selecionar no mesmo campo                                              | Até duas letras, normalizadas em maiúsculas e conferidas no catálogo brasileiro                       |

Fontes: [contatos](packages/contracts/src/brazilian-contact.ts),
[Colaboradores](packages/contracts/src/users.ts), [Parceiros](packages/contracts/src/partners.ts),
[Associados](packages/contracts/src/members.ts), [OAB](packages/contracts/src/oab-lookup.ts),
[controle de máscara](apps/web/components/ui/masked-contact-input.tsx) e
[campo validado](apps/web/components/ui/validated-text-field.tsx). A tabela descreve estes contratos
e não estabelece regras legais ou uma política cadastral para outros projetos.

Validar formato ao sair do campo ou tentar enviar; depois de um erro, atualizar a mensagem durante a
correção. Não mostrar erro para cada caractere de um campo ainda incompleto e não visitado. Reusar o
contrato no cliente e verificar novamente no servidor. Limites e obrigatoriedade de `FormField`
devem ser coerentes com o domínio; espaços sozinhos não satisfazem texto obrigatório. Não aplicar
trim/normalização de campos comuns a senhas.

Mensagens úteis já adotadas: “Preencha este campo.”, “Informe um CPF válido.” e “Informe um CEP com
oito dígitos.” Erro precisa de texto e associação acessível, além da borda/cor. Falha de rede mantém
valores; erro de concorrência mantém a edição e exige resolução, não uma tentativa automática de
sobrescrever. Colaboradores novos exigem nome/CPF/e-mail/telefone e endereço; CEP/complemento são
opcionais, e registros antigos incompletos podem ser completados gradualmente. Não generalizar essa
exceção de legado para outros módulos sem consultar sua spec.

**Seleção com busca:** digitação e seleção ficam no mesmo controle, seguindo a interação de UF. O
endereço existente usa input com `datalist`; conferir seleção, digitação e teclado no navegador
alvo. Listas pequenas sem busca podem continuar com select nativo. Não criar um campo de pesquisa
separado acima do select. Se o componente necessário ainda não existe, registrar a lacuna e validar
a solução antes de tratar o padrão como implementado.

Falha, demora ou ausência de CEP não elimina preenchimento manual. Resposta antiga não deve
substituir edição recente. Não replicar a obrigatoriedade de um módulo em todos os endereços.
Uploads indicam formatos/tamanho conforme contrato, inclusive JPG quando aceito, e distinguem
seleção, envio, processamento e liberação; não prometer disponibilidade antes da verificação.

### Exportação

```text
Exportar módulo                                [ Voltar à lista ]
Quadro
  Filtros pertinentes + ordenação dos registros
  Colunas autorizadas: selecionar e subir/descer na mesma lista
  Mensagem de andamento/erro
  [ Exportar em Excel ] [ Exportar em CSV ] [ Exportar em PDF ]
```

Os três formatos são obrigatórios: `.xlsx`, `.csv` e `.pdf`. Respeitam os mesmos filtros e
seleção/ordem de colunas; ordem de colunas não é ordenação dos registros. Ações de mover colunas
precisam funcionar por teclado, sem depender de arrastar. O download começa diretamente, sem etapa
obrigatória de fila/histórico, prazo para buscar o arquivo ou teto funcional de registros/período.
Não exportar apenas a página visível nem truncar silenciosamente.

Exigir consulta ao módulo/dados e permissão geral de exportação; não exigir alteração cadastral. O
servidor revalida acesso e campos. Consulta OAB é exceção explícita, sem exportação própria. Falha
mantém a configuração para tentar novamente. Regras completas e estado da migração estão no
[padrão de exportação](docs/EXPORT-STANDARD.md); o guia não estende essa jornada a
anexos/documentos.

## Do's and Don'ts

| Faça                                                                  | Evite                                                        |
| --------------------------------------------------------------------- | ------------------------------------------------------------ |
| Parta de Parceiros/Associados e dos componentes comuns                | Criar uma apresentação independente por módulo               |
| Mostre “Novo parceiro”, “Novo associado”, “Novo colaborador” com Plus | Usar só “Adicionar” ou esconder a inclusão no estado vazio   |
| Coloque exportação no cabeçalho do quadro                             | Disputar com a inclusão no cabeçalho da página               |
| Use seleção e digitação no mesmo campo quando houver busca            | Empilhar busca separada e select                             |
| Preserve valores, erros e versão da edição                            | Apagar o formulário ao trocar de aba ou esconder conflito    |
| Use tokens por função e confira a cascata final                       | Copiar hex/medidas de relatório antigo                       |
| Nomeie estados e consequências                                        | Comunicar situação apenas por vermelho/verde ou ícone        |
| Registre lacunas com fonte e tarefa responsável                       | Tratar protótipo, captura ou tarefa marcada como homologação |
| Reaproveite soluções existentes                                       | Criar abstração para uma reutilização apenas imaginada       |

## Interaction

### Estados obrigatórios

| Estado            | Resposta esperada                                                                                        |
| ----------------- | -------------------------------------------------------------------------------------------------------- |
| Vazio             | Explicar ausência; manter inclusão autorizada; com filtros, oferecer ajustá-los/limpá-los                |
| Carregamento      | Informar o que está carregando; anunciar sem prender foco; evitar salto e envio repetido                 |
| Sucesso           | Confirmar o resultado específico; limpar apenas o rascunho salvo; manter contexto útil                   |
| Erro de campo     | Mensagem próxima e associada ao controle; indicar como corrigir; conservar demais valores                |
| Falha de operação | Mensagem compreensível e recuperação aplicável; manter dados; não exibir stack/segredos                  |
| Concorrência      | Informar alteração por outra operação; preservar edição, erro e versão; não sobrescrever silenciosamente |
| Sem acesso        | Ocultar módulo/ações não autorizados; URL/API privadas negam; não revelar dados em busca ou Início       |
| Somente consulta  | Exibir dados permitidos sem sugerir possibilidade de salvar/alterar                                      |
| Indisponibilidade | Explicar condição e próximo passo real; não apresentar indisponibilidade como lista vazia                |

### Edição e ações sensíveis

Preservar conteúdo não salvo ao navegar entre módulos e abas do painel; isolar por cadastro e
formulário. Limpar ao salvar com sucesso, cancelar ou sair da sessão. Uma falha de salvamento não
equivale a sucesso. Preservar erros de concorrência e a versão que originou a edição ao retornar.

O mecanismo atual guarda rascunhos **em memória do painel autenticado**. Não promete recuperação
após recarregar a página, fechar o navegador ou em outro dispositivo. Não persistir senhas,
credenciais ou documentos em localStorage para ampliar essa promessa. Preferência de tema é um caso
separado de rascunho cadastral.

Confirmar ações sensíveis com registro e consequência identificáveis. Excluir, desativar, arquivar e
revogar acesso não são sinônimos. Motivo obrigatório está confirmado somente nas solicitações de
exclusão de Colaboradores/Associados; demais ações não devem ganhar justificativa por padrão.
Histórico sem motivo usa “Motivo não registrado”. Prazos e efeitos pertencem aos specs dos módulos.

### Linguagem e datas

Usar português brasileiro, rótulos concretos e frases curtas: “Salvar alterações”, “Voltar à lista”,
“Nenhum parceiro encontrado”. Colaboradores são contas/permissões do painel; Associados são
cadastros atendidos pela CAAB. Recursos Humanos não é sinônimo de Colaboradores.

Datas de negócio seguem `America/Bahia` onde definido; exibir contexto de horário quando relevante,
sem converter datas civis como nascimento em instantes deslocados. Persistência de instantes usa
UTC. Um input nativo de data pode mostrar formato conforme navegador/sistema, mesmo com página
pt-BR; não prometer `dd/mm/aaaa` apenas por definir o idioma. Não expor identificadores técnicos no
fluxo normal quando não ajudam a pessoa a decidir.

## Accessibility

A [constituição](.specify/memory/constitution.md) exige **WCAG 2.2 AA**. Conferir nas jornadas
afetadas, nos dois temas:

- Texto normal com contraste de pelo menos 4,5:1; texto grande, 3:1. Elementos visuais necessários
  para reconhecer controles/estados devem cumprir os critérios aplicáveis de contraste não textual.
- Teclado alcança todas as ações em ordem lógica; foco visível não fica inteiramente encoberto.
  Diálogos contêm o foco e o devolvem ao acionador ou a um destino lógico.
- Labels, nomes, instruções, erros e estados têm associação semântica; mudanças são anunciadas
  conforme urgência, sem mover foco a cada atualização.
- Ampliar texto a 200% e conferir reflow em largura equivalente a 320 CSS px. Tabelas podem precisar
  de rolagem bidimensional própria; isso não justifica rolagem horizontal da página inteira.
- Alvos atendem a 24 × 24 CSS px ou às exceções do critério AA. O padrão CAAB de altura de 44px é
  uma escolha do componente; medir também largura/espaçamento de controles só com ícone.
- Preservar alternativa à ação de arrastar, respeitar movimento reduzido, validar cores forçadas e
  não usar cor ou ícone como única informação.

Referências: [WCAG 2.2](https://www.w3.org/WAI/WCAG22/quickref/) e
[alvos mínimos e exceções](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum).
Verificação automatizada ajuda a detectar falhas; não substitui revisão manual de teclado, leitura,
zoom e compreensão das ações.

### Roteiro de revisão de uma alteração visual

| Jornada            | Conferir antes de concluir                                                                            |
| ------------------ | ----------------------------------------------------------------------------------------------------- |
| Listagem           | Cabeçalho/abas; inclusão e vazio; filtros combinados/limpeza; paginação; consulta/sem acesso          |
| Cadastro           | Máscaras/colagem; validação; seções; sair e voltar sem perder edição; salvar/cancelar; conflito       |
| Exportação         | Posição; filtros; seleção/ordem por teclado; três formatos; conteúdo autorizado completo; falha/retry |
| Temas e telas      | Claro/escuro; desktop 1280px e celular 390px como amostras; acrescentar 320px/zoom; nomes longos      |
| Operação assistiva | Tab/Shift+Tab/Enter/Escape conforme controle; foco; nomes/erros/status; rolagem e modal               |

Registrar versão, dimensões, tema, cenário e resultado; usar dados sintéticos. Não iniciar preview
nem reutilizar banco de demonstração para testes sem seguir o workflow operacional. A entrega deste
documento não executa essas jornadas novamente: registra evidência consultada e o roteiro futuro.

## Adoption

### Estado da base consultada em 22/09/2026

| Área                                           | Estado e limite                                                                                          |
| ---------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Tokens claro/escuro, estrutura e controles     | Observados no código; cores/medidas documentadas, sem declaração de conformidade de todas as combinações |
| Parceiros/Associados                           | Referência existente de listas, inclusão, filtros e formulários; não implica exportação direta concluída |
| Cabeçalho de quadro/exportação e botão neutral | Integrados pelo PR37 em `3907248`; referências disponíveis nesta base                                    |
| Colaboradores: exportação direta               | Referência dos três formatos/colunas; evidência do PR37 não homologa outros módulos                      |
| Auditoria/Relatórios                           | Posição do botão padronizada no PR37; migração de fluxo/formato continua nas respectivas tarefas         |
| Rascunhos                                      | Base compartilhada existente; cobertura de cada novo formulário precisa de verificação                   |
| Seletores pesquisáveis                         | Regra transversal; adoção deve ser conferida por controle, sem supor migração global                     |
| Vermelho de erro no escuro                     | Pares de baixo contraste identificados; correção funcional fora desta entrega                            |
| Cores Legado                                   | Pendente: vermelho/branco na disposição do site antigo, após consultar referência; CAAB continua padrão  |
| Agendamentos                                   | Primeira versão administrativa; app/site e expansões não são concluídos por este guia                    |
| Mensagens                                      | Comunicados/campanhas com público e programação; protótipo sem homologação, envio real adiado            |
| RH, conversa interna e suporte por tickets     | Possibilidades futuras, sem construção autorizada por este documento                                     |

Pesquisa e decisões: [research.md](specs/001-project-foundation/research.md). Versão de código,
capturas, cálculos e limitações:
[evidência do guia](specs/001-project-foundation/evidence/design-guide-2026-09-22.md). Pendências de
negócio permanecem nos specs responsáveis; não copiar para cá matrizes de documentos, prazos de
retenção, regras de dependentes ou concessões de acesso como se fossem decisões de design.

## Maintenance

### Atualizar junto com a mudança

1. Consultar o guia e a spec da função antes de desenhar. Localizar componente equivalente e sua
   fonte; escolher o menor ajuste coerente com o padrão existente.
2. Se houver divergência, registrar regra, comportamento observado e impacto. Decisão institucional
   depende do responsável; uma exceção estética não pode revogar constituição ou permissão.
3. Quando uma mudança visual for autorizada, atualizar componente/tokens, guia e spec/plano/tarefas
   da função na mesma entrega. Conferir medidas efetivas e temas depois da alteração.
4. Acrescentar evidência de jornadas e limites. Atualizar data e versão documental do guia quando
   seu conteúdo mudar. Revisão de PR e homologação são estados distintos.
5. Manter um `design.md` canônico; documentos especializados apontam para ele. Não copiar normas
   inteiras para novos módulos nem tratar relatório histórico como catálogo vigente.

### Usar como base em outro projeto

Reutilizar **a organização e os critérios**, depois verificar se cada padrão atende ao novo
contexto. Não criar antecipadamente biblioteca compartilhada: a constituição exige três repetições
reais, equivalentes e benefício demonstrável antes de abstrair.

| Pode servir de ponto de partida                            | Precisa ser definido novamente                                   |
| ---------------------------------------------------------- | ---------------------------------------------------------------- |
| Hierarquia, papéis de cor, tabela de componentes e estados | Nome, marca, paleta, tipografia e escala próprias                |
| Checklist de teclado, contraste, temas e responsividade    | Componentes e fontes existentes no novo repositório              |
| Princípio de preservar edição e comunicar falhas           | Ciclo de vida dos dados, sessões, concorrência e recuperação     |
| Método de documentar regra/observado/pendente/histórico    | Módulos, atores, permissões, regras institucionais e integrações |
| Pesquisa, referências, versão e evidência                  | Idioma, timezone, necessidades dos usuários e ambientes de teste |

Para adaptar: inventariar o novo produto; trocar todos os nomes/caminhos/valores CAAB; validar três
jornadas representativas; registrar divergências e decisões locais; só então assumir o guia como
referência daquele projeto. Não transferir automaticamente a exceção OAB, a regra de exportação, os
prazos de exclusão, os requisitos de documentos ou a marca da CAAB.

A organização visual foi inspirada na
[especificação oficial DESIGN.md](https://github.com/google-labs-code/design.md/blob/main/docs/spec.md),
com conteúdo próprio e referências do repositório. O arquivo usa Markdown comum e metadados
legíveis; não promete importação automática, exportação de tokens ou execução de regras por
ferramentas.
