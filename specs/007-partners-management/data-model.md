# Modelo de dados

Revisão de 14/09/2026: categorias, contratos e rascunhos de benefícios também usam
descrição automática na auditoria de criação sem motivo. Edições e transições mantêm
justificativa explícita. Sem migration ou alteração de registros/eventos anteriores.

Revisão de contatos em 11/09/2026: postalCode/address/city/state no profile JSONB
do parceiro e postalCode no da unidade, todos opcionais e sem nova migration.
Entradas futuras normalizam CEP/telefone; registros legados não são reescritos.
Criações de parceiro/unidade têm justificativa automática na auditoria quando
não fornecida; alterações mantêm justificativa explícita obrigatória.

## Complemento de diretório — migration 0017

- `partner_category`: UUID estável, nome único sem distinguir maiúsculas ou espaços
  externos, situação, versão e timestamps. Backfill agrupa os textos existentes e
  normaliza `partner.profile.category`; `partner.category_id` é FK obrigatória.
  Renomear preserva o vínculo e incrementa as versões dos parceiros afetados.
  Inativar impede novas associações, mas permite manter o cadastro já vinculado.
- `partner_app_settings`: singleton com modo `all`/`selected`, versão e timestamp;
  `partner_app_category` contém os IDs selecionados. Modo `selected` sem IDs é vazio
  intencional. A seleção e a situação ativa são verificadas no servidor em cada
  leitura pública do app; site mantém critérios e canais próprios.
- `partner_review`: fonte/id externo único, parceiro, benefício opcional pertencente
  ao mesmo parceiro, referência privada e rótulo do autor, nota 1–5, opinião original,
  data recebida, estado pending/published/hidden e versão. Moderação exige motivo,
  data e ator. O runtime só pode atualizar colunas de moderação; não pode alterar
  opinião, nota, autoria ou excluir avaliações. Não há endpoint anônimo de ingestão.

Categorias e configurações usam lock do singleton para serializar alterações de
vínculos e seleção; avaliações usam comparação de versão na atualização. Todos os
comandos têm autorização atual, idempotência e auditoria na mesma transação. A
migration não cria avaliações nem remove dados existentes.

Migration aditiva 0016; sem backfill/seed compartilhado e sem reescrever migrations aplicadas.

- `partner`: id UUID, profile JSONB validado (name/legalName/cnpj/category/description/contactName/email/phone/website), status active/suspended, archived_at, version e timestamps. Índice único parcial no CNPJ normalizado não vazio; nomes/categorias pesquisáveis. Arquivamento não apaga dados.
- `partner_unit`: id, partner_id FK, profile JSONB (name,mode,city,state,address,region,phone), active, timestamps. FK composta id/partner_id para impedir referência de outro parceiro.
- `partner_contract`: id, partner_id, reference, terms, starts_on/ends_on inclusivos, file_id opcional stored_file, status draft/approved/ended, approved_by/approved_at e timestamps. CHECK datas e estado; registro imutável de conteúdo, com aprovação/encerramento e novo contrato para corrigir/renovar.
- `partner_benefit`: id, partner_id, draft JSONB, published JSONB opcional, timestamps. Referências a unidade/contrato de rascunho e publicação com FKs compostas derivadas dos IDs; nunca relacionar unidade/contrato de outro parceiro. Snapshot publicado preserva edição privada até republicação.

Uma mutação trava partner FOR UPDATE, compara versão, valida filhos e arquivos, aplica mudança,
incrementa version e grava audit_event na mesma transação. Idempotência por ator/ação/chave com
fingerprint; replay devolve resultado atual do mesmo registro. Sem DELETE para runtime.
Publicação exige parceiro ativo não arquivado, unidade ativa, contrato aprovado, intervalo válido
contido no contrato e conteúdo/canais completos. Consulta externa revalida condições com data
atual em America/Bahia; alteração posterior que invalida publicação impede exibição imediata.
Suspender/arquivar limpa as publicações do parceiro para não republicar sozinho ao restaurar.

Arquivos owner_type=partner e owner_id=partner.id; PDF/JPEG/PNG privados, disponíveis e limpos.
Documentos nunca fazem parte da projeção externa. Contatos administrativos e CNPJ não são auditados
em snapshots nem publicados. Histórico registra IDs e transições, autor/motivo/correlação.
