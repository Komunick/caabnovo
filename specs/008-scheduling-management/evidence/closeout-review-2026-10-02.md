# Revisão de fechamento administrativo — 02/10/2026

Autoria: CODEX; solicitante Gabriel-Komunick, login obtido por `gh api user` autenticado nesta
retomada (campo name vazio). Não reatribui os registros históricos das outras sessões.

## Versão e escopo

Revisão de Agendamentos (CAAB-37) na worktree pr-scheduling-research-20260923, branch
feature/scheduling-administrative-20261002, SHA b676974a3514f87fcdfbdc943d74e9a013e5dbac. PR43
aberto; PR42 aberto na conferência inicial. Nenhuma edição de aplicação/testes no início da revisão;
a consolidação posterior corrige S01/S02 conforme descrito abaixo. Migrations e workflows
preservados. Preservados2733e01, 4e9abac e o filtro de cancelamentos sem horário de e7cd281.

Fontes: AGENTS principal, caderno principal, spec008/spec, plan, tasks, contratos admin/channels/
exports, checkpoint e evidência de publicação. As decisões BF-FR/BF-D e2C-FR vigentes prevalecem
sobre esclarecimentos históricos superados. Por exemplo, 2C-FR-10 limita a retirada da proposta ao
início original ainda futuro; a retomada após recusa segue a exceção própria de2C-FR-18.

## Revisão própria de negócio

| Caminho                   | Decisão e implementação conferidas                                                                                                                                                                                                                                                | Evidência automatizada existente                                                                         |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Sobreposição              | requireSlot recusa conflito pessoal;0032 mantém exclusões de profissional e beneficiário para scheduled/pending_approval, intervalos [início,fim). Capacidade conta ocupantes simultâneos e usa lock5010/1.                                                                       | scheduling.test.ts:202,265; scheduling-workflow.test.ts:728,813.                                         |
| Bloqueio cadastral        | requireSchedulingBeneficiary consulta cadeia vigente de titulares; bookingSelect projeta aviso sem mudar estado ou ocupação. Escritas e mudanças de vínculos compartilham5010/1.                                                                                                  | scheduling.test.ts:133,990,1022,1093,1129.                                                               |
| Aprovação                 | Exige destino futuro, versão e elegibilidade atuais; revalida bloqueio sobre intervalo retido. Não reconstrói duração pela configuração atual. Incrementa uma utilização somente se reservada.                                                                                    | scheduling-workflow.test.ts:108,129,558,763.                                                             |
| Remarcação voluntária     | Duas confirmações máximas; contador legado desconhecido não é inventado. Origem liberada, somente destino ocupado; recusa mantém mesmo ID/ciclo e utilização reservada. Retirada antes da origem não exige24h.                                                                    | policy.test.ts; scheduling-workflow.test.ts:334,763; jornada scheduling-workflow.spec.ts.                |
| Retomada e recuperação    | resume dispensa antecedência da origem e mínimo de nova reserva, preservando destino futuro/horizonte/elegibilidade. Recovery não reserva nem incrementa contador; indisponibilidade bloqueia recurso e libera origem.                                                            | policy.test.ts; scheduling-workflow.test.ts:831; jornada administrativa no navegador.                    |
| Registro de falta         | Somente scheduled após término previsto; registro explícito, única ocorrência por reserva. Relógio do banco inicia168/720h; nova reserva e recebimento de transferência são impedidos individualmente.                                                                            | scheduling-absence.test.ts:172,205,280,573,604.                                                          |
| Justificativa/contestação | Janela [registro,registro+7dias); texto e arquivo próprio/privado/disponível/limpo obrigatórios. Pedido preserva reservas e não suspende restrição a novas. Nenhum julgamento automático de mérito.                                                                               | absence-policy.test.ts; scheduling-absence.test.ts:215,246,272,302.                                      |
| Decisão e cancelamento    | Aceitação abona só a ocorrência; rejeição antes de30dias cancela somente scheduled/pending_approval com início estritamente futuro dentro do período. Sem horário/passado/fora do período excluídos pelo predicado. Eventos, causalidade, auditoria e intenções persistem juntos. | scheduling-absence.test.ts:333,364,396,511,537.                                                          |
| Expiração                 | Exato dia30 libera a restrição independentemente do worker e da análise; outra ocorrência/bloqueio continua vigente. Decisão tardia altera histórico. Worker revalida sob5010/1, não inventa usuário e não duplica finalização.                                                   | absence-policy.test.ts; scheduling-absence.test.ts:346,628,693,736,777.                                  |
| Permissões e comprovantes | read/write separadas; análise usa read+review_absences sem write. Sessão/concessões revalidadas após espera; texto/comprovantes somente nas rotas de revisão, arquivo vinculado à ocorrência. CSRF/idempotência/schema/versão nos comandos.                                       | access.test.ts, http/routes.test.ts; scheduling.test.ts:410,435,920; scheduling-absence.test.ts:425,458. |
| Exportações e Relatórios  | Registry mantém usersExport/reportExports/schedulingExports. Reservas usam procedimento direto e LEFT JOIN do profissional; NULL não fabrica horário. Aviso de cancelamentos usa coalesce(starts_at,original_start,created_at).                                                   | scheduling-workflow.test.ts:632 e regressão do aviso; scheduling-export.test.ts; publicação técnica.     |

Nenhum defeito de negócio comprovado nesta revisão própria, antes dos pareceres externos. Não
acrescentar código ou testes que apenas reproduzam as condições já implementadas. A tabela
identifica evidências existentes e leitura estática; não representa nova execução nem cobertura de
todas as combinações possíveis.

Limites da prova dirigida: policy.test.ts verifica retomada/recuperação com origem passada, mas a
suíte de integração examinada não possui caso dedicado para cada combinação de aprovação após a
origem, recuperação com contador2/NULL e cancelamento por falta de reserva sem horário. Não declarar
essas combinações individualmente executadas só por inferência do código. Conferi as condições e
constraints pertinentes; cenários sensíveis permanecem candidatos à homologação humana em DEV.

## Gates preservados

Checks de b676974 reconfirmados no PR43: quality/browser/security aprovados nos runs37037047877
e 37036927947. A evidência de publicação distingue a execução técnica cac5cbb, suas72capturas e
18imagens revisadas, do commit documental posterior. Testes anteriores de4e9abac/107 sem serviços
não são usados como prova de PostgreSQL. T107/T039 permanecem concluídos tecnicamente.

Nenhuma suíte de aplicação repetida nesta revisão sem mudança ou achado. Nenhuma nova validação
SQL/concorrência/navegador reivindicada. QA humano e ambiente/aceite de regras sensíveis continuam
pendentes; não há merge, deploy, serviços locais, WSL ou operação em banco de uso.

## Pareceres externos e conciliação

Pareceres recebidos e consolidados abaixo, preservando os arquivos da principal em
.cache/coordination/scheduling-closeout-20261002: rollout-documentacao.md, acessos-seguranca.md e
relatorios-compatibilidade.md. Ausência de arquivo não é aprovação. Autoria, SHA e achados de cada
parecer registrados na consolidação, distinguindo defeitos do PR43 de riscos da combinação futura.

PR42 ainda aberto: não conciliar dev prematuramente. Após integração, fetch e conferência de PR43
ainda aberto, conciliar na mesma branch sem reescrever histórico; preservar HIN, contratos,
migrations 0031–0034 e scheduling:review_absences. A futura conciliação de Relatórios deve preservar
os três grupos de adaptadores e a projeção bookings nos cinco arquivos já identificados; não copiar
toda a implementação de Relatórios para esta entrega.

E-mails continuam adiados: Entregar os avisos operacionais de Agendamentos por e-mail (CAAB-42) e
Homologar os avisos operacionais após disponibilizar o serviço de e-mail (CAAB-45) dependem de
Serviço de e-mail transacional e definição da caixa de entrada (CAAB-2). App/site, WAHA eT097 fora
desta rodada. Estas dependências não impedem o recorte administrativo independente.

## Consolidação dos três pareceres

Os três pareceres foram recebidos e preservados integralmente, com autoria original e hashes no
[manifesto](closeout-2026-10-02/manifest.json). Todos examinam b676974; não presumir que validam
automaticamente a correção posterior.

| Parecer                                                             | Conclusão e resposta da dona da entrega                                                                                                                                                                                                                                                                                                                                                                                                                   |
| ------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Rollout/documentação](closeout-2026-10-02/rollout-documentacao.md) | R01–R06: sem defeito bloqueante observado nas migrations; preflight no destino, backup/restore, janela/executor único, ledger por arquivo e coordenação app/worker são gates operacionais ainda não executados. Se merge dispara rollout sem pausa, precisam ser resolvidos antes. R07: checkpoint acrescentado ao modelo/canais e estados documentais atualizados. R08: preservar HIN/DS/AC/roles por trechos após PR42, sem substituir fontes inteiras. |
| [Acessos/segurança](closeout-2026-10-02/acessos-seguranca.md)       | S01/S02 confirmados por inspeção e corrigidos localmente, com cinco regressões reais preparadas. L01/L02 continuam lacunas de prova dirigida, sem classificar como defeitos. L03 é coberta pela nova matriz de arquivos na integração, ainda aguardando execução. D01: TTL bearer existente documentado sem prometer revogação imediata; D02: exceção versionada do PUT corrigida no texto administrativo.                                                |
| [Relatórios](closeout-2026-10-02/relatorios-compatibilidade.md)     | Nenhuma regressão bloqueante do PR43; riscos dos cinco arquivos pertencem à combinação futura na branch de Relatórios/c8a2614. Contrato exports atualizado para refletir CI/T039/T107 e regressão temporal executada. T041/T042 continuam com Relatórios, sem copiar gerador/migrations.                                                                                                                                                                  |

### S01 — isolamento de finalidade e caminhos alternativos

Upload usa owner_type textual scheduling_absence_evidence desde a intenção, sem nova migration.
Permissões próprias de membros/arquivos continuam exigidas, acrescidas de read/write de
Agendamentos. Lista/download genéricos excluem essa finalidade; status restrito só ao próprio
operador com permissões atuais. Membro/files-only não obtém comprovante. Arquivos antigos member
vinculados à ocorrência são filtrados no acervo/status/download geral; revisão aceita ambos os tipos
sob vínculo restrito. Documentos comuns não vinculados conservam acesso. Scanner/armazenamento e
cargos não reconstruídos. Dados antigos sem protocolo/finalidade não são inferidos ou
reclassificados.

### S02 — autoridade e prazo depois da espera

requireSchedulingAuthority reutiliza as checagens de sessão ativa pelo clock_timestamp e concessões
persistidas. Download revalida depois do FOR SHARE do arquivo, antes de assinar. Submissão revalida
autoridade e captura um novo relógio após a espera; também recusa janela de sete dias que terminou
enquanto o arquivo estava retido. A finalização de upload restrito revalida depois do lock do
arquivo. Não há transação recursiva ou mock para declarar concorrência validada.

### Regressões e resultados locais

Cinco casos adicionados à suíte PostgreSQL real scheduling-absence.test.ts: matriz de arquivos
restritos antes/depois do protocolo e legados/documentos comuns; download após expiração natural da
sessão; download após expiração de concessão temporária; submissão após expiração da sessão; janela
de sete dias fechada durante espera. Duas conexões, lock real observado em pg_stat_activity e
relógio do banco; assertar zero grants/efeitos indevidos. Ainda **não executados** nesta etapa, pois
serviços locais continuam proibidos. A jornada E2E exige a finalidade restrita no arquivo realmente
enviado pelo formulário.

Localmente passaram73 unitários de access/http scheduling e23 de arquivos/HTTP membros, tipos web e
lint dos oito arquivos inicialmente alterados. Não são prova de SQL/PostgreSQL. O CI existente
executará as novas regressões na branch autorizada. Suítes antigas não foram repetidas antes do
achado; esta mudança justifica nova execução automática completa. Checkpoint será atualizado pelos
SHAs/runs próprios da correção.

Os gates de b676974 continuam evidência histórica válida dessa versão; não cobrem as novas proteções
de upload/status/download/submissão e seus caminhos de autorização. As18 imagens anteriores não
validam o upload funcional alterado; layout não foi redesenhado, mas a jornada e capturas de faltas
precisam ser verificadas na nova execução. T107/T039 não são apagados ou retroativamente reabertos;
T110 controla esta consolidação/correção e CI posterior. Separar consulta e alteração em
Agendamentos (CAAB-28) e Tratar faltas, justificativas e contestações (CAAB-41) retornaram a Em
Desenvolvimento com comentários acrescidos ao Jira, preservando histórico e QA humano pendente.
