# Interface de Parceiros

Definição inicial em 11/09/2026. Referências: telas atuais de Associados e Notícias,
conforme orientação explícita do usuário. Sete páginas principais; abas não são contadas
como páginas adicionais.

| Página | Endereço | Função |
| --- | --- | --- |
| Parceiros | `/partners` | Buscar e filtrar estabelecimentos por nome/CNPJ, categoria e situação; abrir o detalhe clicando na linha; adicionar parceiro. |
| Novo parceiro | `/partners/new` | Cadastrar identificação, categoria e contatos sem justificativa; não cria conta ou acesso ao portal. |
| Detalhe do parceiro | `/partners/{id}` | Consultar e manter cadastro, unidades, contratos e benefícios, com histórico contextual. |
| Benefícios | `/partners/benefits` | Consultar ofertas de todos os parceiros, filtrar categoria/vigência/exibição e abrir o parceiro responsável. |

## Abas do detalhe

## Complemento solicitado em 11/09/2026 (substitui o limite inicial)

| Página | Endereço | Função |
| --- | --- | --- |
| Unidades | `/partners/units` | Consulta geral das unidades, busca/localidade/situação e link para manutenção no parceiro. |
| Categorias | `/partners/categories` | Somente categorias: busca, nome, situação, quantidade de parceiros e cadastro/edição. |
| Configurações | `/partners/settings` | Selecionar quais categorias aparecem na página de parceiros do app; salvar com confirmação e justificativa. |

Navegação do módulo nas páginas gerais: Cadastros, Unidades, Categorias, Benefícios e Configurações.
Novo cadastro e detalhe usam retorno à lista, sem repetir a navegação geral dentro
do cadastro. No detalhe, apenas as seções do parceiro ficam abaixo de sua identificação.
Usar faixa “Dados do parceiro” com controles de texto e indicador inferior ativo,
sem repetir o estilo de botões das páginas gerais. Reutilizar tokens e foco globais;
permitir quebra de linha dos controles no celular.
Acrescentar aba **Avaliações** no detalhe, com estado vazio explícito, notas/textos
originais e moderação justificada. Preservar a aba Unidades no contexto do parceiro.
Controles de configuração agrupados com fieldset/legend e seleção por checkbox;
resultado salvo e conflito apresentados na própria página. Validar os novos caminhos
em desktop/390 px, claro/escuro, teclado e Axe.

## Abas existentes do detalhe

- **Cadastro:** nome, razão social, CNPJ opcional, categoria, contatos e situação; arquivar/restaurar.
- **Unidades:** locais e regiões atendidas, endereço, contato, disponibilidade presencial/remota e situação.
- **Contratos:** referência, condições, datas, documento privado, confirmação de aprovação e encerramento sem justificativa obrigatória; preserva versões anteriores.
- **Benefícios:** título, descrição, condições de uso, público, unidade/contrato, vigência e canais; rascunho, prévia, publicar e ocultar.
- **Histórico:** autor, ação em linguagem simples, data e alterações; preservar justificativas históricas existentes.

Formulários de adicionar/editar unidade, contrato ou benefício permanecem dentro da aba,
com título claro e ações Salvar/Cancelar. Nenhuma tela de RH, crédito, solicitação ou login
de parceiro pertence a este módulo. Portal externo e coleta de avaliações do app têm seus
próprios contratos e dependências.

Decisão vigente: cadastros, edições, mudanças de situação, publicação/retirada,
decisões contratuais, moderação e configurações não exigem justificativa. A regra
anterior de 14/09 foi retirada; preservar confirmação quando cabível, autorização,
auditoria e dados históricos.

## Harmonização obrigatória

- Navegação geral nas páginas de consulta; criação e edição mantêm navegação contextual,
  sem misturar as áreas do módulo com as seções de um parceiro.
- Busca sempre visível; botão e painel de filtros no padrão de Associados.
- Componentes compartilhados de botões, campos e tabelas; adicionar usa tamanho maior e ícone +.
- Linha clicável preserva o link acessível por teclado e os controles internos.
- Ícone de estabelecimento da biblioteca Lucide; tokens existentes de azul, branco e vermelho.
- Nenhuma paleta, estilo de foco ou tratamento de botões exclusivo de Parceiros.
- Estados vazio, carregamento, sucesso, erro e conflito claros; dados preenchidos preservados em falha.
- Verificação visual em desktop e 390 px, temas claro/escuro, teclado e acessibilidade.

## Acabamento da retomada — 11/09/2026

- Histórico distingue carregamento, falha com tentativa novamente e ausência de eventos;
  uma falha de consulta não exige recarregar ou perder o cadastro em edição.
- Benefícios identificam a vigência publicada separadamente do rascunho e permitem
  conferir a prévia da versão publicada, preservada durante alterações privadas.
- Validação usa ambiente descartável; o pedido atual autoriza atualizar o localhost
  3107 com o banco e as contas existentes preservados.
