# Decisões de implementação — 02/10/2026

## Revisão do transporte e rascunho — 07/10/2026-CODEX-mafaltti

Fontes primárias consultadas em 07/10/2026:
[preservação e reset de estado no React](https://react.dev/learn/preserving-and-resetting-state) e
[contexto React](https://react.dev/learn/passing-data-deeply-with-context). Estado associado a uma
posição/chave é destruído ao desmontar; contexto permite compartilhar valores na árvore.

Aplicação ao código existente: guardar comentário no WorkspaceDrafts autenticado, mantido entre
módulos, e separar conteúdo inicial suplementar da identidade estável da seleção. A chave de usuário
do provider e limpeza no logout delimitam o contexto; não persistir o comentário em chave global de
storage. Rejeitar transporte de outro destino e limpar em negação. Isso é uma decisão de
implementação para requisitos existentes, sem nova política de acesso. Testes com componentes reais
devem comprovar isolamento e remount; a documentação da biblioteca não comprova o resultado do
projeto.

Exportar detalhe agrupado, resumo e evolução sem os limites antigos (CAAB-44) amplia o conjunto de
adaptadores de Relatórios, preservando cursor, writers, snapshot e revalidação existentes. Não
acrescenta dependência, fila, serviço nem migration. Comparação do código conciliado de
Agendamentos4e9abac guiou a separação das alterações em reports.ts e o reaproveitamento de
initialFilters/renderFilter. Não copiar o modelo novo de reservas isoladamente para uma base sem as
migrations correspondentes; a conciliação posterior preservará a projeção da frente prioritária.

Resumo/evolução usam UNION de projeções agregadas parametrizadas no cursor, em vez de carregar todos
os registros de detalhe no processo ou reconstruir outro motor. Inventário, fontes,
rótulos/definições e SQL do funil são compartilhados com a consulta. Testes de equivalência com
reportSummary/reportUsage são necessários para evitar divergência de agregados. As fontes são
filtros com permissão no catálogo existente; isso permite revalidar a seleção sem confiar em
permissões enviadas pelo cliente ou modificar a autoridade do núcleo. Datas da comparação continuam
obrigatórias; a duração é ilimitada. Detalhe aceita extremos abertos. Não foi realizada nova
pesquisa externa nem presumida homologação das escolhas.

# Complemento — 30/09/2026 (CAAB-24, aba Detalhe)

**Escopo autorizado:** só a exportação da análise detalhada sem agrupamento (T028, T030, T032–T035).
Resumo, Resultados e evolução, detalhe agrupado e downloads legados (T029, T031, T036–T039) seguem
pendentes, sem alteração.

**Decisões:**

- A aba Detalhe passa a exportar pelo núcleo de download direto de 001 (cursor em lotes de 100 e
  reautorização a cada lote), sem fila, sem arquivo guardado e sem teto de linhas ou de período.
- O teto de 50 mil do caminho legado (`queryReport` com `exportAll`, que monta o arquivo inteiro em
  memória no worker) fica como proteção de memória desse caminho, que a aba Detalhe sem agrupamento
  deixa de oferecer. Ele continua servindo resumo, apresentação e detalhe agrupado. _Atualização de
  06/10/2026 (CAAB-44): resumo, resultados/evolução e detalhe agrupado também exportam pelo download
  direto, sem esse teto. O teto de 50 mil permanece só no caminho legado da fila, que não é mais
  oferecido na tela._
- Excel acima de 1.048.576 linhas continua completo: o gravador de 001 abre novas planilhas ("Dados
  2", "Dados 3"…) em vez de cortar.
- Exportar exige, a cada lote, `reports:read`, `exports:generate` e a permissão da fonte
  (`scheduling:read` em Agendamentos).

**Fontes oficiais consultadas em 30/09/2026:**

- [Microsoft, Excel specifications and limits](https://support.microsoft.com/en-us/excel/excel-specifications-and-limits):
  1.048.576 linhas por planilha.
- [PostgreSQL, DECLARE](https://www.postgresql.org/docs/current/sql-declare.html): cursor para ler
  poucas linhas por vez de uma consulta grande.
- [node-postgres, pg-cursor](https://node-postgres.com/apis/cursor) e
  [consultas parametrizadas](https://node-postgres.com/features/queries): leitura em lotes e valores
  sempre fora do texto SQL.

**Limites:** sem medição de volume nesta rodada (T038 pendente); a validação usa a massa sintética
dos testes.

# Pesquisa vigente — 21/09/2026

**Decisão:** Substituir a jornada nova de exportação por filtros/colunas e download direto nas três
abas, preservando métricas, consultas e arquivos antigos.

**Fundamento:** Três abas baixam Excel/CSV/PDF; >50 mil linhas e >366 dias integral, colunas em
ordem exata, campos restritos rejeitados, valores longos completos, downloads legados protegidos;
coleta US4 permanece sem afetar reserva.

**Alternativas:** rejeitar cópia de cadastro, concessão implícita, exportar pela página visual,
gerar Buffer integral e reintroduzir fila/limites funcionais. Quando a função não implementa
exportação nesta fase, preservar seus controles existentes.

**Evidência local:** `packages/contracts/src/reports.ts`, `packages/db/src/repositories/reports.ts`,
`packages/db/src/repositories/report-storage.ts`. Desenho concreto em [plan.md](plan.md). Fontes
oficiais, data, limitações e alternativas na
[pesquisa transversal](../002-integrated-modules/research-2026-09-21.md). Essa revisão não homologa
dependências, desempenho ou produto; testes estão no quickstart.

## Pesquisa anterior — contexto histórico

Decisões de fluxo/armazenamento/exportação anteriores são substituídas pelo plan de 21/09 onde
conflitarem; referências antigas não autorizam funções adiadas.

﻿# Pesquisa — 18/09/2026

## Coleta própria

Não existe provedor/histórico atual. Usar a infraestrutura do monólito evita conta paga e
transmissão a terceiro. Matomo/PostHog são alternativas avaliadas, sem instalação de outro serviço.
Backend externo autenticado integra sites/app.

- [GA4 sessão](https://support.google.com/analytics/answer/12798876?hl=en): 30 minutos de
  inatividade; sessão de uso não equivale a login.
- [Matomo SPA](https://developer.matomo.org/guides/spa-tracking): mudanças de tela precisam de
  eventos mesmo sem reload.
- [Matomo visitantes](https://matomo.org/faq/general/faq_43/): identificação tem limites por
  dispositivo; não somar únicos como pessoas entre canais.
- [PostHog](https://posthog.com/docs/product-analytics): jornadas e retorno.
- [Plausible](https://plausible.io/data-policy): referência de minimização, sem reproduzir
  identificação por IP ou presumir conformidade jurídica.
- [Firebase](https://firebase.google.com/docs/analytics): app exige instrumentação.
- [MDN](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/sendBeacon): envio assíncrono
  pequeno; fetch keepalive quando houver cabeçalhos.

## Exportação

- [write-excel-file](https://github.com/catamphetamine/write-excel-file): XLSX tipado e árvore
  pequena; ExcelJS avaliado, mas desnecessário neste recorte.
- [PDFKit](https://pdfkit.org/docs/getting_started.html): PDF sem Chromium, texto paginado e
  gráficos vetoriais.
- [OWASP CSV Injection](https://community.owasp.org/attacks/CSV_Injection): escapar campos e
  neutralizar fórmulas; XLSX com texto explicitamente tipado.

Reutilizar pg-boss/job_execution/stored_file_content. Bloquear download genérico para report_export;
endpoint próprio revalida conta, proprietário e permissões. Sem truncamento silencioso; limite de
geração explícito. Métricas sem CPF, email, IP bruto, replay, URLs pessoais ou histórico inventado.
Estado atual não reconstrói passado; reservas não são atendimentos e uso administrativo não mede
produtividade.

## Revisão de confiabilidade — 18/09/2026

Documentação instalada do Next 16.3.4
(`next/dist/docs/01-app/03-api-reference/04-functions/after.md`) reconsultada: `after(callback)`
executa logging/analytics após finalizar a resposta, com suporte a Route Handlers. Adotado na
confirmação de reservas; coletor continua melhor esforço, sem garantir entrega se o processo morrer
após a confirmação. Inspeção de `job-runtime.ts`, `job-execution.ts` e configurações locais pg-boss:
uma execução inicial + quatro retries corresponde a attempt_limit=5. O estado persistido failed
descreve a tentativa; histórico deve considerar o contador antes de apresentar falha definitiva. Sem
alteração de política de retries nesta correção.

## Consistência das ações — 22/09/2026

Fonte oficial:
[W3C, WCAG 2.2, identificação consistente](https://www.w3.org/WAI/WCAG22/Understanding/consistent-identification.html).
A orientação favorece identificação consistente de funções repetidas entre páginas. Decisão de
interface solicitada pelo usuário: exportação no topo do quadro de filtros, com ícone e estilo
compartilhados; inclusão primária preservada no cabeçalho. A posição é decisão do produto, não uma
exigência literal desse critério WCAG. Validar foco, contraste e adaptação ao celular; não alterar
contratos de exportação neste ajuste visual.
