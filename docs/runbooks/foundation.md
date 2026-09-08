# Runbook operacional — Fundação CAAB

Este runbook cobre o monólito web, worker, PostgreSQL, storage S3-compatible, ClamAV e coletor OTEL.
Nunca copie tokens, cookies, senhas, payloads pessoais ou stacks completas para tickets ou chats.

## Triagem inicial

1. Registre horário, ambiente, rota/job afetado, `requestId` e `correlationId`.
2. Consulte `/livez`. Falha indica processo web indisponível.
3. Consulte `/readyz`. Resposta 503 identifica `database` ou `worker` como degradado sem revelar
   credenciais.
4. Verifique alertas de latência, taxa de erro, backlog, scanner, storage e heartbeat.
5. Preserve logs allowlisted e eventos de auditoria; não edite nem exclua evidência.
6. Classifique impacto e acione o responsável humano antes de qualquer rollback ou rotação.

## Incidente web ou banco de dados

- Confirme conectividade e capacidade do PostgreSQL sem executar DDL pela aplicação.
- Verifique migrations por nome/checksum; nunca altere migration aplicada.
- Para rollback, mantenha a expansão de schema e reverta somente a aplicação compatível.
- Se recuperação de dados for necessária, use `infra/postgres/backup.ps1` e `restore.ps1` em um novo
  banco `caab_restore_*`; valide antes de trocar a conexão.
- Após estabilizar, execute smoke tests de login, sessão, autorização, auditoria e `/readyz`.

## Credencial ou segredo comprometido

1. Revogue/rotacione o segredo no provedor responsável; não registre o valor antigo ou novo.
2. Para sessões, revogue os registros ativos do usuário e confirme 401 no próximo request.
3. Para S3, substitua access key/secret, revogue a anterior e confirme buckets sem acesso anônimo.
4. Para banco, crie credencial nova de menor privilégio, atualize o ambiente e revogue a anterior.
5. Para MFA, invalide recuperação/TOTP comprometido e refaça o enrollment por canal verificado.
6. Procure o identificador, nunca o segredo, em logs/auditoria e acione resposta a incidente/DPO quando
   houver possível exposição de dados pessoais.

## Fila esgotada ou job terminal

- Abra `/operations/jobs/{jobId}` e registre tipo, tentativas, erro seguro e correlação.
- Confirme worker heartbeat e profundidade da fila antes do redrive.
- Corrija a dependência causadora; redrive sem correção apenas consome novas tentativas.
- Um operador com `jobs:redrive` deve fornecer justificativa. O redrive é auditado e reutiliza a chave
  idempotente, impedindo efeito de negócio duplicado.
- Se o limite de tentativas foi atingido ou o payload não puder ser reconstruído, não force o estado;
  escale para análise e crie uma correção rastreável.

## Scanner indisponível ou malware

- Scanner indisponível/timeout: arquivos ficam em `scan_error`; nenhum download é liberado.
- Confirme porta 3310, healthcheck, atualização de assinaturas e limites `MaxFileSize`/`StreamMaxLength`.
- Após recuperar ClamAV, redrive o job com justificativa e monitore o alerta até zerar.
- Resultado `infected`: arquivo permanece `rejected`, a cópia de quarentena é removida e o evento deve
  ser tratado como segurança. Nunca promova ou baixe manualmente o objeto.

## Storage indisponível ou divergente

- Confirme healthcheck, credenciais e existência dos buckets `caab-quarantine`, `caab-private` e
  `caab-public`.
- Quarentena e bucket privado devem negar acesso anônimo. URLs assinadas expiram em cinco minutos.
- Execute o reconciliador; ele conclui promoções interrompidas e contabiliza objetos ausentes.
- Não copie arquivos diretamente para o bucket privado sem MIME/magic bytes, tamanho, checksum e scan
  limpos registrados no banco.

## Encerramento

Documente causa, linha do tempo, correção, validação, IDs de correlação e ações preventivas. Reexecute
os gates afetados. Mudanças entram por PR em `dev`; promoção para `main` continua humana.
