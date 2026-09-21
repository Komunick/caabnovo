# Pesquisa vigente — 21/09/2026

**Decisão:** Avaliar o protótipo de campanhas/comunicados conforme a finalidade confirmada e planejar exportações sem iniciar canais reais.

**Fundamento:** Após M016, conferir preparo/segmentação/programação sem envio real; exports respeitam a projeção mínima e formatos/colunas; nenhum botão/tela de chat ou ticket; alterações no protótipo dependem do gate registrado.

**Alternativas:** rejeitar cópia de cadastro, concessão implícita, exportar pela página
visual, gerar Buffer integral e reintroduzir fila/limites funcionais. Quando a função
não implementa exportação nesta fase, preservar seus controles existentes.

**Evidência local:** `apps/web/modules/messaging/http/routes.ts`, `apps/web/modules/messaging/ui/list-page.tsx`, `apps/web/modules/messaging/ui/schedules.tsx`.
Desenho concreto em [plan.md](plan.md). Fontes oficiais, data, limitações e alternativas
na [pesquisa transversal](../002-integrated-modules/research-2026-09-21.md).
Essa revisão não homologa dependências, desempenho ou produto; testes estão no quickstart.

## Pesquisa anterior — contexto histórico

Decisões de fluxo/armazenamento/exportação anteriores são substituídas pelo plan de 21/09
onde conflitarem; referências antigas não autorizam funções adiadas.

# Pesquisa — Mensagens

Consultada em 16/09/2026 antes da implementação, em documentação oficial.

- [Mailchimp: agendar ou pausar](https://mailchimp.com/help/schedule-or-pause-a-regular-email-campaign/): segmentos são recalculados no envio programado. Aplicação: guardar definição e reavaliar público/exclusões no horário; cancelar antes da execução.
- [Mailchimp: criar campanha](https://mailchimp.com/help/create-and-send-regular-email/?v=114): preparação separa destinatários, assunto e conteúdo. Aplicação: editor, prévia e confirmação com revisão explícita.
- [Twilio: estados](https://www.twilio.com/docs/messaging/api/message-resource) e [callbacks](https://www.twilio.com/docs/messaging/guides/outbound-message-status-in-status-callbacks): solicitado/aceito/enviado/entregue/lido são evidências distintas. Aplicação: estado bloqueado sem canal, sem contadores falsos de envio. Nenhum adapter Twilio nesta etapa.
- [Customer.io: preferências](https://docs.customer.io/messaging/channels/subscriptions/center/) e [broadcasts](https://docs.customer.io/messaging/send/broadcasts/overview/): preferências e segmentação pertencem ao ciclo da comunicação. Aplicação: supressão geral independente do público; consentimento e tópicos específicos ficam para os canais futuros.

Decisão explícita do usuário: toda pessoa com acesso ao módulo pode preparar/enviar. Não importar fluxos de aprovação dos fornecedores. Fontes orientam práticas; não representam escolha de fornecedor, preço ou política institucional.

## Segmentação e escala — 16/09/2026

Pesquisa oficial: [Mailchimp](https://mailchimp.com/help/all-the-segmenting-options/)
organiza segmentos por dados de contato; [ActiveCampaign](https://help.activecampaign.com/hc/en-us/articles/115001324324-Create-and-save-segments)
reavalia condições na execução programada. [PostgreSQL](https://www.postgresql.org/docs/16/tutorial-agg.html)
permite contagens condicionais no servidor sem transferir a base ao navegador.
Decisão: regras combinadas por E, contagem integral sem limite de pessoas, prévia com amostra
limitada explicitamente, exclusões/supressões prevalecem, idade completa na data em Bahia.
Categoria, gênero, cidade e UF de residência precisam de campos próprios no cadastro atual:
não inferir gênero pelo nome nem residência pela OAB. Dados antigos ficam não informados.
Não há integração/migração automática com a base antiga nesta alteração.
