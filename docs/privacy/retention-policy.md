# Política de retenção e preservação legal — pendente

Status: DRAFT — sem aprovação Jurídico/DPO e sem prazos executáveis.

## Regra fail-closed

Nenhum job automático pode anonimizar, excluir ou mover dado pessoal enquanto esta política não tiver
aprovação nominal, data, versão e prazos por categoria. A promoção para produção verifica a evidência
de privacidade e falha enquanto o status não for `APPROVED`.

## Decisões que exigem aprovação

- prazo e evento inicial por categoria do inventário;
- anonimização versus exclusão e campos afetados;
- requisitos legais/contratuais que estendem retenção;
- quem pode criar, revisar e encerrar uma preservação legal;
- evidência/auditoria do descarte e período de retenção dessa própria evidência;
- recuperação/backup e prazo para propagação do descarte.

## Preservação legal

Uma preservação legal sempre prevalece sobre descarte automático. O job deve registrar que a categoria
foi ignorada, sem expor o conteúdo preservado, e escalar para o responsável. A remoção do hold exige
decisão humana auditada; não pode ser inferida por expiração silenciosa.

## Implementação após aprovação

A política aprovada será traduzida para configuração versionada validada por schema. O job processará
lotes pequenos, usará transação e idempotência, produzirá contagens/IDs de correlação e suportará dry
run. Testes usarão apenas registros sintéticos expirados, não expirados e sob hold.
