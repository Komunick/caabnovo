# Interfaces v1

/api/v1/reports: GET catálogo/resumo/detalhes; POST exportações/consultas;
GET/PUT/DELETE consultas próprias; GET exportações próprias e arquivo.
Mutação exige origem/CSRF; exportação exige idempotency-key. Configuração estrita
em reports.ts; erros 401/403/404/409/422; cache no-store.

/api/v1/reports/collect: navegação autenticada, identidade do servidor, corpo
pequeno; falha não bloqueia painel. /api/v1/reports/ingest: POST server-to-server
com Bearer configurado em REPORTS_INGEST_SOURCES (JSON source/channel/token).
Nunca fornecer token ao navegador/app. Backend consumidor valida política de
coleta, origem/robôs e autenticação antes de encaminhar eventos. Sem CORS público.
Identificadores externos aleatórios; accountId somente após autenticação na fonte.
Conclusões de negócio pelo backend. Fontes sem eventos mostram Sem dados.
