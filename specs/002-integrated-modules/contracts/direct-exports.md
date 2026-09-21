# Contrato transversal de exportação direta — 21/09/2026

Desenho a implementar. Responsável pela infraestrutura: spec 001; adaptadores e
aceite por função: specs 003/004/005/007/008/009/010. Fonte de produto:
[padrão obrigatório](../../../docs/EXPORT-STANDARD.md). Não há alteração de API nesta fase.

## Autorização e cobertura

`exports:generate` é a única concessão de exportação. Exigir sessão ativa, essa
permissão e leitura da fonte/registro/campo. Não exigir escrita. Exportação nativa
não exige `reports:read`; exportação dentro de Relatórios exige também esse acesso.
O servidor recusa dataset/coluna/filtro/ordenação desconhecidos ou proibidos, sem
remover silenciosamente campos pedidos. Catálogo retornado contém apenas fontes e
colunas acessíveis. A permissão geral isolada não torna módulo descobrível.

| Origem | Fontes/abas no recorte | Consulta exigida |
| --- | --- | --- |
| Colaboradores | contas e acessos visíveis ao gestor | users:read; acessos também sob as permissões existentes de consulta de papéis |
| Auditoria | eventos; Processamentos e tentativas consultáveis | audit:read ou jobs:read, segundo subárea, sem exigir ambos |
| Notícias | Publicadas, Rascunhos e arquivadas; revisões selecionadas conforme tela | news:read; exportação privada preserva distinção revisão/publicação |
| Associados | pessoas/dependentes, vínculos, avaliações, metadados documentais, histórico | members:read; metadados privados seguem também a autorização de arquivos existente |
| Parceiros | parceiros, unidades, categorias, contratos, benefícios, avaliações e configurações consultáveis | permissões atuais de consulta da fonte; arquivos privados continuam separados |
| Agendamentos | reservas/lista/calendário, oferta/catálogo e horários cadastrados | scheduling:read; projeção mínima de beneficiário não libera cadastro completo |
| Mensagens | campanhas/modelos/públicos, programações, execuções e preferências consultáveis | messages:access; gate de continuidade M016, sem contatos/consentimento inferidos |
| Relatórios | Resumo gerencial, Análise detalhada, Resultados e evolução | reports:read + leitura de cada domínio incluído |

Início é agregador de atalhos; Conta/Sessões são utilidades pessoais, não novos
datasets administrativos. Anexos/binários e consumo de API OAB não viram exportação
em lote. A Consulta OAB não tem botão nem dataset de exportação do resultado,
na consulta avulsa ou pelo cadastro, por decisão explícita de 21/09/2026.
Essa exceção não retira os dados cadastrais autorizados da exportação de Associados.
Dados secretos (senhas, tokens, sessão, segredos, bytes de documentos) nunca entram
em catálogos. Não criar datasets para módulos suspensos ou ainda inexistentes.

## Interface e transporte

1. A ação `Exportar [módulo]` abre `/[rota-do-modulo]/exportar`, reaproveitando shell,
   filtros e rascunhos existentes; Auditoria permite escolher sua subárea autorizada.
   Exportação de contexto específico identifica o dataset/registro, sem redirecionar
   a pessoa ao módulo Relatórios. Seleção de colunas inicial é a da tabela do contexto.
2. `GET /api/v1/exports/catalog?module=...&dataset=...` fornece filtros e colunas
   autorizados (key, label, scalarType, defaultSelected, sortable), três formatos e
   token CSRF vinculado à sessão. Sem dados pessoais na URL, respostas private/no-store.
3. Escolher Excel/CSV/PDF submete um formulário POST nativo same-origin para
   `/api/v1/exports/download`, com `requestId` UUID, `csrfToken` e `config` JSON:
   `{module,dataset,filters,sort:[{field,direction}],columns:[key...],format,context?}`.
   A lista `columns` é ordenada, não vazia, única e restrita ao catálogo. Formatos:
   `xlsx`, `csv`, `pdf`. Corpo limitado em bytes pela segurança da requisição, sem
   teto de linhas/período de dados. Não usar fetch.blob() do arquivo inteiro.
4. Servidor valida sessão, Origin configurada, CSRF do formulário e toda a
   configuração ANTES dos primeiros bytes. Esse suporte de token no corpo existe
   somente nesta rota; guardas JSON existentes não são relaxadas. Formulário usa
   frame nomeado para manter a tela de filtros; a resposta attachment inicia o
   download do navegador. Token/identidade não aparecem na URL ou logs.
5. `GET /api/v1/exports/operations/{requestId}` permite somente ao autor autenticado
   acompanhar esta operação (`preparing`, `streaming`, `completed`, `failed`,
   `cancelled`, `interrupted`) e contagem real, sem lista/histórico de downloads.
   O polling começa após submissão, tolera 404 antes do registro e não confirma sucesso
   por ausência de resposta. A tela preserva filtros/colunas/formato em qualquer erro.

HTTP: 200 attachment, MIME do formato, Content-Disposition com nome sanitizado e
extensão correta, Cache-Control private/no-store, nosniff; não armazenar em cache/CDN.
Antes do corpo: 401/403/404 conforme acesso, 409 requestId já usado, 422 configuração
inválida, erro operacional seguro com correlação. Erros de validação autorizados
aparecem na consulta de estado; CSRF/Origin inválidos não criam operação. Erros anteriores ao stream retornam ao frame
um envelope HTML mínimo com postMessage para a origem configurada do painel, requestId
validado e código seguro fixo, sob CSP restrita. Não interpolar token/configuração/texto
arbitrário. O painel valida event.origin, event.source === frame.contentWindow e
requestId corrente; sessão inválida retorna erro explícito, sem redirect para login no
frame. Polling404 transitório ou indisponível não deixa spinner infinito: mostrar falha
recuperável de início não confirmado, sem declarar sucesso ou expiração de arquivo.
Depois do
início, erro destrói a resposta, fecha cursor e registra falha; não finalizar arquivo
parcial como sucesso. UI informa geração/transferência concluída pelo servidor,
nunca afirma que comprovou gravação no disco do usuário.

Repetir a submissão do mesmo requestId não inicia outra geração; tentar novamente
cria novo requestId com a configuração preservada e consulta atual. Não há fila,
link de arquivo com prazo, agendamento, tela de histórico ou retorno posterior exigido.

## Consulta, formatos e recursos

Adaptador fornece catálogo e SQL parametrizado, com filtros do contexto e ordenação
estável (desempate por ID). Cursor PostgreSQL em transação read-only REPEATABLE READ
mantém fotografia consistente dos dados; a autorização é revalidada em conexão
separada READ COMMITTED antes de cada lote e antes de finalizar, para enxergar
revogações durante o snapshot. Cada adaptador fornece IDs e dependências de acesso
do lote; revalidar escopo atual dos registros/campos além das concessões globais. Se algum
registro perder autorização, interromper a operação inteira sem omissão silenciosa.
Fonte apenas por módulo declara ausência de predicado adicional. Novos acessos não
acrescentam linhas ao snapshot em curso. Não manter locks de autorização por toda a transferência.
Reservar pools/capacidade independentes para cursor e controle (autorização/estado/heartbeat),
com orçamento conjunto dentro do banco; nunca esgotar um único pool com cursores que
esperam outra conexão do mesmo pool. Aquisição cancelável e falha operacional recuperável.
Heartbeat continua durante backpressure; não depende exclusivamente da leitura de lotes.
Após revogação, parar emissão; bytes já transferidos não podem ser recolhidos.
Lotes e backpressure limitam memória, nunca o conjunto exportado. AbortSignal,
erro do formatador, desconexão e timeout operacional fecham cursor/transação/streams.

- CSV UTF-8 com BOM, escape de aspas/quebras/separador e proteção contra fórmulas.
- XLSX real por ExcelJS streaming; strings explícitas, estilos limitados,
  useSharedStrings:false e commit por linha. Dividir automaticamente em planilhas
  de até 1.048.576 linhas incluindo cabeçalho; manter o conjunto integral.
- Valores que ultrapassem 32.767 caracteres por célula usam linhas de continuação
  na MESMA coluna, sem coluna de negócio adicional: indicar parte N/M no valor,
  manter posição e ordem, deixar demais células da continuação vazias. Documentar
  a convenção em metadados/legenda; contagem de registros lógicos distingue essas
  linhas físicas. O orçamento da célula inclui marcador N/M e limita quebras de linha;
  dividir em fronteiras Unicode válidas, sem quebrar pares substitutos. Para várias
  colunas longas, alinhar partes por índice em linhas físicas contíguas; remontagem
  remove apenas marcadores gerados e recupera cada valor exatamente. Se o registro
  atravessar planilha, repetir o identificador lógico no metadado da continuação sem
  acrescentar coluna selecionada. Testar marcadores naturais no texto/Unicode e múltiplas
  colunas longas. CSV preserva texto integral; PDF quebra o texto integral em páginas.
- PDFKit em stream, sem bufferPages; repetir cabeçalhos, quebra vertical de texto
  e faixas horizontais contíguas para muitas colunas, na ordem selecionada. Metadados
  de continuação identificam registro/faixa sem acrescentar campo de negócio.
- Nenhum formato substitui outro, corta dados ou escolhe colunas diferentes.
  Arquivo vazio mantém cabeçalhos/contexto. Datas usam UTC no armazenamento e o
  fuso de negócio declarado na apresentação; identificadores permanecem textuais.

Recursos físicos do servidor/proxy/cliente são finitos. C1 de21/09 limita a massa
de validação desta etapa a100 registros sintéticos, conforme [perfil](../export-validation-100.md).
Validar integridade, medições iniciais e interrupção; provas reais de grande volume,
estresse e virada física de planilha ficam fora da rodada atual. Não transformar essa
massa de teste em limite funcional de exportação nem alegar escalabilidade comprovada.
Se writer acumular RAM, bloquear sua entrega e corrigir/validar spool privado
temporário da mesma requisição; não substituir por fila ou Buffer integral.

## Estado operacional e compatibilidade

`export_operation`: UUID, actor_id, module, dataset, format, phase, row_count,
byte_count, started_at, heartbeat_at, finished_at, error_code e correlation_id.
Não persistir filtros pessoais, conteúdo ou URL de download nessa tabela. Atualizações
de estado são operacionais; auditoria append-only separada registra início/resultado.
Heartbeat vencido indica processo interrompido, sem expirar arquivo (não há arquivo
armazenado no fluxo novo). Limpeza institucional/auditoria continua desativada até Q10.
Não há worker de geração para operações novas.

Rotas/arquivos/jobs anteriores continuam acessíveis com autorização atual e compatibilidade
de chaves legadas. Normalizar audit:export/reports:export para exports:generate na
avaliação de snapshots antigos, sem apagar ou reescrever auditoria/bytes. Novos botões
usam somente o fluxo direto. Workers existentes podem concluir apenas pedidos legados;
se forem necessárias adaptações de autorização, preservar todas as leituras de domínio.

## U1 — arquivos antigos

Relatórios segue [autorização de downloads legados](../../010-reports-analytics/contracts/legacy-downloads.md). Normalizar nomes de permissões não basta: complementar exigências salvas com dependências do conteúdo/configuração/gerador, incluindo Agendamentos nos resumos antigos. Fonte indeterminável com segurança nega download; dono, sessão e concessões atuais continuam obrigatórios. Nenhum arquivo antigo é apagado ou reescrito.
