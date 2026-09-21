# Política de retenção e preservação legal — pendente

Status: DRAFT — sem aprovação Jurídico/DPO e sem prazos executáveis.

## Regra fail-closed

Nenhum job automático pode anonimizar, excluir ou mover dado pessoal enquanto esta política não tiver
aprovação nominal, data, versão e prazos por categoria. A promoção para produção valida `retention-approval.json`, a origem do PR e o mesmo
bloqueio de implementação usado pelo worker. Uma linha `Status: APPROVED` na evidência
não libera a promoção nem autoriza descarte.

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

## Revisão de 16/09/2026

A [inspeção do legado](legacy-retention-review-2026-09-16.md) encontrou exclusão lógica e
expiração de sessão, mas não política completa de retenção aprovada. O arquivo
`retention-approval.json` permanece PENDING, sem aprovador ou prazos inventados.
O runtime e a promoção recusam até uma aprovação estruturalmente válida enquanto os
controles por categoria não estiverem implementados. Não há job de descarte habilitado.

## Decisão de produto — clarify de 21/09/2026 (Q10)

O usuário escolheu manter a definição institucional dos prazos para cadastros,
documentos e auditoria para depois, com descarte automático desligado. Nenhum prazo,
aprovador ou autorização de exclusão/anonimização foi definido nesta etapa.
`retention-approval.json` permanece PENDING, sem alteração; T089 da fundação continua
pendente e o gate de produção é preservado. Adiar a definição não aprova retenção
permanente nem significa que a política foi concluída. O padrão de exportação com
download direto, sem prazo de disponibilidade, é uma decisão separada do tratamento
dos dados originais. Nenhum job, dado, configuração operacional ou conta foi alterado.
