# Gerenciamento de horários: legado e sugestões

Data: 15/09/2026. Inspeção somente leitura; nenhum código reaproveitado ou executado.
Pedido do usuário: detalhar horários e deixar funções ausentes do site antigo como
sugestões, citando controle de salas. Nenhuma implementação autorizada nesta etapa.

## 1. O que foi encontrado

| Função | Configuração/comportamento encontrado | Evidência |
| --- | --- | --- |
| Funcionamento da unidade | Dias da semana, abertura/fechamento e dia fechado. | Modelo Unidade e formulário de unidade com CampoDeHorarioSemanal. |
| Expediente profissional | Horário por dia da semana, independente do cadastro da unidade. | Modelo Profissional e aba Expediente do formulário. |
| Almoço | Início e fim do intervalo profissional. | Formulário, modelo e cálculo de disponibilidade. |
| Indisponibilidades | Datas inicial/final, hora inicial/final e vínculo com profissionais. | Modelo UnavailabilitySchedule, ListaDeIndisponibilidades e controlador. |
| Agenda extra | Data e faixa de horário extraordinário, associadas a profissionais. | ExtraHour, ExtraHourController e ListaDeAgendaExtra. |
| Antecedência mínima | Tempo mínimo em minutos para reservar com o profissional. | Campo antecedency e rotinas de cálculo/validação da API. Não confirmado campo equivalente no formulário inspecionado. |
| Janela de dias futuros | Quantos dias à frente o profissional aceita reservas. | Campo future e validateProfessionalFutureDays na API. Não confirmado campo equivalente no formulário inspecionado. |
| Duração do procedimento | Participa da geração dos horários e validação do período reservado. | Procedimento.duracao, availableHour e validateTimePeriod. |
| Ocupação e bloqueios | Cálculo consulta reservas, almoço e indisponibilidades antes de apresentar vagas. | ScheduleController.availableHour e schedule-service. |

Exemplos de uso, sem parâmetros padrão aprovados: bloquear uma tarde de ausência;
registrar um período de férias; abrir excepcionalmente um sábado; reservar com
antecedência; limitar a abertura da agenda às próximas semanas. Não comprovado
calendário automático de feriados; feriados podem ser tema de bloqueio manual.

## 2. Onde os horários entram na operação

1. A CAAB configura abertura/fechamento da unidade por dia da semana.
2. Configura expediente e almoço dos profissionais.
3. Registra indisponibilidades e períodos extraordinários de atendimento.
4. Define duração dos procedimentos e condições temporais de reserva.
5. O app/site consulta horários; o servidor considera a configuração e ocupação.
6. A reserva precisa ser revalidada ao confirmar, pois a consulta anterior não garante vaga.

Os cinco primeiros itens organizam os conceitos encontrados; o sexto é uma
necessidade de integridade a detalhar no projeto novo, não garantia de que todos
os caminhos antigos já a implementam corretamente.

## 3. Limites e diferenças que não devem ser copiadas automaticamente

- Foram inspecionados arquivos locais de API e painel anterior. Não foi comprovado
  qual revisão está no site publicado nem testada uma reserva real.
- availableHour calcula a partir do profissional, procedimento, almoço, bloqueios,
  agenda extra e ocupação. Não consulta o horário da unidade nesse método.
- validateUnityWorkingHours existe no serviço, mas não é chamada em
  runScheduleValidationsForAPP inspecionada. Logo, a existência do cadastro da unidade
  não comprova que seu funcionamento limite todas as reservas antigas.
- A geração de horários extras ocorre separadamente, sem aplicar almoço nesse trecho;
  outra validação aplica almoço. Revisar a consistência antes de transportar a regra.
- A consulta de vagas considera reservas await/confirmed sem exception; outras rotinas
  usam critérios diferentes. Não prometer proteção uniforme contra conflitos no legado.
- O cadastro possui o tipo profissional/recurso; isso não comprova controle separado
  de sala, equipamentos e pessoa na mesma reserva. Controle de salas permanece sugestão.
- Dias/horas, motivos obrigatórios antigos e restrições não são aprovados automaticamente.
  A decisão vigente de não exigir motivos e as definições do usuário prevalecem.

## 4. Sugestões adicionais, fora do escopo confirmado

Manter separadas até decisão explícita, mesmo quando a pesquisa de mercado as recomenda:

- Controle específico de salas, macas e equipamentos junto do profissional.
- Tempo de preparação/limpeza antes ou depois do procedimento, separado da duração.
- Distribuição automática entre profissionais disponíveis.
- Calendário automático de feriados.
- Prévia explicando por que cada horário aparece disponível ou indisponível.
- Alerta de reservas afetadas ao mudar expediente, com tratamento guiado.

Esta lista não afirma ausência absoluta em todas as versões antigas: exceto o controle
de salas indicado pelo usuário, são funções ainda não comprovadas na inspeção feita.
Permanecem sugestões ou pendentes de verificação. Regras de cancelamento/falta também
exigem decisão; comportamento antigo não significa autorização para copiar penalidades.

## 5. Organização da interface para discussão

Dar destaque explícito a **Horários**, reunindo funcionamento da unidade, expediente,
almoço, indisponibilidades, agenda extra e condições de abertura da agenda. Manter
acesso a essas configurações também pelo contexto da unidade/profissional pode ajudar.
A estrutura de abas/menu é sugestão de apresentação; não está implementada ou aprovada.

## 6. Fontes locais verificadas

API anterior: `C:/Projetos/caab-caapp/mono-caapp-main/packages/api/src/`:

- `models/Unidade.js`, `models/Profissional.js`, `models/Procedimento.js`.
- `models/UnavailabilitySchedule.js`, `models/ExtraHour.js` e vínculos profissionais.
- `controllers/ScheduleController.js`, método availableHour.
- `controllers/ExtraHourController.js`.
- `services/schedule-service.js`, validações temporais e runScheduleValidationsForAPP.

Painel anterior: `C:/Projetos/caab-caapp/apps/painel-admin/src/features/agendamentos/`:

- `CampoDeHorarioSemanal.tsx`.
- `FormularioDeUnidade.tsx`, `FormularioDeProfissional.tsx`.
- `ListaDeIndisponibilidades.tsx`, `ListaDeAgendaExtra.tsx`.

Não houve consulta a dados pessoais, segredos, banco, aplicativo instalado ou site em produção.
