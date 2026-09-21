# Modelo

Incremento 0015: `member.photo_file_id` nullable, FK para `stored_file`, sem backfill. Serviço exige
arquivo privado do associado, JPEG/PNG de até 5 MB, available/clean e não excluído. Alterar foto
incrementa somente version; auditoria registra IDs anterior/novo, sem imagem, nome ou URL assinada.
Remoção não exclui fisicamente o arquivo.

Decisão confirmada em 11/09/2026: `member.photo_file_id` é a referência única da foto que o
associado enviará pelo app e que o painel exibirá. Não criar outro campo/cópia de foto por canal,
nem usar a imagem da conta administrativa de Colaboradores para esse fim. O vínculo da identidade do
app ao cadastro e a escrita pelo titular pertencem à integração do app; a estrutura atual não
significa que esse fluxo já esteja entregue.

Migration aditiva 0013: member.administrative_status (inactive/active/blocked),
administrative_reason, administrative_changed_at e administrative_changed_by (FK user). Registros
anteriores e novos recebem inactive sem decisão presumida; CHECK exige metadados completos para
active/blocked. Versão do agregado muda; profile_version não muda. Auditoria registra
activate/block/unblock, previousAdministrativeStatus e administrativeStatus na mesma transação.
Arquivamento/restauração preserva esses campos. Não há expiração automática.

- member: UUID, name/social_name, CPF opcional único, birth_date, email/phone, inscrição OAB
  opcional única (número/UF/tipo), version/profile_version, archived_at e timestamps. Sem
  senha/papel/saldo.
- member_relationship: titular/dependente FKs, tipo declarado, início/fim, ator. Par ativo único;
  sem autorrelação/ciclo. Escritas serializadas com advisory lock e busca recursiva.
- member_document: member/file FKs, categoria, documento anterior da mesma pessoa opcional. Arquivo
  privado seguro revalidado ao anexar, baixar e revisar.
- member_document_review: append-only, accepted/correction_requested, motivo, ator/data.
  Substituição não herda aceite.
- member_assessment: dimensão/resultado controlados, fonte, motivo, data da observação, validade,
  profile_version, ator/data. Última por dimensão; validade vencida/identificação alterada são
  avisos derivados.

Comandos usam versão do agregado, idempotency_record por ator/ação/pessoa, fingerprint e referência
ao resultado; repetição não duplica efeito. Auditoria na mesma transação, sem snapshots de
CPF/documento. Runtime não altera/apaga avaliações e revisões.

Permissões reutilizam permission/role_permission/user_role: members:read/write/review, com leitura
prévia às demais ações. A migration associa somente o administrador já existente. Sessão, vigência
das concessões e permissões são revalidados no banco. Não há exigência de MFA, conforme sua remoção
do painel na spec 006. Documentos incluem todas as revisões, e o histórico de vínculos é consultável
tanto pelo titular quanto pelo dependente.

Consultas OAB reutilizam `audit_event`: ações `member.oab_query_started`, `member.oab_queried` e
`member.oab_query_failed`, com operador, lookupId, inscrição/UF, fonte, instante e resultado/código
seguro. Consultas pelo cadastro usam entity_type `member` e seu ID, aparecendo no histórico
contextual; consultas avulsas usam `oab_lookup` e lookupId. Nome retornado, CPF, detalhes
financeiros, credenciais e JSON bruto não são persistidos. Falha final de autenticação/autorização
deixa somente o início e impede a entrega do resultado. Ausência de configuração falha antes de
iniciar a consulta e não produz resultado fictício. Nenhum registro em `member_assessment` é
inserido ou atualizado por uma consulta integrada.

## Modelo vigente do incremento — 21/09/2026

member.id identifica cada pessoa individualmente; vínculo familiar não une agendas. export_operation
referencia somente ator/dataset, não cria pessoa/login. Q11 mantém valores não verificados
desconhecidos e decisões humanas com fonte/autor/data; motivos históricos preservados, sem campo
obrigatório. Projeção de aviso em 008 não é novo campo persistido em member.

Entidades técnicas/ciclo de vida em
[contrato comum](../002-integrated-modules/contracts/direct-exports.md); sem cópia de domínio.
Regras anteriores de MFA ou motivo obrigatório não são vigentes; a constituição 2.0.0 e contratos de
21/09 prevalecem. Mudanças descritas são planejamento, sem migration executada.

## Ciclo de vida implementado — 21/09/2026

`member.deletion_effective_at` guarda clock_timestamp()+168h. Expirado, o cadastro some por padrão e
novas relações/reservas são recusadas; não é arquivado nem tem status administrativo alterado
automaticamente. Filtros excluded/pending/only/all distinguem os estados; restauração limpa a data,
preserva vínculos e não desfaz decisões de reservas já canceladas.

Migration0028 validada no CI descartável; sem aplicação local.
