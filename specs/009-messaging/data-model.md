# Dados

- messaging_resource: campanha/modelo/público com JSON validado, versão, arquivo lógico e datas.
- messaging_suppression: um bloqueio geral por associado, motivo e versão; desbloqueio não concede consentimento.
- messaging_execution: snapshot imutável, solicitante, programação, estado, motivo e contagens; nunca enviado nesta fase.
- messaging_request: idempotência por ator/chave, hash do payload e resultado; protegida por lock transacional.

Seleção considera apenas member não arquivado. Excluir identificadores duplicados, bloqueios gerais e filtros; contagens reavaliadas na execução. Evidência histórica guarda contagens, sem exportar lista de contatos. A futura entrega por destinatário exige migration própria e contrato por canal.

0022 reforça o histórico no banco: uma execução programada só pode terminar bloqueada ou cancelada. Execuções concluídas não podem ser alteradas nem reprogramadas; snapshots também são protegidos por privilégios de coluna.
