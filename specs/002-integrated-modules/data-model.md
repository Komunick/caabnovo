# Modelo de domínio e propriedade dos dados

Mapa de propriedade conciliado em 02/10/2026. As entidades descrevem o desenho; implementação e
homologação constam nas specs e em [MODULES](../../docs/MODULES.md). Créditos/Portal e novas
integrações permanecem suspensos ou planejados; a tabela não autoriza criá-los. US1 não altera
persistência.

| Domínio       | Entidades/relações/campos essenciais                                                                                    | Invariantes/estados                                                                                                         |
| ------------- | ----------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Fundação      | user, role, user_role, session, audit_event, stored_file, job_execution, idempotency_record                             | Reutilizar IDs/controles; eventos append-only; job queued/running/succeeded/failed.                                         |
| Conteúdo      | Notícia, versão, destaque, publicação/canal: título, conteúdo estruturado, mídia, autor, vigência                       | Rascunho separado da versão pública; revisão configurada; publicação idempotente por canal.                                 |
| Pessoas       | Beneficiário, dependência, documento, análise, verificação, decisão/credencial: identificação, fonte, data, responsável | Unicidade conforme política; vínculo com vigência; dimensões de situação independentes; não verificado não vira reprovação. |
| Atendimentos  | Unidade própria, serviço/oferta, profissional/recurso, disponibilidade/exceção, reserva/evento                          | Intervalos [início,fim), UTC, capacidade e transação/constraints; desfechos/transições conforme política.                   |
| Benefícios    | Parceiro/unidade, contrato, oferta, categoria/tag: vigência, condições, visibilidade                                    | Oferta vigente/aprovada antes de expor; ocultação não exclui contrato.                                                      |
| Avaliações    | Avaliação de atendimento/benefício, nota/opinião, autoria protegida, moderação/motivo                                   | Alvo válido e opinião original preservada.                                                                                  |
| Colaboradores | user, role, user_role, user_access e session da Fundação                                                                | Gestão de contas/permissões existente; não criar cadastro funcional de RH nem identidade concorrente.                       |
| Mensagens     | Modelo, campanha, público, execução, destinatário/entrega, evento de provedor                                           | Idempotência por execução/destinatário/canal; preferências revalidadas; evidência por estado.                               |
| Créditos      | Política versionada, conta, lançamento, lote/item, correção referenciada                                                | Unidade explícita; saldo derivado; original preservado; limites/conversão configurados.                                     |
| Portal        | Vínculo conta-organização, solicitação/QR, histórico de estado                                                          | Toda relação limitada à organização; pagamento não inferido.                                                                |
| Relatórios    | Consulta, filtros/período, execução                                                                                     | Sem segunda cópia editável; arquivo/job existentes e escopo reautorizado.                                                   |

Documentos referenciam stored_file. Exportações legadas referenciam job/arquivo; downloads diretos
usam export_operation como estado técnico, sem fila/histórico obrigatório. Migrations aditivas
numeradas quando o domínio for implementado, com FKs, validação de escopo e versão/concorrência. Não
criar tabelas especulativas para simular módulos prontos. Arquivamento lógico não implementa
retenção.

## Modelo vigente do incremento — 21/09/2026

Não criar cadastro central. Identidades e dados permanecem com cada domínio; export_operation é
estado técnico mínimo de uma requisição. Relatórios só lê fontes autorizadas. Programas futuros não
geram tabelas, tipos, rotas ou grants neste recorte. Retenção permanece adiada. P01 está
parcialmente definida na matriz de Associados; aplicação em POL02 e pergunta sobre reanálise em
POL01, sem inferir novas exigências.

Nenhuma entidade de negócio nova nesta revisão. MFA permanece retirado. Constituição 2.1.0 exige
motivo somente para solicitar exclusão de Colaboradores/Associados, com autoria/data, preservando
motivos históricos sem backfill; demais ações dispensam justificativa. A revisão deste modelo não
executa migration nem altera dados.
