# Contrato HTTP

Base `/api/v1/messages`. Toda rota exige sessão ativa e `messages:access` no banco.

- GET/POST `campaigns|templates|audiences`; GET/PUT `resource/:id`.
- POST `resource/:id/command`: archive, restore, duplicate (campanha), send, schedule, cancel; expectedVersion obrigatório.
- GET `campaigns/:id/history`; POST `preview`: público e conteúdo ainda não salvos.
- GET `recipients`: busca mínima paginada (id/nome/bloqueio, sem CPF/contatos).
- GET `preferences`; PUT `preferences/:memberId`: bloqueio geral versionado com motivo.

Mutações requerem origem confiável, token CSRF e Idempotency-Key. Respostas privadas no-store. Conflito de versão/estado/chave = 409; falta de acesso = 403; sessão inválida = 401; validação = 422. Nenhuma rota pública de disparo ou callback fictício.

GET schedules: q/status (scheduled|blocked|canceled|all)/from/to/page/pageSize; datas em Brasília e período inclusivo. Retorna resumo sem snapshot completo. POST command também aceita reschedule+scheduledAt; cancela execução anterior com RESCHEDULED e cria nova na mesma transação. GET categories/cities oferece sugestões paginadas. Audience acrescenta category/gender/relationship/city/residenceState/minAge/maxAge/administrativeStatus, com defaults retrocompatíveis. state continua UF da OAB. Sem teto de IDs; corpo de Mensagens limitado a 8 MiB, demais módulos continuam 64 KiB. Segmentos por filtros não serializam a base de destinatários.
