# Modelo de dados

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
