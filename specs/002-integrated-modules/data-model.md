# Modelo de domínio e propriedade dos dados

Desenho inicial para detalhar por história. US1 não altera persistência.

| Domínio      | Entidades/relações/campos essenciais                                                                                    | Invariantes/estados                                                                                                         |
| ------------ | ----------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Fundação     | user, role, user_role, session, audit_event, stored_file, job_execution, idempotency_record                             | Reutilizar IDs/controles; eventos append-only; job queued/running/succeeded/failed.                                         |
| Conteúdo     | Notícia, versão, destaque, publicação/canal: título, conteúdo estruturado, mídia, autor, vigência                       | Rascunho separado da versão pública; revisão configurada; publicação idempotente por canal.                                 |
| Pessoas      | Beneficiário, dependência, documento, análise, verificação, decisão/credencial: identificação, fonte, data, responsável | Unicidade conforme política; vínculo com vigência; dimensões de situação independentes; não verificado não vira reprovação. |
| Atendimentos | Unidade própria, serviço/oferta, profissional/recurso, disponibilidade/exceção, reserva/evento                          | Intervalos [início,fim), UTC, capacidade e transação/constraints; desfechos/transições conforme política.                   |
| Benefícios   | Parceiro/unidade, contrato, oferta, categoria/tag: vigência, condições, visibilidade                                    | Oferta vigente/aprovada antes de expor; ocultação não exclui contrato.                                                      |
| Avaliações   | Avaliação de atendimento/benefício, nota/opinião, autoria protegida, moderação/motivo                                   | Alvo válido e opinião original preservada.                                                                                  |
| Equipe       | Colaborador, unidade/setor, vínculo opcional com user, escopo                                                           | Pessoa administrativa e login distintos; escopo autorizado no servidor.                                                     |
| Mensagens    | Modelo, campanha, público, execução, destinatário/entrega, evento de provedor                                           | Idempotência por execução/destinatário/canal; preferências revalidadas; evidência por estado.                               |
| Créditos     | Política versionada, conta, lançamento, lote/item, correção referenciada                                                | Unidade explícita; saldo derivado; original preservado; limites/conversão configurados.                                     |
| Portal       | Vínculo conta-organização, solicitação/QR, histórico de estado                                                          | Toda relação limitada à organização; pagamento não inferido.                                                                |
| Relatórios   | Consulta, filtros/período, execução                                                                                     | Sem segunda cópia editável; arquivo/job existentes e escopo reautorizado.                                                   |

Documentos referenciam stored_file; exportações referenciam job/arquivo. Migrations aditivas
numeradas quando o domínio for implementado, com FKs, validação de escopo e versão/concorrência. Não
criar tabelas especulativas para simular módulos prontos. Arquivamento lógico não implementa
retenção.
