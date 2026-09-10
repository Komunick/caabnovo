# Modelo

- member: UUID, name/social_name, CPF opcional único, birth_date, email/phone, inscrição OAB opcional única (número/UF/tipo), version/profile_version, archived_at e timestamps. Sem senha/papel/saldo.
- member_relationship: titular/dependente FKs, tipo declarado, início/fim, ator. Par ativo único; sem autorrelação/ciclo. Escritas serializadas com advisory lock e busca recursiva.
- member_document: member/file FKs, categoria, documento anterior da mesma pessoa opcional. Arquivo privado seguro revalidado ao anexar, baixar e revisar.
- member_document_review: append-only, accepted/correction_requested, motivo, ator/data. Substituição não herda aceite.
- member_assessment: dimensão/resultado controlados, fonte, motivo, data da observação, validade, profile_version, ator/data. Última por dimensão; validade vencida/identificação alterada são avisos derivados.

Comandos usam versão do agregado, idempotency_record por ator/ação/pessoa, fingerprint e referência ao resultado; repetição não duplica efeito. Auditoria na mesma transação, sem snapshots de CPF/documento. Runtime não altera/apaga avaliações e revisões.

Permissões reutilizam permission/role_permission/user_role: members:read/write/review, com leitura
prévia às demais ações. A migration associa somente o administrador já existente. Sessão, vigência
das concessões e permissões são revalidados no banco. Não há exigência de MFA, conforme sua remoção
do painel na spec 006. Documentos incluem todas as revisões,
e o histórico de vínculos é consultável tanto pelo titular quanto pelo dependente.
