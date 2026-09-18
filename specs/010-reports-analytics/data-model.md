# Dados

- report_query: proprietário, nome, configuração validada, versão e datas.
- report_export: job, solicitante, configuração, formato, fingerprint e chave
  idempotente por proprietário. Arquivo imutável usa stored_file/content existentes.
- analytics_event: evento idempotente por fonte, canal/ambiente, ocorrência,
  identificadores opacos, tela/ação permitidas, dispositivo, origem e versão.
- Cadastros permanecem nos domínios. Consultas salvas leem dados atuais;
  arquivos registram uma fotografia consistente da geração.
