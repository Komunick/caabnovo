# Compatibilidade de Relatórios com o PR43 — 02/10/2026

Autoria: CODEX-SOLICITANTE_NAO_VERIFICADO. A consulta autenticada desta sessão retornou HTTP401;
nenhuma identidade de outra instância foi reaproveitada.

## Parecer e versões

Não identifiquei regressão bloqueante introduzida pelo PR43, contra sua base dev, no recorte de
exportações e Relatórios examinado. Isso é um parecer por leitura, com consulta às evidências
existentes; não constitui homologação humana nem execução de testes da futura combinação.

O PR43 preserva os adaptadores existentes, acrescenta os de Agendamentos e corrige a projeção de
reservas e o aviso de cancelamentos do resumo. Os riscos descritos abaixo surgem se a futura
conciliação reaplicar arquivos antigos de Relatórios. Sua correção pertence à frente de Relatórios,
em Exportar detalhe agrupado, resumo e evolução sem os limites antigos (CAAB-44), com T041/T042 da
spec010. Relatórios não é pré-requisito para integrar Agendamentos.

| Referência                   | SHA completo                               | Estado consultado                                                                                |
| ---------------------------- | ------------------------------------------ | ------------------------------------------------------------------------------------------------ |
| Agendamentos / PR43          | `b676974a3514f87fcdfbdc943d74e9a013e5dbac` | Conector GitHub: aberto, sem merge, destino dev, mergeable; mesma ponta disponível no Git local. |
| Relatórios / ponta local     | `c8a2614e4bd481ad77a659cd3f5a92e3e49b6818` | Worktree limpa em `feature/reports-complete-20261002`; correção ainda não publicada.             |
| Relatórios / ponta publicada | `0775bf38a58d5ae0fc6b01ad6083ca2bbfab3a22` | CI existente cobre somente esta versão.                                                          |
| Base dev do PR43             | `748539d28ec7c94af5ff3ca7a37c46c73ae102e4` | Base informada pelo GitHub; também disponível no Git local.                                      |

Worktree de Relatórios preservada: `C:/Projetos/caabnovo/.cache/pr-reports-complete-20261002`. As
comparações usam conteúdo imutável obtido por `git show SHA:caminho` e `git diff 748539d b676974`,
além da comparação entre as duas pontas. Não foi realizado merge/rebase, fetch, push, abertura de PR
ou edição de Agendamentos nesta rodada. O estado remoto é o consultado pelo conector, não uma
declaração de sincronização posterior de todas as refs locais.

## Fontes e recorte

Lidos AGENTS e caderno principal, spec/plano/tarefas/contratos das specs008/010, padrão transversal
de exportação e a revisão anterior
`specs/008-scheduling-management/evidence/reports-compatibility-2026-10-02.md`. O retrato antigo
dessa revisão, baseado em4e9abac e alterações locais, foi confrontado com b676974 e c8a2614; seus
hashes não foram tratados como prova da ponta atual. Consultados ainda o corpo do PR43, suas
evidências de publicação, os adaptadores, o catálogo, o SQL de consultas, o núcleo e as regressões
existentes.

As linhas abaixo se referem ao conteúdo Git dos SHAs indicados. Uma futura ponta precisa de nova
conferência; não substituir arquivos inteiros com esses snapshots.

## Conferência dos cinco arquivos

| Arquivo                                                  | Resultado por leitura                                                                                                                                                                                                                                                                                                                                                                            | Responsável / encaminhamento                                                                                                                                                                                                                                            |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/web/modules/exports/runtime.ts`                    | PR43 registra `usersExport`, `reportExports` e `schedulingExports` (linha20). A ponta de Relatórios ainda contém o registry da base dev. A chave é módulo + dataset, portanto `reports.bookings` e `scheduling.bookings` são distintos.                                                                                                                                                          | Relatórios/T042 deve preservar os três grupos quando conciliar. Reaplicar seu runtime antigo apagaria os quatro adaptadores de Agendamentos; isso seria defeito da combinação, não do PR43.                                                                             |
| `apps/web/modules/exports/ui/export-screen.tsx`          | Conteúdo exatamente idêntico entre b676974 e c8a2614. Mantém `initial`, `initialFilters`, `renderFilter`, `context`, `defaultOrderLabel` e `backLabel`, com precedência dos filtros do rascunho e fallback do renderizador.                                                                                                                                                                      | Sem correção identificada no PR43. Relatórios deve preservar esses hooks e conferir novamente na conciliação.                                                                                                                                                           |
| `packages/db/src/repositories/reports.ts`                | PR43, linha50, usa `procedure_id` diretamente, serviço/unidade do procedimento, `LEFT JOIN` do profissional, cinco estados explícitos e `coalesce(b.starts_at,b.original_start,b.created_at)` como referência. Assim não elimina reservas por capacidade nem as rotula indiscriminadamente como canceladas. Relatórios/c8 ainda contém a projeção da dev antiga e acrescenta o gerador agrupado. | Relatórios/T042 combina a projeção do PR43 com seu tipo/gerador agrupado. Restaurar JOIN por assignment/profissional obrigatório, data antiga ou CASE antigo perderia linhas/estados em detalhes, grupos, indicadores e séries. Risco exclusivo da combinação, CAAB-44. |
| `packages/db/src/repositories/report-summary.ts`         | PR43, linha85, já usa coalesce nos limites `>= $1` e `< $2`, sob `scheduling:read`. Relatórios/c8, linha97, contém a mesma correção junto aos helpers `reportInventory`, `reportMetricLabel` e `reportMetricDefinition` (linhas9/36/43).                                                                                                                                                         | Relatórios/T042 preserva simultaneamente a correção e os helpers. Copiar só o arquivo do PR43 removeria exports usados pelo novo overview; copiar a base antiga removeria a correção.                                                                                   |
| `packages/db/src/repositories/report-overview-export.ts` | Ausente em dev e no PR43; existe somente em Relatórios. Em c8, `notice:cancelled` usa coalesce nos dois limites (linha245) e só é produzido com bookings explicitamente incluído. A correção não está em0775bf3.                                                                                                                                                                                 | Relatórios/T040 implementado localmente; T041/T042 ainda exigem execução real na base conciliada. Não é pendência de Agendamentos.                                                                                                                                      |

## Filtros, agregações e autorização

- Os adaptadores de Agendamentos mantêm reservas, cadastros, horários e faltas. Reservas exportam
  `startsAt`/`endsAt` reais, inclusive nulos, e profissional opcional. A referência coalesce de
  Relatórios não fabrica um horário confirmado para a agenda. Os filtros de data da agenda continuam
  filtrando o horário real; os de Relatórios usam a referência da projeção. Essa diferença é
  explícita nos contratos, não foi classificada como regressão.
- Preservados filtros parametrizados, IDs UUID, busca literal escapada, estados permitidos e
  ordenação com desempate por ID. Datas usam dias inclusivos em America/Bahia, com início inclusivo
  e fim exclusivo do dia seguinte. Não foi identificado teto de calendário/página aplicado ao SQL
  direto de exportação.
- O gerador agrupado de Relatórios reutiliza `reportSql` e valida `groupBy` pelo catálogo. Preserva
  filtros e agregação existente; profissional nulo entra em `Não informado`. Ordenação de contagem é
  numérica e a de grupo textual, com ID de desempate. A completude de grupos novos dependerá de
  preservar a projeção bookings correta e validá-la na combinação.
- Detalhe e agrupado exigem a permissão da fonte mais `reports:read`. O catálogo transversal também
  exige `exports:generate`. Overview exige `reports:read` e cada filtro `include_FONTE` tem a
  permissão da fonte; `include_bookings` requer `scheduling:read`. Apenas `yes` inclui a fonte; `no`
  ou ausência a excluem. Seleção de fonte não concede autorização. Catálogo e seleção são validados
  no servidor, inclusive na revalidação.
- `authorizedCatalog`/`authorizeExport` em `catalog.ts` (linhas43–74), `authorizeCurrentExport` em
  runtime.ts e o serviço preservam conta/sessão e permissões atuais antes da leitura, entre lotes e
  nos controles de conclusão. O cursor continua read-only/repeatable-read; writers, cancelamento e
  liberação de recursos permanecem no núcleo compartilhado.

Disponibilizar motor compartilhado de download direto (CAAB-22) e Exportar análise detalhada sem
agrupamento (CAAB-43) permanecem preservados por leitura. Não há reconstrução do núcleo nesta
entrega. Exportar o conjunto completo de dados em Relatórios (CAAB-24) e CAAB-44 exigem os gates
próprios da versão conciliada.

## Evidências e limites da validação

O teste real PostgreSQL do PR43 em `apps/web/tests/integration/scheduling-workflow.test.ts:632–697`
cobre reserva por capacidade sem profissional, estado aguardando aprovação, indisponibilidade com
horário nulo, exportação do estado aguardando nova data, cancelamento sem horário, incremento do
aviso em resumo, período fora da referência e ausência do aviso sem permissão de Agendamentos. São
consultas ao banco e resultados, não testes de string SQL. A inspeção desse teste não equivale à sua
reexecução nesta rodada.

O CI final do PR43, execução37037047877, registra quality/browser/security aprovados:558
unitários,169 contratos,347 integrações,101 E2Es,3 jornadas focadas de Relatórios e6 acessibilidade.
No push37036927947 houve PostgreSQL57P01 ao encerrar conexões, registrado e resolvido pela
reexecução de quality sem alteração de código; o PR passou na primeira execução. Essas são
evidências existentes consultadas, não execução nova deste parecer e não prova dos novos modos de
Relatórios combinados.

O CI de Relatórios37032398048, em0775bf3, aprovou a suíte completa do runner (420 unitários,170
contratos,257 integrações,97 E2Es e6 acessibilidade). A falha local Windows/ENOMEM não se reproduziu
nessa suíte completa, inclusive production-readiness14/14. **CI0775bf3 não valida c8a2614.**

Em c8a2614, `apps/web/tests/integration/report-exports.test.ts:272` prepara seis cancelamentos
sintéticos com fronteiras do período, fallback para criação e prioridade da data original. Espera
três registros no aviso e verifica os três formatos, fonte omitida/no e revogação. Está preparado,
não executado na base conciliada. Não será declarado PostgreSQL validado por mocks, SQL textual ou
schema artificial; original_start depende das migrations reais de Agendamentos.

Há uma nota documental desatualizada em `specs/008-scheduling-management/contracts/exports.md`,
seção final de compatibilidade, que ainda diz que a regressão do aviso não foi executada e que
CI/publicação permanecem pendentes em seção anterior. As evidências finais e T039/T107 registram o
resultado posterior. **Encaminhamento documental à dona de Agendamentos:** atualizar o estado dessas
frases na consolidação; não é defeito de runtime nem dependência de Relatórios. Este parecer não
editou esse contrato.

## Hashes conferidos antes de qualquer combinação

SHA-256 dos bytes retornados por `git show`, sem conversão de fim de linha:

| Arquivo                   | b676974                                                            | c8a2614                                                            |
| ------------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------ |
| runtime.ts                | `555c4977e6af080b4448896ad6773284d00b3fdbf88411352b8bbd044967b27b` | `7132944ebfc70763b947716171ef266e741c13fa2cf40c91e6182585444eefa4` |
| export-screen.tsx         | `ff465480b83acf49dca1fb410ed9522d7a4b9b62bb0de0b8de8b6e23a9139092` | `ff465480b83acf49dca1fb410ed9522d7a4b9b62bb0de0b8de8b6e23a9139092` |
| reports.ts                | `dbe9e56b098d5f0ea6b2a992bc4211cea5d6e63db56c02528421ea3b994a99a7` | `2bb8056115adfebd5de1a0e633f9f652e28d47ddec27ef4b7b3422ca52dcdc76` |
| report-summary.ts         | `b393c319a893ab2b114d366f99752a7ada0b09ecad8e086a32e8e073fefb30a4` | `ed963e0c2b41072adf5693d92f149da7a307ac941cbd503fcbe11e9f6d842b08` |
| report-overview-export.ts | Ausente                                                            | `49bd688f136989410a726c1747fe5ebe2793e8fe530299d28f8e54d13e717453` |

Também conferidos blobs Git idênticos entre dev/b676974/c8a2614 para catalog.ts, query.ts,
service.ts, http.ts e os writers csv/xlsx/pdf. A igualdade comprova preservação desses arquivos, não
valida dados da combinação futura.

## Repasse e sequência após integração humana

1. A dona de Agendamentos consolida o parecer na spec008 e corrige a nota documental apontada.
   Nenhuma correção funcional bloqueante foi identificada neste recorte do PR43 contra dev; os
   demais pareceres e gates de rollout/ segurança continuam independentes deste relatório.
2. Depois de PR43 integrado por quem tem autorização, Relatórios confere dev e hashes, concilia
   somente sua própria branch e preserva projection bookings, registry, hooks e helpers. Não copiar
   migrations0031–0034 isoladamente nem editar a branch encerrada de Agendamentos.
3. Executar T041/T042 com PostgreSQL real e arquivos Excel/CSV/PDF: fronteiras, fallback de datas,
   include_bookings omitido/no/yes, revogação, grupos por profissional nulo/estado/data, filtros,
   agregações, ordenação e completude contra conjunto conhecido. Atualizar spec/evidências/manifesto
   da nova ponta.
4. Executar gates aplicáveis, publicar a ponta conciliada e acompanhar o CI completo. Abrir o PR
   autorizado para dev somente após esses gates, com título
   `feat(relatorios): completa exportações agrupadas, resumo e evolução`. Sem merge ou serviços
   locais.
5. Retomar validações de Relatórios bloqueadas pelo WSL (CAAB-46) permanece cobrindo C1, inspeção
   visual e provas restantes, inclusive acessibilidade e QA humano identificados por
   responsável/versão/resultado. CI e Axe não substituem homologação; não encerrar os critérios pelo
   parecer por leitura.

Somente este relatório de coordenação e o bloco próprio no caderno principal foram escritos nesta
revisão. Código, migrations, ambientes e outputs das outras instâncias foram preservados.
