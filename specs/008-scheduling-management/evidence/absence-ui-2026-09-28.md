# Faltas — interface administrativa, 28/09/2026

Registro: interface-de-faltas-CODEX-mafaltti. Solicitante mafaltti (Danilo-Komunick), perfil GitHub
autenticado consultado nesta sessão em 28/09. Fonte: continuação da implementação em paralelo com
clarify e respostas registradas na [spec](../spec.md). Worktree
`.cache/pr-scheduling-research-20260923`, branch `codex/scheduling-market-research-20260923`, HEAD
`500f84f` mais alterações locais. O [núcleo anterior](absence-policy-2026-09-28.md) e seu manifesto
registram a etapa anterior; não representam os arquivos após este incremento.

## Comportamento

- Lista Faltas com busca por beneficiário, situação, paginação e ligação ao detalhe da reserva. A
  situação do pedido é independente do término da restrição: análise pode continuar após 30 dias.
- Registro após o término de reserva confirmada, com confirmação dos prazos e consequências. OK
  fecha o aviso sem comando ao servidor nem alteração de prazo.
- Justificativa/contestação com explicação, upload privado e verificação técnica do arquivo.
  Rascunho em memória durante navegação interna; envio incompleto destaca e foca o campo. Fechar
  preserva a edição; descartar limpa texto, arquivo e erros. Conflito preserva o rascunho.
- Revisão e comprovantes exigem consulta + permissão dedicada. Leitores recebem somente metadados.
  Revisor não precisa de alteração geral da agenda. Decisão humana com confirmação e consequências.
- Exportação CSV/Excel/PDF com os filtros da lista, sem explicação, referência de comprovante ou
  contatos de e-mail. Usa o mecanismo transversal de exportação.
- Projeto apenas intermediário: não define critérios nem automatiza análise de mérito institucional.
  E-mails definidos como operacionais; no caso de dependente, dependente e titular. Intenção
  pendente continua distinta de entrega; nenhum e-mail real foi enviado nesta validação.

## Validação concluída localmente

| Verificação                                                        | Resultado                                                                                                                                                         |
| ------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Unitários focados de Agendamentos/contratos locais/permissões/cron | 165/165 em 13 arquivos                                                                                                                                            |
| Contratos da aplicação                                             | 169/169 em 24 arquivos                                                                                                                                            |
| Integração PostgreSQL de faltas                                    | 22/22                                                                                                                                                             |
| Consulta paginada, situações e autorização                         | 13/13                                                                                                                                                             |
| Exportação e regressão dos datasets                                | 27/27, inclui 100 registros/vazio nos três formatos e privacidade                                                                                                 |
| Build de produção                                                  | Next 16.3.4 aprovado, TypeScript e 56 páginas                                                                                                                     |
| Tipos web e lint focado                                            | Aprovados na consolidação                                                                                                                                         |
| Navegador Chromium                                                 | 2/2 jornadas, 58,3 s                                                                                                                                              |
| Guia visual e acessibilidade                                       | 18 capturas: detalhe/revisão, lista e exportação em 1280/390/320px, claro/escuro; Axe sem violações, reflow sem overflow da página, contraste do detalhe aprovado |

Preparação exclusivamente sintética: PostgreSQL Testcontainers 256 MiB/uma CPU, um contêiner por
vez; servidor temporário na porta 3107, Node 384 MiB/duas CPUs/prioridade baixa. O runner mantém
URLs explícitas do banco descartável e encerra os recursos de teste. Preview de uso, worker e
scanner permanecem pausados; banco e contas de uso não foram alterados.

Ocorrências de preparação corrigidas: cast UUID/text no fixture de consulta, política de capacidade
e prefixo de armazenamento no fixture do navegador, seletor ajustado ao rótulo acessível efetivo e
protocolo `postgresql://` na URL temporária exigido pelo validador existente. Nenhuma regra de
produto ou assertiva de comportamento foi removida para contornar essas falhas.

A jornada principal usou upload real privado, envio e confirmação. A liberação por scanner foi
simulada exclusivamente no banco sintético; validação técnica não significa aceite de mérito. O
navegador confirmou OK sem mutação de prazos, erro obrigatório com foco, rascunho preservado na
navegação interna, preservação das reservas durante análise, aceite com Falta abonada, três
intenções (sem envio) e arquivos CSV/Excel/PDF baixados e lidos. A segunda jornada comprovou revisor
sem alteração geral, download privado dos bytes, rejeição com cancelamento apenas dentro do período
e 403 após retirar a permissão de revisão.

Capturas representativas:
[revisão em computador](absence-ui-2026-09-28/absence-review-1280-light.png),
[revisão em 320px](absence-ui-2026-09-28/absence-review-320-dark.png),
[lista em computador](absence-ui-2026-09-28/absence-list-1280-light.png),
[lista em celular](absence-ui-2026-09-28/absence-list-390-dark.png),
[exportação em computador](absence-ui-2026-09-28/absence-export-1280-light.png) e
[exportação em 320px](absence-ui-2026-09-28/absence-export-320-dark.png). Revisão pela guia não
encontrou divergência neste incremento; tabela móvel mantém rolagem interna. As demais capturas
estão na mesma pasta. O [manifesto SHA-256](absence-ui-2026-09-28.sha256) identifica 43 arquivos de
código/testes/schema e 18 imagens desta etapa.

Comandos executados a partir da worktree, com as variáveis sintéticas do ambiente descartável:

```powershell
node node_modules/vitest/vitest.mjs run --project unit apps/web/modules/scheduling packages/contracts/src/scheduling packages/contracts/src/user-access.test.ts apps/worker/src/jobs/finalize-absences.test.ts --maxWorkers=1
node node_modules/vitest/vitest.mjs run --project contract --maxWorkers=1
node node_modules/vitest/vitest.mjs run --project integration apps/web/tests/integration/scheduling-absence.test.ts apps/web/tests/integration/scheduling-absence-query.test.ts apps/web/tests/integration/scheduling-export.test.ts --maxWorkers=1 --no-file-parallelism
node node_modules/typescript/bin/tsc --noEmit -p apps/web/tsconfig.json
node apps/web/node_modules/next/dist/bin/next build apps/web
node .cache/absence-ui-runner.mjs
```

O runner local cria o contêiner, injeta URLs sintéticas antes do globalSetup, executa
`scheduling-absence.spec.ts` no Chromium e encerra o contêiner ao fim; configuração usa servidor
temporário com `reuseExistingServer: false`. Porta 3107 sem listener após execução. Não reutilizar
defaults de conexão de uso para reproduzir a preparação. T102 concluída; checklist de canais
externos continua sem homologação.

## Limites

Este incremento cobre o painel administrativo. App/site e identidade externa continuam adiados. T089
preserva integração da entrega de e-mails, resolução de contatos, deduplicação, transporte e
recibos; destinatários/preferências já foram definidos, sem nova pergunta de mérito documental. T097
permanece possibilidade futura, sem cancelar reservas após o período. O contador legado de
remarcações continua sem nova decisão. Não houve publicação, PR, merge, deploy ou migration em banco
de uso.

Consolidação: lint e formatação de 41 arquivos TypeScript/TSX aprovados. Principal dev=origin/dev em
89d2356 após fetch final, divergência 0/0. Alterações permanecem somente na worktree, sem
commit/publicação.

Verificação documental final: 131 destinos locais existentes e 61 hashes conferidos; diff-check
aprovado.
