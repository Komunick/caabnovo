# Integração OAB encontrada no legado

Pesquisa de 10/09/2026, solicitada durante a revisão funcional do spec 005. A documentação existe; a decisão inicial de trabalhar apenas com consulta manual foi tomada sem localizar estes registros. Este documento registra o contrato recuperado, não declara a API homologada no novo painel.

Registro obrigatório do reaproveitamento: [LEG-001](../../../docs/LEGACY-REUSE.md), com
origem, partes usadas, adaptações, validação pontual e condições de revisão. A seção abaixo
preserva o estado da investigação inicial; a validação posterior está registrada em LEG-001.

## Evidências locais

Projeto anterior: `C:/Projetos/caab-caapp`.

- `caab-api-master/docs/apis/api-oab-caab-guide-en.md`: guia de consumo OAB-BA, autenticação por headers, parâmetros e relatórios.
- `mono-caapp-main/packages/api/src/services/apiOab.js`: `getSingleUserStatus(oab)` e `getAllUsersStatus()`, com `API_OAB_KEY` e `API_OAB_PASSWORD` no servidor.
- `mono-caapp-main/packages/api/src/routes/oabTeste.js`: `POST /user/oab/search`, relativo ao prefixo do backend.
- `mono-caapp-main/packages/api/src/controllers/OabTesteController.js`: consulta individual e compatibilidade `oldFormat`.
- `apps/painel-admin/src/features/associados/ConsultaOab.tsx`: tela independente “Consulta OAB”, número OAB/BA, chamada ao backend e timeout de 100 segundos.
- `mono-caapp-main/packages/api/src/tasks/verifyUserStatus.js`: sincronização das situações de associados usando relatórios externos.

## Serviço institucional

`GET https://oab-ba.implanta.net.br/siscaf/servico/api/RelatoriosPersonalizados`

| Campo | Valor/uso |
| --- | --- |
| sistema | `siscaf` |
| modulo | `WEBSERVICE CAAB` |
| nomeRelatorio | `STATUS CAAB` |
| OAB | Número exclusivamente numérico para consulta individual |
| CPF | Alternativa ao número OAB, formatado; não enviar os dois filtros juntos |
| pagina / tamanhoPagina | Paginação; guia informa até 1000 itens por página |
| Headers `Chave` e `Senha` | Credenciais de serviço, exclusivamente no servidor |

O guia identifica o serviço como OAB-BA. Não há evidência de cobertura nacional nem suporte a inscrições com letras/tipos especiais. A consulta avulsa não exige que a pessoa já seja associada, mas está limitada à base coberta pelo serviço. O relatório `LISTA PAGAMENTOS CAAB` é separado e não deve ser usado como parte implícita da consulta de regularidade.

O guia contém credenciais históricas de fevereiro de 2021 e pede confirmação de validade. Nenhuma credencial foi copiada para este documento, para código, frontend ou URL. Não foi feita chamada à instituição nem consulta de pessoas reais nesta pesquisa. A configuração do novo painel ainda precisa ser preparada.

## Retorno e significado

O controller espera uma lista de registros com `Nome`, `OAB`, `CPF`, `SituacaoRegular`, `Detalhe`, `Inadimplente`, `PagoTotalExercicioAtual`, `DataInadimplencia`, `SubSecao` e `DataCompromisso`. Essa é evidência do consumidor legado; validar o contrato vigente antes de adotar campos e tipos como garantidos.

A rotina antiga mapeia `SituacaoRegular === 'SIM'` para `REGULAR`. Já `ATIVO/INATIVO` combina esse campo com aprovação interna, validade da credencial e inadimplência. Portanto, o retorno não comprova sozinho a situação interna do associado, elegibilidade ou direito a créditos.

O serviço antigo também converte falhas em `[]`, confundindo indisponibilidade com nenhum registro. O novo adaptador deve distinguir consulta sem resultado, resposta inválida, credenciais recusadas, timeout e indisponibilidade. Valores de regularidade desconhecidos não devem virar “irregular” por exclusão.

## Escopo a implementar e validar

1. Consulta avulsa de OAB/BA e acesso à mesma consulta a partir de um associado com inscrição compatível, sem necessidade de criar cadastro para consultar.
2. Permissões próprias da área, revalidadas no servidor; acesso inicial apenas ao administrador conforme decisão existente.
3. Credenciais apenas no servidor, endpoint fixo/configurado e tempo limite controlado; nenhum scraping do CNA.
4. Resultado legível com fonte, data e regularidade; exibir somente campos necessários, sem JSON bruto ou CPF desnecessário.
5. Consulta não muda silenciosamente cadastro, finanças, elegibilidade ou créditos. Persistir evidência de consulta/avaliação de forma rastreável, com semântica explícita.
6. Configuração ausente e serviço indisponível têm mensagens claras; não apresentar resultado simulado como consulta real.
7. Testar respostas regulares/irregulares/desconhecidas, inscrições sem resultado, UF não coberta, erros, permissões e preservação das demais dimensões.
