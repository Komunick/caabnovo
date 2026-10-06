# Correções do PR46 — 06/10/2026-CODEX-mafaltti

Autor CODEX; solicitante mafaltti/login Danilo-Komunick, confirmado pelo conector GitHub get_profile
em 06/10/2026. Pedido: corrigir o PR46 aberto na branch
`feature/reports-complete-combined-20261006`, partindo de 04fcd3a. Usuário escolheu restaurar
gráfico e bloco de análise no PDF de Resultados e evolução. Sem merge, serviços locais ou banco de
uso.

## Resultado implementado

- PDF executivo: bloco de análise integral identificado; tabela com colunas escolhidas; barras
  mensais das fontes autorizadas/selecionadas e dos acessos filtrados. Metadados internos de séries
  vêm do mesmo cursor/snapshot e não entram na seleção tabular. CSV/Excel preservados.
- PDF permanece incremental. Só agregados do gráfico passam por spool privado no diretório
  temporário do sistema, removido no sucesso/falha/cancelamento, sem reter o arquivo inteiro.
- Funil único via CTE materializado substitui quatro cálculos equivalentes.
- Solicitar novamente abre filtros na mesma aba com formato validado, comentário integral por
  sessionStorage, filtros e ordenação. Formato anterior vem primeiro, com três alternativas.
- Fonte revogada apresenta alerta e link de retorno, sem formulário. Dataset desconhecido
  mantém 404. Autorização no servidor e revalidações não foram afrouxadas.

As correções anteriores (403 auditado, teto legado e sharp via PR47 já na dev) foram conferidas. CI
37512816327 de 04fcd3a passou quality/browser/security. Log quality 112438064693 foi lido: suíte
report-exports teve 13 testes aprovados e 1 opt-in de volume não executado, incluindo T041 em 590
ms. Esse CI anterior não valida as novas mudanças.

## Validação local e visual

Notebook-Gabriel-Brazil, Node 24.20.0, 8 CPUs, aproximadamente 3,6 GiB livres ao conferir. Execução
sequencial/até dois workers; serviços locais não iniciados. Wrappers pnpm desta instalação não
resolveram os executáveis; ferramentas executadas diretamente por Node dos mesmos node_modules.

- `node node_modules/typescript/bin/tsc --noEmit -p apps/web/tsconfig.json`: aprovado.
- `node node_modules/typescript/bin/tsc --noEmit -p packages/db/tsconfig.json`: aprovado.
- `node node_modules/eslint/bin/eslint.js .`: aprovado.
- Vitest unit completo com `--maxWorkers 2`: 638 testes aprovados fora do sandbox. A primeira
  execução no sandbox teve 637 aprovados e uma falha do tsx (`uv_os_get_passwd ENOMEM`), resolvida
  pela execução autorizada fora da restrição, sem mudar o teste do worker.
- Vitest contract completo com `--maxWorkers 2`: 172 testes aprovados.
- Prettier geral e documentos alterados, `git diff --check`: aprovados.
- PostgreSQL/E2E/build/security da ponta final: serão executados no CI após publicação.

PDF de teste criado pelo writer real com 45 registros e 45 pontos (um zero), duas colunas escolhidas
e comentário com aproximadamente 2000 caracteres. Renderizado com PyMuPDF 1.28.2 (Poppler ausente).
Sete páginas A4 paisagem verificadas: análise completa, três páginas de tabela, três de gráfico; 44
barras vetoriais, sem sobreposição/cortes, rótulos e página/continuação legíveis. Caminho local
ignorado `.cache/qa-pr46/executive-restored.pdf` e PNGs correspondentes, sem dados pessoais.

Revisão pelo guia: Button compartilhado, três formatos, ordem visual/teclado coerente, texto de erro
com role alert e retorno, ausência de estilo novo da interface. E2E acrescenta Axe no fluxo de
retentativa e arquivo real; execução em navegador ficará no CI. QA humano e medições C1/T038
permanecem pendentes e não são presumidos por estes testes. Sem nova migration/permissão/env.
