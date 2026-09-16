# Pesquisa — Mensagens

Consultada em 16/09/2026 antes da implementação, em documentação oficial.

- [Mailchimp: agendar ou pausar](https://mailchimp.com/help/schedule-or-pause-a-regular-email-campaign/): segmentos são recalculados no envio programado. Aplicação: guardar definição e reavaliar público/exclusões no horário; cancelar antes da execução.
- [Mailchimp: criar campanha](https://mailchimp.com/help/create-and-send-regular-email/?v=114): preparação separa destinatários, assunto e conteúdo. Aplicação: editor, prévia e confirmação com revisão explícita.
- [Twilio: estados](https://www.twilio.com/docs/messaging/api/message-resource) e [callbacks](https://www.twilio.com/docs/messaging/guides/outbound-message-status-in-status-callbacks): solicitado/aceito/enviado/entregue/lido são evidências distintas. Aplicação: estado bloqueado sem canal, sem contadores falsos de envio. Nenhum adapter Twilio nesta etapa.
- [Customer.io: preferências](https://docs.customer.io/messaging/channels/subscriptions/center/) e [broadcasts](https://docs.customer.io/messaging/send/broadcasts/overview/): preferências e segmentação pertencem ao ciclo da comunicação. Aplicação: supressão geral independente do público; consentimento e tópicos específicos ficam para os canais futuros.

Decisão explícita do usuário: toda pessoa com acesso ao módulo pode preparar/enviar. Não importar fluxos de aprovação dos fornecedores. Fontes orientam práticas; não representam escolha de fornecedor, preço ou política institucional.
