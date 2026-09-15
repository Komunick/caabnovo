# Arquivos no banco principal

## Configuração vigente — 15/09/2026

PostgreSQL é o único backend de arquivos. `stored_file` guarda metadados e
`stored_file_content.body` guarda os bytes em `bytea`, no mesmo `DATABASE_URL` da aplicação.
Imagens JPG/PNG, documentos PDF e exportações de auditoria passam por essa estrutura.
MinIO, adaptadores/SDKs S3 e a ferramenta de cópia do legado foram retirados do projeto.

O usuário informou que o site contém apenas dois arquivos de teste e dispensou sua
migração. Arquivos antigos que só existam no MinIO deixam de ser lidos; reenviá-los pelo
formulário quando necessários. A atualização não apaga registros, buckets ou volumes.

## Implantação

1. Confirmar a migration aditiva `0018_database_file_content.sql` aplicada pelo comando
   de migrations do projeto; não reescrever migrations existentes. Aplicar as demais
   migrations pendentes da versão implantada conforme o fluxo de entrega.
2. Atualizar web e worker juntos, preservando `DATABASE_URL`, `BETTER_AUTH_SECRET` e a
   origem HTTPS real em `BETTER_AUTH_URL`. Manter DEV e PROD separados.
3. Omitir `FILE_STORAGE_BACKEND` ou usar `database`. O antigo valor `s3` agora é recusado
   na inicialização. Retirar variáveis `S3_*`: elas não são lidas e não habilitam fallback.
4. Manter ClamAV acessível e o worker ativo. Quarentena, assinatura/MIME real, tamanho,
   SHA-256, rejeição de vírus e promoção após aprovação continuam obrigatórios.
5. No proxy, permitir PUT e corpos de pelo menos 25 MiB em `/api/v1/files/content`
   (ex.: limite de 26 MiB) e configurar timeout de upload. A aplicação mantém o limite
   autorizado mesmo quando Content-Length não é informado.
6. Não registrar query strings dessa rota: `grant` é uma credencial HMAC temporária,
   vinculada ao método/chave e válida por cinco minutos. Emissão exige as permissões
   e controles CSRF existentes. Download recusa conteúdo excluído ou não disponível.
7. Validar novos envios/reabertura de imagens, foto de associado, documento privado e
   exportação. Conferir permissão, conteúdo e processamento; não usar dados pessoais
   reais em testes automatizados. Reenviar os dois arquivos antigos de teste se necessário.

## Retirada do serviço antigo

O Compose já não declara MinIO, inicializador, portas 9000/9001 ou seu volume.
Alterar o Compose não remove contêineres/serviços já criados em outro ambiente.
Após implantar web/worker com PostgreSQL e validar os fluxos, o operador da hospedagem
deve conferir que o MinIO atende somente este projeto e retirar seu serviço, rotas e
configuração do painel. Não remover um MinIO compartilhado com outros projetos.
Não executar prune, remoção genérica de volumes ou alteração de outros bancos.

A retirada remota exige acesso à VM/painel. Esta entrega não afirma que um serviço
remoto foi parado apenas porque sua declaração foi removida do repositório.

## Backup e rollback

Os backups do PostgreSQL incluem os binários. Monitorar espaço, WAL, memória e duração
dos backups. Testar restauração em banco isolado e comparar tamanho/SHA-256 com os
metadados; não restaurar backup antigo sobre dados novos.

Rollback da aplicação exige uma versão que compreenda `database/` e a migration 0018.
Não retirar `stored_file_content`. O MinIO não é recriado automaticamente, e os bytes
novos não são copiados para ele. Manter arquivos de backup conforme a retenção existente.

Servidores locais permanecem desligados conforme a decisão do usuário. Validação de
CI usa PostgreSQL e ClamAV descartáveis, sem MinIO ou credenciais de storage externo.
