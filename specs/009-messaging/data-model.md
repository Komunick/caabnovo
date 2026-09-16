# Dados

- messaging_resource: campanha/modelo/público com JSON validado, versão, arquivo lógico e datas.
- messaging_suppression: um bloqueio geral por associado, motivo e versão; desbloqueio não concede consentimento.
- messaging_execution: snapshot imutável, solicitante, programação, estado, motivo e contagens; nunca enviado nesta fase.
- messaging_request: idempotência por ator/chave, hash do payload e resultado; protegida por lock transacional.

Seleção considera apenas member não arquivado. Excluir identificadores duplicados, bloqueios gerais e filtros; contagens reavaliadas na execução. Evidência histórica guarda contagens, sem exportar lista de contatos. A futura entrega por destinatário exige migration própria e contrato por canal.

0022 reforça o histórico no banco: uma execução programada só pode terminar bloqueada ou cancelada. Execuções concluídas não podem ser alteradas nem reprogramadas; snapshots também são protegidos por privilégios de coluna.

Migration 0023: member.category/gender/city/residence_state opcionais e vazios nos registros atuais; índices demográficos, categoria/cidade e agenda. Gênero nunca inferido. member.administrative_status já existente alimenta Ativa/Inativa/Bloqueada. Vínculo dependente usa EXISTS vigente, sem multiplicar pessoas com mais de um titular. Idade completa calculada na data de Bahia, extremos inclusivos; NULL não atende faixa específica. Categoria e cidade com correspondência integral sem distinção de maiúsculas. Reagendamento conserva execução antiga cancelada (RESCHEDULED) e insere substituta, sem alterar snapshots.
