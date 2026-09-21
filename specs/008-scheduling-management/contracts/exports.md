# Contrato do incremento — Agendamentos: acesso, integridade por pessoa e exportação

Estado: planejado em 21/09/2026, sem implementação.

Endpoints existentes em contracts/admin.md passam a exigir read nas consultas e read+write nas mutações. Disponibilidade recebe beneficiaryId opcional para refinar vagas; criar/remarcar sempre exige identidade real. Projeções de reservas/lista/calendário/detalhe acrescentam eligibilityWarning: blocked|null. Export datasets scheduling.bookings/catalog/hours; padrão reserva/data/beneficiário mínimo/profissional/unidade/situação/aviso; filtros data/beneficiário/profissional/unidade/estado, texto e sort permitidos. Sem alteração do contrato público de app/site.

scheduling_booking conserva scheduled/cancelled, member_id individual e intervalo UTC [). Nova exclusão por pessoa é independente de professional_id e unit_id. eligibilityWarning derivado não vira coluna de status; sem trigger de cancelamento. Dados de titular no aviso são mínimos, sem revelar documentos/finanças. Campo opcional beneficiaryId da consulta de disponibilidade é validado e reautorizado; nenhuma listagem pública. Reserva cancelada não ocupa; intervalos adjacentes são válidos.

Aplicar [contrato transversal](../../002-integrated-modules/contracts/direct-exports.md)
onde houver exportação: filtros, columns ordenadas, formato xlsx/csv/pdf, download nativo,
erros, estado operacional e reautorização. O contrato descreve novos caminhos planejados,
não garante que existam no checkout. Gate de Mensagens permanece quando aplicável.

Aceite independente: Duas reservas concorrentes da mesma pessoa em profissionais/unidades distintos: uma aceita; titular/dependentes distintos podem coincidir. Bloqueio mantém reserva/vaga e mostra aviso. Sem read some/nega; só read não altera. Exportação não herda teto visual.
