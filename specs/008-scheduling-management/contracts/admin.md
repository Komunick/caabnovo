# Contratos — painel de Agendamentos

Base: /api/v1/scheduling. Autorização alvo de todas as rotas (Q8 de 21/09): sessão
administrativa ativa e acesso concedido a Agendamentos, revalidado no servidor.
Sessão sozinha não basta; ausência/revogação da concessão retorna 403. Q9 exige
consulta nas leituras e consulta+alteração nas mutações; alteração sem consulta
é recusada. Nomes técnicos/transição serão detalhados em AC01. Sem escopo por unidade, API anônima,
token Cal.com ou autenticação do app nesta fase. Implementação AC01–AC03 pendente.

Incremento de 18/09: GET `/calendar?start=YYYY-MM-DD&end=YYYY-MM-DD` retorna
`{items: SchedulingBooking[]}`. Start inclusivo/end exclusivo, dias em America/Bahia,
até 42 dias. Filtros opcionais: q, unitId, professionalId, status. Inclui reservas que
intersectam o intervalo (`ends_at > start`, `starts_at < end`), ordenadas por início/id.
Até 1.000 itens; acima disso 422/SCHEDULING_CALENDAR_LIMIT sem resposta parcial.
Intervalo inválido retorna 422; sessão inválida 401/403 como nas rotas existentes.
Resposta privada sem cache. Não altera `/bookings?date=...` nem seus consumidores.

| Interface | Operações | Campos/resultado |
| --- | --- | --- |
| /units, /services, /procedures, /professionals, /assignments | GET, POST; PATCH /:id | Catálogo mínimo paginado; versões para edição. |
| /units/:id/hours, /professionals/:id/hours | GET, PUT | Semana, unidade, almoço e version; validação de reservas afetadas. |
| /beneficiaries | GET q/page | Projeção mínima de associados/dependentes para seleção; sem CPF integral, documentos ou finanças. |
| /availability | GET assignmentId/date | Inícios/fins possíveis, timezone; leitura não retém vaga. |
| /bookings | GET date/unitId/professionalId/status/q/page; POST | Lista diária e criação. |
| /bookings/:id | GET | Detalhes e histórico paginado. |
| /bookings/:id/reschedule | POST | Nova habilitação, início e expectedVersion. |
| /bookings/:id/cancel | POST | expectedVersion; confirmação é apresentada na UI, sem motivo obrigatório. |

Criação: memberId, assignmentId, startsAt ISO com offset; fim/duração derivados no
servidor. POSTs de criação/remarcação/cancelamento usam Idempotency-Key. Não aceitar
id de ator, situação de bloqueio ou papéis enviados pelo cliente. Conferir Origin/CSRF
com o padrão do projeto em todas as mutações.

Respostas: 201 criação; 200 leitura/alteração/replay; 422 formato inválido; 401 sessão
ausente/inválida; 403 acesso administrativo negado; 404 registro inexistente;
409 conflito de horário, versão ou chave reutilizada; 422 combinação/horário/
beneficiário impedido; 413 corpo maior que 64 KiB. Envelope {code,message,fields?,requestId};
fields contém path/code. Sem stack SQL.
Listas: {items,page,pageSize,total}; 25 padrão e até 100. Intervalos fora da faixa
e data inválida são recusados; nenhuma consulta sem limite.

POST/PATCH de catálogo também exigem Idempotency-Key. PUT de horários exige
expectedVersion; retorna {version,rows}. Cada linha: weekday (0 domingo a 6 sábado),
start/end HH:mm e lunchStart/lunchEnd nulos ou HH:mm (somente profissionais).
Catálogos: id/name/active/version e referências correspondentes; procedimentos
incluem description/durationMinutes; unidades incluem address/phone opcionais.
Serviços, procedimentos e habilitações incluem os nomes das referências de catálogo,
para distinguir ofertas homônimas de unidades diferentes na listagem e na edição.
Detalhes: {booking,history:{items,page,pageSize,total}}. Histórico usa created,
rescheduled e cancelled, actorName, occurredAt e snapshots before/after.
Disponibilidade aceita excludeBookingId para remarcação; confirmar revalida a vaga.

Clarificação de 20/09/2026 (implementação pendente): criação/remarcação também
recusa com 409 a sobreposição de reservas scheduled do mesmo memberId, inclusive
entre profissionais/unidades. memberId é o beneficiário atendido, associado ou
dependente individual, nunca seu titular ou o operador. A mensagem deve identificar
conflito da pessoa, conservar os campos e permitir escolher outro horário.
Preservar o contrato de conflito profissional e o rollback integral da remarcação.

Remarcação preserva id e usa rollback integral no conflito; cancelamento repetido
retorna estado já cancelado sem duplicar efeito. Chave igual com payload diferente
é 409. Erros de edição mantêm valores do formulário. Alterações de catálogo
invalidam leituras relevantes após sucesso, não criam confirmação otimista falsa.

Contrato visual: /scheduling abre lista por dia, data de hoje, filtros persistidos
na URL, Novo agendamento e links Oferta/Horários. Formulário: beneficiário → unidade
→ serviço → procedimento → profissional → vaga; campos dependentes são limpos quando
a seleção anterior muda. Sem vagas, explicar e permitir trocar dia/profissional.
Detalhes oferecem Remarcar/Cancelar apenas para reservas futuras agendadas. Histórico
mostra datas/autores e ações humanas. Não exibir atalhos inoperantes para avaliações/app.


Endpoints existentes em contracts/admin.md passam a exigir read nas consultas e read+write nas mutações. Disponibilidade recebe beneficiaryId opcional para refinar vagas; criar/remarcar sempre exige identidade real. Projeções de reservas/lista/calendário/detalhe acrescentam eligibilityWarning: blocked|null. Export datasets scheduling.bookings/catalog/hours; padrão reserva/data/beneficiário mínimo/profissional/unidade/situação/aviso; filtros data/beneficiário/profissional/unidade/estado, texto e sort permitidos. Sem alteração do contrato público de app/site.
