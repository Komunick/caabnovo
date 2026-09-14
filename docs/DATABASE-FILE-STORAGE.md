# Arquivos no banco principal

Decisão de 14/09/2026: novos arquivos usam o PostgreSQL indicado em `DATABASE_URL`, o mesmo
da aplicação. `stored_file` conserva os metadados e `stored_file_content.body` guarda bytes
em `bytea`. O fluxo compartilhado inclui imagens JPG/PNG, documentos PDF e exportações
de auditoria. Nenhum banco, volume de imagens ou domínio de storage novo é necessário.

## Configuração e implantação

1. Fazer e verificar backup do PostgreSQL e preservar o armazenamento anterior.
2. Aplicar a migration aditiva `0018_database_file_content.sql` pelo comando de migrations
   do projeto. Ela não altera arquivos, tabelas anteriores ou buckets.
3. Implantar esta versão no web e no worker com `FILE_STORAGE_BACKEND=database` (padrão).
   Usar o mesmo `DATABASE_URL` e `BETTER_AUTH_SECRET` do ambiente. `BETTER_AUTH_URL` deve ser
   a origem HTTPS real do painel. DEV e PROD continuam separados.
4. Manter ClamAV acessível e o worker funcionando. O fluxo preserva MIME/assinatura real,
   hash, quarentena, rejeição de vírus e promoção somente após aprovação.
5. Configurar o proxy do painel para aceitar PUT e corpos de pelo menos 25 MiB na rota
   `/api/v1/files/content` (ex.: limite de 26 MiB). A aplicação limita cada corpo ao tamanho
   autorizado, até 25 MiB, mesmo sem Content-Length. Configurar timeout de upload no proxy.
6. Não registrar query strings dessa rota: `grant` é uma credencial temporária, como as antigas
   URLs S3 assinadas. A emissão continua protegida pelas permissões/CSRF dos endpoints existentes.
7. Validar envio e reabertura de JPG/PNG em rascunho, foto de associado, documento privado
   e exportação. Para uma notícia já publicada de teste, verificar acesso e retirada por canal.

O navegador envia os bytes para o próprio painel; DNS/CORS/HTTPS de `files-*` não participam
dos novos uploads. A rota aceita somente capacidades HMAC vinculadas a método/chave e válidas
por cinco minutos. Download recusa conteúdo não disponível ou excluído. Após finalização,
o PUT é recusado; ele não pode substituir conteúdo já inspecionado.

## Transição dos arquivos existentes

As chaves anteriores continuam sendo lidas pelo adaptador S3. Conservar `S3_ENDPOINT`,
credenciais e nomes dos buckets anteriores enquanto existirem arquivos legados. Para acesso
via navegador antes da cópia, o antigo endpoint público ainda precisa funcionar.

Executar na VM, com o ambiente correto e esta versão instalada:

```sh
pnpm --filter @caab/worker storage:migrate
pnpm --filter @caab/worker storage:migrate --apply
```

O primeiro comando apresenta somente contagens por estado. O segundo copia arquivos
`available`/`clean` um a um (páginas de 20), valida tamanho e SHA-256 do S3 e novamente no
PostgreSQL, e troca a chave na mesma transação. Preserva ID, vínculos, metadados e objetos
S3 de origem. Repetir o comando retoma os arquivos ainda não copiados. Erros de acesso ou
integridade interrompem a cópia sem descartar a origem. Não imprimir credenciais ou nomes
pessoais nos relatórios. O limite operacional da cópia é 100 MiB por arquivo; arquivos maiores
exigem outro lote planejado, sem aumentar automaticamente o limite de upload da aplicação.

Quarentenas em processamento continuam no backend original: deixar o worker concluí-las
e repetir a cópia. Contagens de `initiated`/`rejected`/`scan_error` exigem avaliação; não apagar
esses objetos nem desligar definitivamente o legado apenas porque os disponíveis foram copiados.
Conservar backups do S3 até validar leitura, restauração e a retenção aplicável.

## Operação e rollback

O backup do banco agora inclui as imagens e os demais binários. Monitorar espaço livre, WAL,
tempo/tamanho dos backups e memória do web/worker; não foi realizado benchmark da VM.
Listagens consultam apenas metadados. Testar restauração em banco isolado e comparar hashes
com `stored_file.checksum_sha256` antes de considerar o backup validado.

Para redirecionar apenas os próximos uploads ao S3, configurar `FILE_STORAGE_BACKEND=s3`
com os endpoints/credenciais válidos em web e worker, mantendo esta versão. A leitura escolhe
o backend por chave, portanto os arquivos já gravados no banco continuam acessíveis. Não
reverter para uma versão anterior sem suporte a database/, não remover a tabela nem restaurar
um backup antigo sobre dados novos. Os bytes do banco não são copiados automaticamente ao S3.

Nenhuma alteração de configuração remota ou migração de arquivos reais é implícita na
validação de CI. Servidores locais permanecem desligados conforme instrução do usuário.
