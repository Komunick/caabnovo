# Mensagens — contrato vigente

Em 16/09/2026, o usuário autorizou a preparação completa e adiou os meios de envio.
A implementação própria está em [009-messaging](../../009-messaging/spec.md), com [contrato HTTP](../../009-messaging/contracts.md).

Permissão única `messages:access`: consultar, preparar e solicitar envio. Campanhas, modelos, públicos, prévia, bloqueios gerais, programação cancelável e histórico. Solicitações sem canal resultam em bloqueio explícito, sem entrega fictícia. Nenhuma tentativa antiga será liberada automaticamente ao configurar um meio.

T036–T039 permanecem parciais na parte específica de canais, consentimento/finalidade, provedores, entrega por destinatário e callbacks. Não registrar essa parte como concluída.
