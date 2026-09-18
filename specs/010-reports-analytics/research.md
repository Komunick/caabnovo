# Pesquisa — 18/09/2026

## Coleta própria

Não existe provedor/histórico atual. Usar a infraestrutura do monólito evita conta
paga e transmissão a terceiro. Matomo/PostHog são alternativas avaliadas, sem
instalação de outro serviço. Backend externo autenticado integra sites/app.

- [GA4 sessão](https://support.google.com/analytics/answer/12798876?hl=en):
  30 minutos de inatividade; sessão de uso não equivale a login.
- [Matomo SPA](https://developer.matomo.org/guides/spa-tracking): mudanças de tela
  precisam de eventos mesmo sem reload.
- [Matomo visitantes](https://matomo.org/faq/general/faq_43/): identificação tem
  limites por dispositivo; não somar únicos como pessoas entre canais.
- [PostHog](https://posthog.com/docs/product-analytics): jornadas e retorno.
- [Plausible](https://plausible.io/data-policy): referência de minimização,
  sem reproduzir identificação por IP ou presumir conformidade jurídica.
- [Firebase](https://firebase.google.com/docs/analytics): app exige instrumentação.
- [MDN](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/sendBeacon):
  envio assíncrono pequeno; fetch keepalive quando houver cabeçalhos.

## Exportação

- [write-excel-file](https://github.com/catamphetamine/write-excel-file): XLSX
  tipado e árvore pequena; ExcelJS avaliado, mas desnecessário neste recorte.
- [PDFKit](https://pdfkit.org/docs/getting_started.html): PDF sem Chromium,
  texto paginado e gráficos vetoriais.
- [OWASP CSV Injection](https://community.owasp.org/attacks/CSV_Injection):
  escapar campos e neutralizar fórmulas; XLSX com texto explicitamente tipado.

Reutilizar pg-boss/job_execution/stored_file_content. Bloquear download genérico
para report_export; endpoint próprio revalida conta, proprietário e permissões.
Sem truncamento silencioso; limite de geração explícito. Métricas sem CPF, email,
IP bruto, replay, URLs pessoais ou histórico inventado. Estado atual não reconstrói
passado; reservas não são atendimentos e uso administrativo não mede produtividade.
