# Inventário de dados pessoais — pendente de aprovação

Status: DRAFT — revisão técnica em 16/09/2026; sem aprovação Jurídico/DPO.

| Categoria | Dados tratados no produto atual | Finalidade técnica | Acesso | Retenção/descarte |
| --- | --- | --- | --- | --- |
| Identidade interna | Nome, e-mail, estado da conta | Autenticação e administração | Próprio usuário e gestão autorizada | PENDENTE CAAB/DPO |
| Autenticação e sessão | Hash de senha, sessões, verificações, IP/user-agent | Login, recuperação, revogação e investigação de abuso | Serviço de autenticação e segurança | PENDENTE CAAB/DPO |
| Autorização | Papéis, concessões e versões | Controle de acesso | Gestores autorizados e auditoria | PENDENTE CAAB/DPO |
| Associados e dependentes | Identificação, contato, endereço, nascimento e vínculos | Cadastro e atendimento | Perfis autorizados de Associados | PENDENTE CAAB/DPO |
| Consulta OAB | Consulta autorizada e resultado institucional | Conferência solicitada pelo operador | Permissão específica de consulta | PENDENTE CAAB/DPO; não inferir elegibilidade |
| Fotos e documentos privados | Bytes, metadados, responsável e versões | Evidências cadastrais e documentos de contrato | Permissões do domínio e arquivos | PENDENTE CAAB/DPO |
| Notícias | Autoria, conteúdo, revisões, imagens e publicação | Comunicação nos canais autorizados | Editores; público somente após publicação | PENDENTE CAAB/DPO |
| Parceiros | Contatos, unidades, contratos, benefícios e avaliações | Gestão da rede conveniada | Perfis autorizados | PENDENTE CAAB/DPO |
| Agendamentos | Beneficiário, profissional, reserva e eventos | Operação do atendimento | Acesso autenticado ao painel conforme regra do módulo | PENDENTE CAAB/DPO |
| Auditoria | Ator, ação, entidade e correlação | Rastreabilidade e investigação | Auditores; histórico protegido | PENDENTE CAAB/DPO e preservação legal |
| Operações e arquivos rejeitados | Jobs, tentativas, erro seguro e quarentena | Processamento e diagnóstico | Operadores e worker | PENDENTE CAAB/DPO |
| Backups e evidências de descarte | Cópias do PostgreSQL e registros de execução | Recuperação e comprovação de controles | Operação restrita | PENDENTE CAAB/DPO |

MFA/TOTP foi retirado do fluxo do produto. A existência de tabela histórica não autoriza
reutilizar segredos nem adicioná-los ao fluxo atual. Remanescentes e backups precisam entrar
na decisão institucional de retenção, sem exclusão automática nesta revisão.

Antes da aprovação: preencher controlador/operador, base/finalidade aprovada, compartilhamento,
localização, prazo, evento inicial, ação final, campos, exceções, responsáveis e tratamento de
backups por categoria. Dados pessoais reais e credenciais não entram em testes, logs ou evidências.

[Pesquisa do legado](legacy-retention-review-2026-09-16.md) não encontrou política aprovada;
comportamentos antigos não substituem essas decisões.

## Mensagens — 16/09/2026

Campanhas/modelos/públicos em messaging_resource, preferências de bloqueio em messaging_suppression, snapshots e contagens em messaging_execution, idempotência em messaging_request. Acesso único messages:access; seleção retorna apenas id/nome/preferência, sem CPF/documentos/contatos completos. Auditoria geral registra ação/versão/contagens, sem corpo da mensagem. Não há envio a terceiros nesta etapa. Retenção continua pendente de aprovação institucional; não inventar prazo de descarte.

Segmentação de Mensagens usa categoria, gênero informado, cidade/UF de residência, faixa etária, vínculo vigente e situação administrativa de Associados. As rotas de sugestões retornam apenas categorias/cidades distintas; prévias expõem contagem e amostra de nomes. Não há inferência de gênero, residência ou identidade. Campos opcionais continuam sujeitos à política institucional pendente.
