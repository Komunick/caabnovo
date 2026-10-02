# Contrato de exportação — Agendamentos (US4)

Reconciliado em 28/09/2026 contra dev 89d2356 e a evolução administrativa local 0032. O registry
apps/web/modules/exports/runtime.ts registra usersExport e os adapters scheduling, incluindo
scheduling.absences em T101. Autorização administrativa vigente e extensões de agenda estão em
[admin.md](admin.md).

## Escopo e acesso

0032: estados explícitos Agendado/Aguardando aprovação/Cancelado/Recusado/Aguardando nova data. JOIN
do procedimento direto e LEFT JOIN de profissional preservam capacidade e registros sem horário.
startsAt/endsAt permanecem nulos quando não há destino; não fabricar data nem rótulo Cancelado.
Horários incluem a fonte services, filtro serviceId e coluna padrão serviceName; faixas semanais por
serviço não representam profissionais fictícios. Cobertura e limites em
[validação do fluxo administrativo](../evidence/admin-workflow-2026-09-28.md).

Datasets: scheduling.bookings, scheduling.catalog, scheduling.hours e scheduling.absences. Aplicar
[contrato transversal](../../002-integrated-modules/contracts/direct-exports.md) e
[padrão de exportação](../../../docs/EXPORT-STANDARD.md). Exigir scheduling:read e exports:generate,
com reautorização antes e entre lotes; não exigir scheduling:write. Preservar leitura de
reports.bookings e Gestor. Servidor valida filtros, sort e allowlist de colunas; recusa campos/dados
sem autorização.

Reservas: data/período, beneficiário autorizado, profissional, unidade, situação e texto. Padrão:
reserva, data, beneficiário mínimo, profissional, unidade, situação e aviso autorizado.
Oferta/horários: filtros e colunas dos cadastros correspondentes, sem gerar atendimentos fictícios.
Catálogo conferido em T025 abaixo; dados de exclusão e aviso de bloqueio preservam distinções do
DTO, sem inferir documentos, finanças ou impedimentos de terceiros.

### Catálogo conferido em 28/09 — T025

Fontes: agenda.tsx/calendar.tsx e booking-service.ts; as cinco abas de catalog.tsx e
catalog-service.ts; hours.tsx/hours-service.ts. Cada linha exportada corresponde a um registro
dessas fontes. Campos em negrito são selecionados por padrão; todos admitem ordenação.

| Dataset  | Colunas permitidas                                                                                                                                                                | Filtros                                                                                                               |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| bookings | **id, startsAt, memberName, professionalName, unitName, status, eligibilityWarning**, endsAt, serviceName, procedureName, durationMinutes, memberDeleted, keptAfterMemberDeletion | q (nome), from/to (dias inclusivos Bahia), memberId, professionalId, unitId, status                                   |
| catalog  | **id, kind, name, active**, unitName, serviceName, procedureName, professionalName, durationMinutes, description, phone, address                                                  | kind (units/services/procedures/professionals/assignments), q, active, unitId, serviceId, procedureId, professionalId |
| hours    | **id, kind, unitName, serviceName, professionalName, weekday, start, end**, lunchStart, lunchEnd                                                                                  | kind (units/professionals/services), unitId, professionalId, serviceId                                                |

Catálogo usa projeção das cinco abas; campos não aplicáveis ficam nulos, sem fabricar valores.
active representa o estado do cadastro da linha. Address/phone são da unidade, nunca do associado.
Horários representam faixas semanais configuradas, sem produzir vagas; id estável é a composição
tipo/unidade/profissional/dia. Horário é texto HH:mm e weekday é inteiro 0–6 (domingo–sábado).
Filtros de IDs têm validação UUID; q usa busca literal escapada, igual às telas. Datas de reservas
usam America/Bahia e a ordenação padrão é startsAt/id; catálogo name/id; horários unitName,
professionalName,weekday/id. A ordem de colunas solicitada é preservada.

Proibidos: CPF, documentos, contatos do associado, finanças, tokens, snapshots livres e identidade
do titular que motivou bloqueio. memberName é o beneficiário mínimo já consultável na agenda.
eligibilityWarning informa somente Bloqueado (ou vazio); não reaproveita os campos de exclusão. As
ações de entrada conservam o contexto da tela; filtros e seleção continuam no rascunho da
exportação. Não exigir members:read ou scheduling:write.

## Metadados de faltas — T101

Dataset scheduling.absences implementado e validado localmente em T102
([evidência](../evidence/absence-ui-2026-09-28.md)). Formatos Excel/CSV/PDF usam o mesmo catálogo e
os mesmos writers existentes, sem exigir a permissão de análise de faltas. Exigir scheduling:read +
exports:generate e revalidar durante a leitura.

Colunas padrão: memberName, unitName, procedureName, recordedAt, status, appealDeadline,
restrictionEndsAt, restrictionActive. Colunas adicionais permitidas: id, serviceName, startsAt,
endsAt, appealKind, submittedAt, outcome, decidedAt, recordedByName, decidedByName. Não expor
explicação, comprovantes, nomes/IDs/URLs de arquivos, contatos, e-mails ou snapshots livres. A
permissão de exportar metadados não permite baixar documentos do pedido.

Filtros: q literal por nome (até 100 caracteres), status do processo, from/to por data do registro
(dias inclusivos America/Bahia), memberId e unitId. A seleção da lista conserva q/status ao abrir
exportação; a página visível não limita a saída. Ordenação padrão recordedAt DESC com desempate id
DESC; colunas/ordem solicitadas permanecem validadas pela allowlist.

Status usa os mesmos valores e rótulos da lista: awaiting_response, under_review, accepted,
rejected, unanswered. Under_review permanece após 30 dias sem decisão; restrictionActive informa se
aquela ocorrência ainda restringe novas reservas. Accepted aparece como Falta abonada, com
appealKind distinguindo justificativa e contestação. Nenhum metadado prova entrega de e-mail. Datas
ausentes continuam nulas. O incremento não altera as allowlists dos três datasets anteriores.

## Integração implementada localmente

T036 adicionou adapters ao registry ao lado de usersExport, preservando /users/exportar. Consultar
via SQL/cursor incremental do núcleo, com ordenação estável/desempate por ID, sem materializar toda
a listagem em memória. Não herdar 42 dias/1.000 itens do calendário, página de lista ou impor teto
funcional. Escritores xlsx/csv/pdf e erros seguem núcleo existente; não reconstruir sua
infraestrutura nem reexecutar migrations 0025/0026.

Exportar Agendamentos fica no cabeçalho do quadro, acima dos filtros, conforme guia CAAB; Nova
reserva permanece no cabeçalho da página. Tela guarda filtros, seleção/ordem das colunas e permite
repetir falha. Download direto, sem etapa obrigatória de fila/histórico ou prazo.

## Aceite independente da US4

Com massa sintética conhecida para cada dataset, operador com consulta+exportação geral e sem
escrita baixa Excel, CSV e PDF após filtrar e ordenar registros/colunas. Parsers independentes
comparam IDs, conjunto completo, valores e ordem; vazio mantém cabeçalhos e a página visível não
limita a saída. Intervalo maior que 42 dias é aceito. C1/100 é amostra de teste, não teto. Recusar
campo proibido, consulta sem geral, geral sem consulta e sessão/acesso revogados, inclusive entre
lotes; não apresentar transferência interrompida como concluída. Teste de concorrência de reservas
pertence à US1, não ao aceite desta exportação.

T038 usa scheduling-export.test.ts e scheduling-export.spec.ts próprios; preserva a jornada de
scheduling.spec.ts, a ação Nova reserva e a regressão /users/exportar do registry compartilhado.
Arquivos reais e navegador aprovados localmente em
[validação administrativa](../evidence/plan-2026-09-21-validation.md). CI/publicação de b676974
aprovados conforme [evidência](../evidence/publication-2026-10-02.md); T039/T107 concluídos
tecnicamente. A nova correção sensível de fechamento requer seus próprios checks. Integração em dev
e QA humano não são presumidos.

## Compatibilidade com Relatórios — 02/10/2026

Preservar os três grupos de adapters no registry. A data de referência de Relatórios é
coalesce(starts_at,original_start,created_at), inclusive para contar reservas canceladas sem horário
no aviso do resumo; não preencher startsAt/endsAt exportados pela agenda. A correção do aviso foi
executada em PostgreSQL descartável no CI da entrega b676974, incluindo regressão de cancelamento
sem horário/período/autorização. Essa prova não valida a combinação futura com o gerador de
Relatórios/c8a2614. O novo exportador de resumo/evolução da frente de Relatórios precisa aplicar a
mesma referência na conciliação.
[Comparação, hashes e instruções por arquivo](../evidence/reports-compatibility-2026-10-02.md).

Parecer de fechamento por leitura em b676974/c8a2614: nenhuma regressão bloqueante no PR43;
preservar registry, hooks do ExportScreen e a projeção bookings na futura combinação dos cinco
arquivos.
[Relatório independente preservado](../evidence/closeout-2026-10-02/relatorios-compatibilidade.md).
T041/T042 da spec010 e QA humano permanecem próprios da ponta de Relatórios conciliada.
