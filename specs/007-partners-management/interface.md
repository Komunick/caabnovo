# Interface de Parceiros

Definição inicial em 11/09/2026. Referências: telas atuais de Associados e Notícias,
conforme orientação explícita do usuário. Quatro páginas principais; abas não são contadas
como páginas adicionais.

| Página | Endereço | Função |
| --- | --- | --- |
| Parceiros | `/partners` | Buscar e filtrar estabelecimentos por nome/CNPJ, categoria e situação; abrir o detalhe clicando na linha; adicionar parceiro. |
| Novo parceiro | `/partners/new` | Cadastrar identificação, categoria e contatos, com justificativa; não cria conta ou acesso ao portal. |
| Detalhe do parceiro | `/partners/{id}` | Consultar e manter cadastro, unidades, contratos e benefícios, com histórico contextual. |
| Benefícios | `/partners/benefits` | Consultar ofertas de todos os parceiros, filtrar categoria/vigência/exibição e abrir o parceiro responsável. |

## Abas do detalhe

- **Cadastro:** nome, razão social, CNPJ opcional, categoria, contatos e situação; arquivar/restaurar.
- **Unidades:** locais e regiões atendidas, endereço, contato, disponibilidade presencial/remota e situação.
- **Contratos:** referência, condições, datas, documento privado, confirmação de aprovação e encerramento com motivo; preserva versões anteriores.
- **Benefícios:** título, descrição, condições de uso, público, unidade/contrato, vigência e canais; rascunho, prévia, publicar e ocultar.
- **Histórico:** autor, ação em linguagem simples, data e justificativa das alterações.

Formulários de adicionar/editar unidade, contrato ou benefício permanecem dentro da aba,
com título claro e ações Salvar/Cancelar. Nenhuma tela de RH, crédito, solicitação ou login
de parceiro pertence a este módulo. Portal externo e coleta de avaliações do app têm seus
próprios contratos e dependências.

## Harmonização obrigatória

- Navegação do módulo e abas na mesma posição de Associados e Notícias.
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
- Validação usa ambiente descartável; atualização do localhost principal suspensa
  por orientação do usuário nesta retomada.
