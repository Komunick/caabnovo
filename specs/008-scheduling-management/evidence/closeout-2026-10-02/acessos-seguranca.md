# Revisão de acessos e segurança de Agendamentos — 02/10/2026

Autoria: CODEX. Solicitante identificado nesta sessão pelo conector GitHub: mafaltti
(Danilo-Komunick); a divergência com o ator de push Gabriel-Komunick permanece registrada no
agentcache, sem reatribuição histórica.

## Versão, método e conclusão

Revisão solicitada de Separar consulta e alteração em Agendamentos (CAAB-28) e Tratar faltas,
justificativas e contestações (CAAB-41). [PR43](https://github.com/Komunick/caabnovo/pull/43), HEAD
`b676974a3514f87fcdfbdc943d74e9a013e5dbac`, na worktree
`C:/Projetos/caabnovo/.cache/pr-scheduling-research-20260923`. PR aberto e sem merge na consulta. Os
caminhos/linhas abaixo são dessa versão, não de uma correção posterior.

Somente leitura de AGENTS, caderno principal, guia, spec008/spec/plan/tasks, contratos admin/exports
e fronteira de canais, evidências de faltas/interface/publicação, código e testes existentes. Nenhum
teste executado, serviço iniciado, conta/cargo alterado ou arquivo de Agendamentos editado. Os
cenários dos achados são demonstrações pelo fluxo do código, **não reproduções em ambiente**.

O [CI37037047877](https://github.com/Komunick/caabnovo/actions/runs/37037047877) foi consultado:
quality/browser/security aprovados. A evidência da entrega registra 558 unitários, 169 contratos,
347 integrações (118 de Agendamentos), uma integração opcional ignorada, 101 E2E, três testes
focados de Relatórios e seis a11y. Esses resultados pertencem à entrega; não são testes novos desta
revisão e não cobrem automaticamente os caminhos alternativos identificados abaixo.

**Conclusão:** a separação básica de consulta/escrita/revisão e a exportação têm controles e provas
existentes. Há dois defeitos demonstráveis por inspeção, S01 e S02, que devem voltar à responsável
antes de concluir a revisão sensível. Há também lacunas de cobertura e uma decisão sobre links
temporários; não declarar aceite global, QA humano, merge ou prontidão irrestrita a partir deste
texto.

## S01 — comprovante de falta acessível pelo acervo geral sem revisão dedicada

**Classificação:** defeito de autorização, prioridade alta. O novo uso de arquivos genéricos cria um
caminho alternativo à proteção específica; não é apenas falta de teste.

**Cenário:** uma justificativa usa arquivo privado, limpo e disponível, com `owner_type='member'`,
anexado a uma ocorrência. Outro operador tem `members:read` e `files:read`, mas não
`scheduling:review_absences` (nem precisa de `scheduling:read`). Ele lista os arquivos do associado,
descobre o ID/nome do comprovante e solicita o download pelo módulo de Associados ou pela rota
genérica de arquivos. O Gestor padrão é um exemplo verificável: a view lhe concede ações `read`, mas
não `review_absences`.

**Cadeia de evidências:**

- `apps/web/modules/scheduling/ui/absence-evidence-upload.tsx:65–77`: upload registra o comprovante
  como arquivo comum de `member`, sem finalidade restrita.
- `apps/web/modules/scheduling/absence-service.ts:219–234`: aceita esse arquivo e registra a relação
  em `scheduling_absence_evidence`; não altera sua classificação no acervo geral.
- `apps/web/modules/members/member-service.ts:510–527`: `memberFiles` lista todos os arquivos desse
  `owner_type/owner_id`, sem excluir comprovantes; exige apenas leitura de Associados/arquivos.
- Mesmo arquivo, `:530–549` e `:244–267`: `memberDownload` usa `safeFile` e emite a URL privada, sem
  consultar o vínculo de falta ou a permissão de revisão. `memberFileStatus:552–575` também expõe
  nome/ID/estado sem essa separação.
- `apps/web/modules/members/http/routes.ts:79–91`: GET `/api/v1/members/:id/files` e
  `/api/v1/members/:id/files/:fileId` alcançam esses serviços, este último com redirecionamento307.
- `apps/web/modules/files/file-service.ts:333–351`: GET `/api/v1/files/:fileId/download` encaminha
  arquivos de membro ao mesmo `memberDownload`; proteger só a tela de faltas não fecha a
  alternativa.
- `packages/db/migrations/0026_explicit_module_access.sql:42–72`: Gestor recebe permissões de
  leitura; `0033_scheduling_absence_penalties.sql:64–66` cadastra a permissão dedicada, sem a
  conceder ao Gestor. Não é necessário alterar cargos para construir o cenário.

**Contrato e impacto:** spec008/spec.md:172–175 e plan.md:115–121 reservam texto/comprovantes à
revisão protegida. O contrato admin.md:75–103 descreve essa fronteira. O conteúdo e o nome do
comprovante podem ser consultados por leitor de outro módulo que não recebeu a autorização
específica. Não foi constatado vazamento da explicação por essa rota, apenas do arquivo/metadados.

**Correção mínima recomendada:** diferenciar a finalidade restrita do comprovante no pipeline
existente, desde o upload, e aplicar a mesma restrição à listagem, status e download genéricos.
Preservar o envio/status do próprio operador autorizado e os documentos comuns. Não basta esconder o
link na UI nem filtrar somente arquivos já vinculados: existe a fase anterior à submissão. Uma marca
de finalidade ou escopo equivalente pode reutilizar armazenamento e scanner; não exige reconstruir
cargos, arquivos ou o módulo. A responsável deve escolher o menor ajuste compatível.

**Regressão necessária:** com conta sintética de leitura de Associados/arquivos sem revisão,
verificar lista/status/download e a rota genérica; o comprovante não deve ser descoberto/baixado.
Revisor dedicado deve continuar baixando somente anexos da ocorrência, sem receber o acervo geral.
Cobrir também o arquivo enviado ainda não protocolado. O teste existente
`scheduling-absence.test.ts:458–509` só exercita os serviços dedicados; não fecha esta alternativa.

## S02 — autorização pode vencer durante espera pelo lock do comprovante

**Classificação:** defeito temporal de autorização, prioridade média; cenário dedutível da ordem das
consultas, ainda sem reprodução PostgreSQL nesta revisão.

**Cenário:** revisor com sessão perto de expirar inicia GET do comprovante. Passa pela verificação
de sessão e permissões e pelo lock de elegibilidade. Outra transação mantém lock de atualização na
linha de `stored_file`. A leitura `FOR SHARE OF f` aguarda; a sessão expira pelo relógio enquanto
espera. Ao liberar a linha, o código emite um novo grant de cinco minutos sem verificar novamente a
sessão. Também há janela para expiração de concessão temporária antes da emissão.

**Evidência:** `apps/web/modules/scheduling/access.ts:47–60` revalida corretamente após o advisory
lock5010/1, mas antes do callback. `absence-evidence-service.ts:60–75` adquire outro lock na linha
do arquivo em69 e chama `storage.createPrivateDownload` em74, sem reautorização intermediária.
`files/object-storage.ts:59–61` apenas assina a URL; `files/content-grant.ts:4–19` inicia novo TTL.
O lock inicial de sessão não impede sua expiração natural pelo relógio.

**Impacto:** emissão de acesso privado depois de expirar a autoridade durante uma espera real,
apesar da garantia de revalidação após espera por lock do contrato admin.md:31–33 e plan.md:37–39.
Não se afirma que qualquer requisição normal passe sem autorização ou que a revogação inicial falhe.

**Correção mínima:** revalidar sessão com `clock_timestamp()` e permissões efetivas, na mesma
transação, após obter o lock do arquivo e antes de assinar a URL. Reutilizar um helper de checagem,
sem chamar recursivamente `schedulingAccess` em outra transação. Conferir o ponto equivalente de
submissão em `absence-service.ts:219–229`, que também espera arquivos depois da checagem inicial;
não usar um instante anterior ao lock como prova de autoridade atual.

**Regressão necessária:** duas conexões reais; uma retém a linha de arquivo, outra aguarda o
download; sessão expira naturalmente antes da liberação; esperar401 e zero grants. Repetir com
concessão temporária expirada e esperar403. Testar que arquivo/sessão válidos continuam funcionando.
`access.test.ts:82–91` prova apenas a checagem após o advisory lock com mock; o teste PostgreSQL
`scheduling.test.ts:435–486` prova revogação de escrita nesse advisory lock, não esta segunda
espera.

## Controles conferidos e limites

| Fronteira                 | Resultado por leitura e evidência existente                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Consulta e escrita        | `access.ts:34–59` consulta sessão/usuário ativos e permissões persistidas antes/depois de5010/1. Escrita exige read+write; write sozinho falha. `scheduling.test.ts:393–486` cobre matriz, leitura sem disputar lock e revogação da escrita enquanto espera.                                                                                                                                                                                                                    |
| Revisão dedicada          | `access.ts:29–31,43–58` exige read+review_absences. `absence-service.ts:251–270` permite decidir sem write. `access.test.ts:104–151` inclui negação de outras escritas ao revisor; `scheduling-absence.test.ts:425–450` comprova decisão e replay negado após revogação.                                                                                                                                                                                                        |
| Permissões adicionais     | Review não concede write, members:read/write, files:read/create, exports:generate nem acesso geral aos documentos. Rejeitar cancela reservas abrangidas **por regra explícita** de BF-D04, não é uma escalada a corrigir. Administrador continua herdando o catálogo pela autoridade existente; Gestor não recebe a nova revisão.                                                                                                                                               |
| Upload                    | `booking-absence.tsx:151–157` e `file-service.ts:90–107,222–265` conservam permissões próprias de upload/Associados. Conceder scheduling:write/review não as acrescenta. Submissão verifica membro, autor do upload, privado, disponível e scan limpo em `absence-service.ts:219–226`. S01 trata a outra direção do acesso.                                                                                                                                                     |
| Interface                 | Layout `/scheduling/layout.tsx:8–12` exige read; `workspace/areas.ts:40` e busca filtram descoberta. `ui/shared.tsx:180–199` protege Nova reserva; formulários e detalhe usam canWrite. `booking-absence.tsx:151–178,395–509` protege revisão/decisão e oculta após perda da permissão. O E2E de faltas:293–342 verifica revisor sem write e negação após reload; não prova todos os gatilhos de atualização ao vivo.                                                           |
| CSRF                      | `http/routes.ts:118–127` executa validação antes do domínio. `users/http/responses.ts:27–46` exige Origin confiável e cabeçalho customizado de pelo menos32 caracteres; `shared/mutation-origin.ts:5–27` compara com BETTER_AUTH_URL e recusa ausência/null. O cabeçalho não é segredo vinculado à sessão; a defesa depende também da origem estrita. Não identificado bypass de CSRF neste recorte. Casos de falta estão em `http/routes.test.ts:215–240`.                     |
| Idempotência e versão     | POST/PATCH exigem chave; `access.ts:79–104` associa replay a ator/operação/chave e hash do payload, dentro da autorização. Faltas validam expectedVersion em `absence-service.ts:175,214,254`; schemas estritos e erros cobertos em `http/routes.test.ts:255–296`. Decisões concorrentes e rollback têm prova em `scheduling-absence.test.ts:511–571`. Exceção PUT de horários descrita abaixo.                                                                                 |
| Privacidade das projeções | `absence-service.ts:80–113,321–390` retorna DTO explícito sem texto/arquivos. Auditoria/intenção usa projeção, sem explicação, nomes de arquivo ou URL, em118–154. `absence-evidence-service.ts:64–73` limita a emissão dedicada ao arquivo vinculado, membro correto e scan limpo. S01 impede concluir que esta seja a única via efetiva.                                                                                                                                      |
| Exportações               | `export-adapter.ts:173–185` exige scheduling:read; `exports/catalog.ts:43–79` acrescenta exports:generate/allowlists, sem write/review. `runtime.ts:21–65` relê autoridade atual em pool de controle; `export-authority.ts:7–20` confere sessão/usuário e permissões. `exports/service.ts:33–97` revalida antes, por lote, heartbeat10s e ao finalizar, abortando/falhando sem completed. Bytes já entregues não são recuperáveis; não prometer revogação instantânea por byte. |

## Lacunas de teste — não são novos defeitos comprovados

- **L01, ausência de prova integral do stream de Agendamentos sob revogação:**
  `scheduling-export.test.ts:232–269` abre cursor real, revoga read e chama o autorizador
  diretamente. O núcleo `exports/service.test.ts:60–80` prova interrupção/estado sem completed com
  autorização simulada. Falta, nessa suíte específica, ligar `runExport`+writer real+revogação
  persistida numa transferência com backpressure e assertar encerramento do cursor/estado. Código
  encadeia as proteções; ausência desse teste não prova vazamento. Cobrir também perda de
  exports:generate, expiração real da sessão e o dataset absences sem texto/arquivos.
- **L02, revisão dedicada durante espera no advisory lock:** teste de grants de review após lock em
  `access.test.ts:129–140` é simulado; a prova PostgreSQL citada usa scheduling:write. Completar com
  decisão/replay de revisor dedicado e expiração temporal real. A implementação reaproveita a mesma
  checagem; não atribuir falha funcional só pela cobertura. S02 é a espera posterior no arquivo.
- **L03, fronteiras alternativas do comprovante:** falta matriz cruzada reviewer-only versus
  members/files-only e consumo do grant depois de revogação. O E2E atual baixa bytes em
  `scheduling-absence.spec.ts:304–310`, mas após retirar a revisão testa `/review`, não reutiliza a
  URL emitida nem percorre Associados. É a cobertura pertinente a S01 e D01.

## Decisões e precisão contratual

**D01 — link já emitido é bearer por até300 segundos:** comportamento verificável, distinto de S02.
`content-grant.ts:4–19` assina key/method/expires, sem ator, sessão ou ocorrência.
`files/http/content-route.ts:65–77` só reautoriza sessão para audit_export/report_export; arquivo de
membro usa o grant válido sem exigir sessão. Portanto URL de comprovante obtida enquanto autorizado
pode ser reutilizada sem cookie ou após revogar review até expirar, se o arquivo continuar
disponível. Não dá acesso a outro arquivo nem permite forjar o token. O contrato administrativo
adota URL privada temporária e não define explicitamente revogação imediata de URLs já emitidas; não
confundir com o requisito de reautorização contínua das exportações ou com regras futuras de links
app/site. Confirmar/registrar a política antes de alegar revogação imediata dos comprovantes. Se a
expectativa for negar cada nova leitura depois da revogação, vincular grant ao ator/ocorrência e
revalidar no GET de conteúdo. Não conceder arquivos gerais ao revisor como solução.

**D02 — PUT de horários e texto geral sobre idempotência:** `http/routes.ts:118–120` dispensa chave
para PUT; `hours-service.ts:47–56,106` usa versão/transação sem schedulingReplay. O texto da
extensão admin.md generaliza que toda escrita exige Idempotency-Key, enquanto as operações novas de
faltas e workflow são POST e cumprem essa regra. Conciliar a descrição da exceção existente; retry
com a versão anterior retorna conflito, não duplica silenciosamente a escrita. Não é bypass de
acesso, nem motivo para reconstruir a base de horários nesta revisão.

Não reabrir critérios institucionais de mérito dos comprovantes: decisão humana já definida. Nenhuma
atribuição retroativa de cargo ou alteração de contas autorizada/executada.

## Repasse e continuidade

A responsável por Agendamentos deve avaliar S01/S02, implementar correções/testes na própria branch,
consolidar na spec008 e publicar nova evidência. L01–L03/D01–D02 permanecem separados dos defeitos.
Este relatório não modifica PR/metadados, testes, código, migrations ou caderno da worktree
revisada; apenas o arquivo solicitado e o bloco próprio do caderno principal foram escritos.

Entrega de Mostrar apenas funções autorizadas na navegação (CAAB-20) preservada na worktree
`pr-access-review-20261002`: HEAD local `0cf18c8038a5f3206563f189b257381101fd273f`, upstream
`f8049372b1defbde002301a25df97793776773b9`; sem mudanças nesta revisão.
[PR42](https://github.com/Komunick/caabnovo/pull/42) ainda aberto/sem merge na consulta atual. A
continuação autorizada de G01 aguarda essa integração humana: conciliar com origin/dev por trechos,
preservar DS/AC/roles.md, publicar a documentação local, validar e abrir o PR funcional, sem
duplicar a revisão AC já incorporada. Não integrar PRs.

Conferência final: fetch manteve dev/origin/dev em0/0 na base748539d; PR42 continuava aberto.
Agendamentos manteve HEAD b676974, mas a instância responsável acrescentou35 linhas em quatro
documentos da spec008 e criou sua evidência de fechamento durante esta leitura. Esses deltas
concorrentes foram preservados; o diff rastreado não contém mudança de código. As referências deste
relatório continuam fixadas no SHA revisado. A worktree de acessos segue limpa em0cf18c8, ahead1.
