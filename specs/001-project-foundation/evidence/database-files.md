# Arquivos no PostgreSQL — evidências de 14/09/2026

Implementação na branch `feature/admin-updates-20260914`, junto às justificativas e ao
resultado OAB. A migration 0018 acrescenta conteúdo bytea no mesmo banco da aplicação.
Web e worker escolhem o backend pela chave de cada arquivo; novos uploads usam o banco.

## Cobertura

- Upload de JPG pelo domínio do painel e download com comparação exata dos bytes.
- Tamanho, checksum e MIME incorretos recusados antes de persistir o conteúdo.
- Permissão de download obrigatória na emissão; grant inválido, método errado e prazo
  expirado recusados; quarentena e arquivo excluído indisponíveis para leitura.
- Finalização e repetição do upload em concorrência, sem substituir bytes após finalizar.
- Inspeção real de assinatura/MIME, promoção idempotente e rejeição/purga de conteúdo infectado.
- Cópia legada com hash inválido recusada; cópia válida verificada dentro da transação,
  preservando ID e vínculos, sem comando de exclusão do S3.
- Exportação de auditoria e seu conteúdo gravados na mesma transação do PostgreSQL.
- Migration aplicada desde banco vazio, com acesso usando o papel restrito `caab_runtime`.
- Regressões de fotos, documentos, capa/corpo e publicação de notícias no navegador.

## Execução

Os 337 testes unitários/contratos passaram localmente; tipos, lint e formatação aprovados.
As 148 integrações e builds passaram no CI do commit `e33f44d`. A primeira execução
identificou um parâmetro UUID/texto no fixture de cópia; o teste foi corrigido. O E2E de
quarentena ainda esperava um nome de bucket na URL e foi atualizado para origem/caminho
do painel, mantendo a recusa de download e acrescentando a recusa do método incorreto.

Validação completa do código de aplicação em `8bc944c`:
[34885988514](https://github.com/Komunick/caabnovo/actions/runs/34885988514), com quality,
browser e security aprovados. O commit `498265e` acrescenta somente documentação e a
verificação concorrente ao teste de integração; quality/security também aprovados na
[34886392997](https://github.com/Komunick/caabnovo/actions/runs/34886392997).

| Gate | Resultado |
| --- | --- |
| Formatação, lint, tipos e proteção de branches | Aprovados |
| Unitários + contratos | 254 + 83 aprovados |
| Integração em PostgreSQL descartável | 148 aprovados |
| Chromium, sem MinIO | 60 aprovados, sem falhas ou flakies |
| Acessibilidade dedicada | 6 aprovados |
| Builds web/worker/pacotes, dependências e segredos | Aprovados |

O job de navegador inicia PostgreSQL e ClamAV, sem MinIO. As capturas OAB dessa mesma
entrega contêm somente dados sintéticos e já foram inspecionadas em desktop claro e celular
escuro. A alteração de armazenamento não muda a apresentação das imagens.

## Limites e implantação

Nenhum servidor local foi iniciado, nenhuma migration foi aplicada em banco real e nenhum
arquivo da VM foi movido. O [procedimento de implantação](../../../docs/DATABASE-FILE-STORAGE.md)
detalha backup, migration 0018, atualização conjunta web/worker e cópia retomável do legado.
A homologação do domínio DEV publicado ocorre depois da integração e implantação autorizadas.
Conservar o S3 e seus volumes até validar os arquivos e os backups. Não há rollback automático
para uma versão da aplicação que desconhece as chaves database/.
