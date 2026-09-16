# Pendências para produção

Estado revisto em 16/09/2026. Desenvolvimento e revisão em dev continuam permitidos;
esta revisão não promove código nem concede aprovação institucional.

## T089 — Privacidade e retenção

Inventário atualizado aos módulos existentes. [Pesquisa do sistema antigo](privacy/legacy-retention-review-2026-09-16.md)
não encontrou política completa aprovada. Faltam prazos/eventos, campos/ações, exceções,
responsáveis pela preservação legal e propagação em backups, com aprovador, data e versão reais.

O gate valida `docs/privacy/retention-approval.json` e chama o mesmo bloqueio de implementação
usado por `applyRetention`. Editar apenas `Status: APPROVED` em Markdown não libera produção.
Os testes comprovam recusa de aprovação incompleta e bloqueio mesmo com uma aprovação
sintética válida enquanto os controles não estiverem implementados.

T089 continua aberta: não foram inventados prazos nem implementado descarte sem regras aprovadas.

## T095 — Proteções remotas

API conferida em 16/09: repositório público com acesso administrativo. Proteção dev existente
22635784 preservada. Proteção main 23551500 criada e relida: PR obrigatório, uma aprovação,
CODEOWNERS, aprovação do último push, threads resolvidas, sem exclusão/force-push/bypass.
Checks `quality`, `browser`, `security` e `validate-source` vêm do GitHub Actions (App 15368).

`infra/github/apply-rulesets.ps1 -Repository owner/name -Branch dev|main` faz preview;
`-Apply` escreve somente no alvo explícito e rejeita ruleset existente com outro alvo.
O padrão continua dev. Os testes usam API simulada; não executam push direto.

Provas de rejeição remota de push direto e promoção inválida continuam distintas da
configuração: não foram executadas nesta entrega, respeitando a proibição de pushes diretos
nas branches protegidas. A consulta ao histórico de rejeições de dev não retornou registros.
T095 não é marcada como integralmente concluída apenas pela leitura da API.

## DEV e OAB

Rascunho sintético salvo, editado e reaberto com imagem disponível pelo domínio DEV.
A inspeção dos serviços da VM/MinIO foi retirada do escopo pelo usuário nesta conversa.
Não se afirma estado de contêineres com base no sucesso do navegador.

A consulta OAB autorizada no DEV retornou `OAB_NOT_CONFIGURED`; as credenciais precisam
estar presentes no ambiente web como `API_OAB_KEY` e `API_OAB_PASSWORD`. A flag antiga
não participa da decisão. Não houve retorno pessoal nem homologação positiva.

## Programa integrado

As jornadas implementadas seguem cobertas pelo CI e pelos specs 003–008. Mensagens,
Portal, Relatórios, interface app/site e Créditos suspensos não foram implementados nesta
entrega. T055–T057 do programa 002 continuam vinculadas à entrega completa do programa;
nenhuma suíte dos módulos atuais equivale à conclusão dos módulos futuros.
