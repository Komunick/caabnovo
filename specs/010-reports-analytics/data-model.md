# Dados

- report_query: proprietário, nome, configuração validada, versão e datas.
- report_export: job, solicitante, configuração, formato, fingerprint e chave
  idempotente por proprietário. Arquivo imutável usa stored_file/content existentes.
- analytics_event: evento idempotente por fonte, canal/ambiente, ocorrência,
  identificadores opacos, tela/ação permitidas, dispositivo, origem e versão.
- Cadastros permanecem nos domínios. Consultas salvas leem dados atuais;
  arquivos registram uma fotografia consistente da geração.

## Adequação ao download direto — Q6 de 21/09/2026

report_export/stored_file descrevem armazenamento integrado, não uma exigência de
histórico de download no fluxo alvo. Preservar registros/arquivos existentes;
modelar apenas dados necessários à geração direta e auditoria na revisão DX01.
Download sem prazo de disponibilidade não implica retenção ilimitada no servidor.
Nenhuma tabela, migration ou política de descarte alterada neste clarify.


## Modelo vigente do incremento — 21/09/2026

report_export/stored_file_content antigos preservados; nenhuma linha nova de report_export/job_execution necessária para o fluxo direto. Consulta salva mantém dono/configuração e reautoriza a cada uso. Novo estado operacional compartilhado não guarda arquivo. ReportDefinition inclui formato em todos os modos, columns ordenadas e filtros sem limites funcionais de exportação.

Entidades técnicas/ciclo de vida em [contrato comum](../002-integrated-modules/contracts/direct-exports.md); sem cópia de domínio.
Regras anteriores de MFA ou motivo obrigatório não são vigentes; a constituição 2.0.0
e contratos de 21/09 prevalecem. Mudanças descritas são planejamento, sem migration executada.

## U1 — dependências do arquivo legado

configuration.permissions é evidência histórica e não lista suficiente para autorizar download. Derivar também exigências da configuração/versão conhecida do gerador segundo [contrato](contracts/legacy-downloads.md); não criar concessões, reescrever bytes ou alterar auditoria para corrigir arquivos antigos. Configuração insuficiente nega a entrega.
