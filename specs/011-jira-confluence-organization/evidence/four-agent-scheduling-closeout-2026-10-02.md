# Quatro instâncias no fechamento de Agendamentos — 02/10/2026

Autoria: CODEX; solicitante não verificado nesta sessão (consulta GitHub HTTP401). O usuário
confirmou manter quatro terminais independentes e pediu prompts para acelerar Agendamentos e
indicação dos PRs que podem seguir para análise de merge. Esta preparação não iniciou agentes,
alterou suas entregas, publicou comentários/reviews ou executou merge.

## Base conferida e decisão

Fetch confirmou dev/origin/dev748539d. GitHub confirmou os dois PRs abertos, sem merge e mergeable:
PR42 documental em4b4a79b e PR43 administrativo em b676974. Quality/browser/security aprovados nos
CIs37031233977 e37037047877, respectivamente. Acessos continua0cf18c8 local/ f804937 publicado;
Relatórios c8a2614 local/0775bf3 publicado; sem PR dessas duas frentes.

Ambos os PRs podem ir para análise agora, em paralelo. Ordem de merge recomendada:42 antes de43.
Depois de42, conferir a versão combinada e os checks/revisão do43. A revisão humana de mudanças
sensíveis e o plano de rollout permanecem necessários. QA funcional humano pode ocorrer em DEV após
integração revisada; CI/revisão de agentes não o substituem nem autorizam promoção a main.

T107/T039 administrativos já estão tecnicamente concluídos. Dividir o fechamento em quatro revisões
complementares ajuda a localizar bloqueadores e preparar o aceite; não há quatro blocos de
implementação faltantes comprovados. E-mail/app/site/WAHA continuam adiados. A compatibilidade do
futuro PR de Relatórios não vira dependência invertida para integrar Agendamentos.

## Divisão e escrita

| Instância existente | Revisão prioritária agora                                       | Escrita permitida nesta rodada                                                                                 |
| ------------------- | --------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Agendamentos        | Regras de negócio e consolidação final do PR43                  | Única responsável por código/testes/migrations/spec008 e commits do PR43.                                      |
| Documentação        | Rollout0031–0034, conciliação documental e roteiro de QA humano | Relatório local de revisão; proposta de ajustes para a dona do PR43. PR42 permanece com seu escopo documental. |
| Acessos             | Permissões, reautorização e privacidade dos comprovantes        | Relatório local de revisão; preservar G01 e sua branch.                                                        |
| Relatórios          | Exportações e compatibilidade do modelo de reservas             | Relatório local de revisão; preservar c8a2614 e o escopo da própria entrega.                                   |

As quatro instâncias leem o mesmo SHA de Agendamentos. As três revisoras não alteram sua worktree,
não executam builds/instalações nela e não fazem commits nessa branch. Usar git show/diffs do SHA e
evidências existentes. Relatórios independentes sob .cache/coordination/scheduling-closeout-20261002
da principal, um nome por frente; a dona do PR43 transfere apenas conclusões duráveis para spec008.
Não criar specs/tarefas concorrentes. Se a ponta mudar, registrar o novo SHA e revisar o delta
afetado.

## Prompt 1 — instância de Agendamentos

```text
Continue em C:/Projetos/caabnovo/.cache/pr-scheduling-research-20260923,
branch feature/scheduling-administrative-20261002, PR43, referência b676974.
Você é a única instância autorizada nesta rodada a editar essa entrega.

Leia AGENTS, o agentcache da principal, spec008/spec/plan/tasks/contratos e
evidence/publication-2026-10-02.md. Confira Git/PR antes de agir.
Priorize Agendamentos (CAAB-37): revise os caminhos críticos de sobreposição,
bloqueio cadastral, aprovação, duas trocas voluntárias, recuperação isenta,
faltas, justificativas, contestações e expiração contra os contratos vigentes.
T107/T039 já passaram no CI; reutilize a evidência do SHA aprovado.

Em paralelo, três instâncias revisarão rollout/documentação, segurança e
compatibilidade. Os relatórios estarão na principal, em
.cache/coordination/scheduling-closeout-20261002/rollout-documentacao.md,
acessos-seguranca.md e relatorios-compatibilidade.md. Comece sua revisão;
consolide os três repasses antes de declarar o fechamento. Ausência de repasse
não é aprovação. Atualize o agentcache preservando as demais notas.

Corrija somente defeitos comprovados do recorte administrativo, com regressão
pertinente; preserve migrations aplicadas e não invente regras de produto.
Mantenha um resumo de bloqueadores, correções, SHAs e critérios de QA humano.
Se PR42 entrar em dev, concilie na mesma branch por trechos, preservando HIN,
DS/AC e contratos. Publique ajustes e acompanhe CI no mesmo PR43, conforme
autorização existente; não faça force-push nem dispense checks. Sem mudanças
novas, não repita a suíte inteira. Se PR43 já estiver integrado, não reutilize
a branch; encaminhe correção posterior em nova entrega conforme o workflow.

Sem merge, serviços locais, recuperação WSL, banco de uso ou ativação de
e-mail/app/site/WAHA. Revisão por IA não é QA humano. Ao fechar, registre
evidência na spec008 e repasse no agentcache com título/código dos tickets,
SHA revisado, bloqueadores resolvidos/restantes e próximo passo humano.
```

## Prompt 2 — instância de Documentação

```text
Preserve sua entrega em C:/Projetos/caabnovo/.cache/pr-docs-roles-20260923,
branch docs/documentation-roles-20260923, PR42, referência4b4a79b.
Nesta rodada, apoie o fechamento prioritário de Agendamentos pelo rollout e
pela coerência documental. Leia AGENTS, agentcache da principal, workflow,
spec008/plan/contratos e os documentos do programa002.

Revise somente por leitura o PR43/b676974 da worktree
C:/Projetos/caabnovo/.cache/pr-scheduling-research-20260923. Confira0031–0034,
pré-diagnóstico de sobreposição, ordem de aplicação, exclusões/capacidade,
contadores legados nulos, autoria de sistema, compatibilidade da aplicação e
recuperação sem apagar dados. Diferencie prova em banco descartável de
pré-condições que o humano precisa conferir no ambiente de destino.

Confronte PR42 e PR43 para preservar HIN, DS/AC/roles.md. Aponte instruções
atuais desatualizadas no checkpoint sem tratar histórico como novo bloqueio.
Prepare roteiro curto de homologação em DEV com resultados esperados e
campos de responsável, ambiente, commit e evidência; não marque QA realizado.

Trabalho coberto por Conciliar a documentação do projeto (CAAB-38), Consolidar
o guia de design do projeto (CAAB-39), Impedir sobreposição de agendamentos da
mesma pessoa (CAAB-26) e Operar aprovação, remarcação e recuperação de
atendimentos (CAAB-40). A T099 transversal do programa continua distinta do
merge documental. Não ampliar PR42 com implementação de Agendamentos.

Grave sua revisão na principal em
.cache/coordination/scheduling-closeout-20261002/rollout-documentacao.md
e acrescente repasse próprio ao agentcache após releitura. Inclua SHA,
arquivo/linha, evidência, impacto e bloqueia/não bloqueia merge. A instância
de Agendamentos incorpora correções/evidências; não edite sua worktree.
Não aplique migrations, acesse banco de uso, inicie serviços ou faça merge.
Se PR42 já tiver sido integrado, preserve a branch encerrada sem trabalho novo.
```

## Prompt 3 — instância de Acessos

```text
Preserve C:/Projetos/caabnovo/.cache/pr-access-review-20261002 e seus commits
f804937/0cf18c8. Priorize agora uma revisão de segurança de Agendamentos,
somente por leitura do PR43/b676974 na worktree pr-scheduling-research-20260923.
Leia AGENTS, agentcache principal, spec008/contratos e evidências de testes.

Escopo: Separar consulta e alteração em Agendamentos (CAAB-28) e Tratar
faltas, justificativas e contestações (CAAB-41). Confira servidor e interface:
scheduling:read/write, scheduling:review_absences sem escrita geral implícita,
CSRF, idempotência, versão, reautorização após lock, revogação durante
exportações e acesso privado a comprovantes. Verifique vínculos e escopo
individual sem extrapolar para implementação de consumidores app/site.

Use código e testes/CI existentes para identificar falhas concretas. Distinga
defeito reproduzível, lacuna de prova e decisão de produto; cite arquivo/linha,
cenário, impacto e correção mínima sugerida. Não atribua cargos nem altere
contas. Definir o tratamento das contas atualmente sem cargo (CAAB-47) não
bloqueia a revisão do recorte administrativo. G02/G03 globais permanecem em
Gerenciar cargos e acessos de Administrador, Gestor e Colaborador (CAAB-19).

Grave na principal
.cache/coordination/scheduling-closeout-20261002/acessos-seguranca.md
e deixe repasse no agentcache após releitura. Não altere a branch de
Agendamentos; sua responsável aplica correções. Sem serviços ou merge.
Não declare QA humano. Concluída essa revisão, retome G01 de Mostrar apenas
funções autorizadas na navegação (CAAB-20): após PR42 integrado, concilie sua
própria branch, preserve DS/AC/roles.md, publique o commit documental, valide
e abra o PR funcional conforme autorização anterior, sem duplicar a matriz.
```

## Prompt 4 — instância de Relatórios

```text
Preserve C:/Projetos/caabnovo/.cache/pr-reports-complete-20261002, branch
feature/reports-complete-20261002:0775bf3 publicado e c8a2614 local.
Priorize agora revisar a compatibilidade que interessa ao fechamento de
Agendamentos. Leia AGENTS, agentcache principal, spec008 e spec010, padrão
de exportação e evidência reports-compatibility-2026-10-02.md.

Compare por leitura o PR43/b676974 e sua própria ponta, sem esperar merge
para fazer a análise. Confira runtime.ts, export-screen.tsx, reports.ts,
report-summary.ts e report-overview-export.ts: três grupos de adaptadores,
hooks aditivos, procedure_id, profissional opcional, cinco estados, filtros,
autorização, agregações e coalesce(starts_at,original_start,created_at) nos
dois limites. Distinga regressão do PR43 contra dev de lacuna que só aparece
ao incorporar a futura entrega de Relatórios. Esta última permanece em
Exportar detalhe agrupado, resumo e evolução sem os limites antigos (CAAB-44).

Grave na principal
.cache/coordination/scheduling-closeout-20261002/relatorios-compatibilidade.md
com SHA de cada lado, achados, evidência e dono de cada correção; faça repasse
no agentcache após releitura. Não edite a worktree de Agendamentos nem copie
suas migrations. CI0775bf3 não valida c8a2614 ou a futura versão combinada.

Se Agendamentos entrar em dev, retome T041/T042 na sua própria branch,
conciliando por trechos e executando os testes reais da versão resultante.
Retomar validações de Relatórios bloqueadas pelo WSL (CAAB-46) ainda cobre
C1/T038, inspeção visual e provas restantes; não depender de recuperar WSL
quando houver runner autorizado. Publique a ponta conciliada e abra PR apenas
após os gates, conforme autorização anterior. Sem merge, serviços locais,
banco de uso ou QA humano presumido. Não torne o futuro PR de Relatórios um
pré-requisito para integrar o recorte administrativo de Agendamentos.
```

## Limites de encerramento

Os prompts mantêm as quatro worktrees e os trabalhos anteriores. Revisores trabalham por leitura;
achados comprovados têm uma dona de implementação para evitar concorrência. Não é obrigatório
produzir alterações em cada revisão: um parecer sem bloqueadores deve dizer o que foi conferido e
quais limites permanecem. Não criar tarefas ou repetir suítes apenas para ocupar as instâncias. Os
três pareceres apoiam o review humano; não concedem aprovação nem merge automaticamente.
