# Pesquisa vigente — 21/09/2026

**Decisão:** Substituir a jornada nova de exportação por filtros/colunas e download direto nas três abas, preservando métricas, consultas e arquivos antigos.

**Fundamento:** Três abas baixam Excel/CSV/PDF; >50 mil linhas e >366 dias integral, colunas em ordem exata, campos restritos rejeitados, valores longos completos, downloads legados protegidos; coleta US4 permanece sem afetar reserva.

**Alternativas:** rejeitar cópia de cadastro, concessão implícita, exportar pela página
visual, gerar Buffer integral e reintroduzir fila/limites funcionais. Quando a função
não implementa exportação nesta fase, preservar seus controles existentes.

**Evidência local:** `packages/contracts/src/reports.ts`, `packages/db/src/repositories/reports.ts`, `packages/db/src/repositories/report-storage.ts`.
Desenho concreto em [plan.md](plan.md). Fontes oficiais, data, limitações e alternativas
na [pesquisa transversal](../002-integrated-modules/research-2026-09-21.md).
Essa revisão não homologa dependências, desempenho ou produto; testes estão no quickstart.

## Pesquisa anterior — contexto histórico

Decisões de fluxo/armazenamento/exportação anteriores são substituídas pelo plan de 21/09
onde conflitarem; referências antigas não autorizam funções adiadas.

﻿# Pesquisa — 18/09/2026

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

## Revisão de confiabilidade — 18/09/2026

Documentação instalada do Next 16.3.4 (`next/dist/docs/01-app/03-api-reference/04-functions/after.md`)
reconsultada: `after(callback)` executa logging/analytics após finalizar a resposta,
com suporte a Route Handlers. Adotado na confirmação de reservas; coletor continua
melhor esforço, sem garantir entrega se o processo morrer após a confirmação.
Inspeção de `job-runtime.ts`, `job-execution.ts` e configurações locais pg-boss:
uma execução inicial + quatro retries corresponde a attempt_limit=5. O estado
persistido failed descreve a tentativa; histórico deve considerar o contador antes
de apresentar falha definitiva. Sem alteração de política de retries nesta correção.
