# Evidências — Relatórios e Análises

Entrega em `feature/reports-analytics-20260918`, sobre `dev` 8f12db4. PR [34](https://github.com/Komunick/caabnovo/pull/34).
Validação com dados sintéticos. Localhost, banco e preview principais permaneceram desligados.

## Gates e regressão

- Formatação, lint e typecheck locais aprovados. A execução local completa de unidade/contratos
  encontrou um erro de ambiente do Node/Windows (`uv_os_get_passwd ENOMEM`) em subprocesso
  de um teste preexistente; a mesma suíte passou integralmente no CI Linux.
- [CI de qualidade em fb5736c](https://github.com/Komunick/caabnovo/actions/runs/35350576001):
  352 testes unitários, 121 de contrato e 216 de integração aprovados. Inclui seis testes
  de relatórios com PostgreSQL descartável e papel `caab_runtime`, migrations aplicadas
  duas vezes, testes do tooling de branches, build de produção e segurança.
- Revisão final de navegador em andamento no head da branch; resultado deve ser registrado
  antes de encerrar a entrega. O ciclo anterior teve 80 E2E aprovados e falha no seletor
  do teste novo (campo Relatório), corrigida com nome explícito e locator por combobox. Uma rodada seguinte identificou comparação de filtros dependente da ordem de chaves JSONB: corrigida com normalização pelo contrato e teste de regressão. O CI agora executa primeiro Relatórios e depois mantém a suíte completa.

## Casos cobertos

Contratos: datas reais, intervalo de até 366 dias, limites de período e comparação
anterior, campos/ordenação permitidos, rejeição de propriedades pessoais arbitrárias.

Banco/worker: 65 pessoas sintéticas, filtro de cidade com 55 linhas e segunda página
com cinco; exportação completa além da paginação; filtros de situação exatos;
agrupamento e ordenação; base atual separada do período; consultas pessoais com
concorrência por versão; rollback se a fila falhar; idempotência por proprietário;
lock concorrente sem ampliar grants; PDF/XLSX reais e CSV protegido contra fórmulas.
Download alheio negado, permissão revogada bloqueia geração/download e a rota genérica
de arquivos não contorna o bloqueio.

Métricas: duplicação de evento não altera contagem, visitante/sessão/conta distintos,
ambientes separados, funil com etapas em sequência e nenhuma conta crua armazenada.
HTTP: leitura sem autenticação/permissão negada antes de consultar; leitura de domínio
não é concedida por reports:read; identidade e confirmação de reserva não são aceitas
do cliente do painel.

Navegador: três abas, estado vazio, consultas salvas, navegação e rascunhos, downloads
CSV/XLSX/PDF, coleta de uso, apresentação/Escape, desktop/mobile, claro/escuro e Axe
WCAG 2.2 AA. Ver resultado final do CI e artefato `reports-synthetic-evidence`.

## Revisão visual

PDFKit executado diretamente com massa sintética e PDFs renderizados para PNG com
PyMuPDF, sem subir servidor local. Seis páginas revisadas: detalhamento de 55 registros
com oito colunas em quatro páginas paisagem e executivo com comentários/gráfico em
duas páginas retrato. Acentos, cabeçalhos, numeração e tabelas legíveis; corrigida a
fonte da primeira linha após quebra de página. Arquivos temporários ficam na cache.

Captura de Análise detalhada do CI revisada: cabeçalho, abas, campos, navegação e tokens
seguem o padrão do painel. Revisão das capturas finais gerencial/executiva/mobile pendente.

## Limites de entrega

Sites/app externos ainda exigem integração nos seus próprios backends; não há coletor
instalado nesses projetos nem histórico retroativo. O painel começa a coletar após
implantação. Sem ranking individual de produtividade, receitas ou impacto inferidos.

Arquivo: até 50 mil linhas e consulta de até 366 dias, erro explícito acima do limite.
Política institucional de retenção segue pendente (T089 do programa 002). Exportação
nos demais módulos foi planejada em EXP01–EXP03; seus botões não foram implementados
nesta entrega. Homologação em DEV e revisão humana de permissões/coleta permanecem
responsabilidades de entrega posteriores ao PR. Nenhum merge/deploy foi executado.

Rollback: retornar aplicação/worker ao código anterior, preservando tabelas e arquivos;
interromper consumo da fila report-export. Não apagar dados nem reverter a migration
com operação destrutiva.
