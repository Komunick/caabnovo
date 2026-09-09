# Pendências para produção

Situação em 9 de setembro de 2026. Estas pendências não impedem desenvolver os próximos módulos em
branches destinadas a `dev`. Elas continuam abertas para a liberação em produção.

## T089 — Privacidade, retenção e preservação legal

O [inventário](privacy/data-inventory.md) e a [política de retenção](privacy/retention-policy.md)
estão em rascunho. Retenção significa definir por quanto tempo cada categoria de dado será guardada
e o que acontece depois: exclusão ou anonimização. Preservação legal é uma suspensão do descarte
para conservar dados necessários a uma obrigação ou disputa.

Faltam duas entregas distintas:

1. **Decisões da CAAB:** definir prazo e evento inicial por categoria, campos a excluir ou anonimizar,
   exceções, responsáveis pela preservação legal, tratamento de backups e retenção da evidência do
   próprio descarte. Registrar aprovador, data e versão conforme a política do projeto.
2. **Implementação técnica:** transformar essas decisões em configuração e implementar o job com
   lotes, transações, idempotência, simulação sem alterações, respeito à preservação legal e auditoria.
   Testar registros sintéticos expirados, dentro do prazo e preservados.

O arquivo `apps/worker/src/jobs/apply-retention.ts` atualmente valida a estrutura de uma aprovação e
lança um erro mesmo para uma política aprovada: o descarte ainda não está implementado. Portanto,
não basta trocar o status do documento para `APPROVED`.

O agente pode organizar a matriz de decisões e implementar os controles. Não pode inventar os prazos
da organização nem atribuir uma aprovação ao Jurídico/DPO. A exigência de aprovação vem da política
do próprio projeto. A [evidência de privacidade](../specs/001-project-foundation/evidence/privacy.md)
só deve ser concluída após aprovação real e implementação verificada.

O workflow `promotion.yml` hoje verifica a origem `dev` e uma linha `Status: APPROVED` na evidência.
Essa verificação textual não comprova que os controles foram implementados. Também é necessário
exigir o check `validate-source` na proteção de `main` para que sua falha bloqueie o merge.

## T095 — Proteção remota das branches e provas de bloqueio

`dev` já possui ruleset ativo e verificado pela API: PR obrigatório, checks `quality`, `browser` e
`security`, atualização com a base e bloqueios de exclusão e force-push, sem bypass configurado.
As [evidências](../specs/001-project-foundation/evidence/branch-protection.md) registram a aplicação.

Ainda faltam:

- **Completar a proteção de `main`:** revisar e aplicar a configuração com os checks de qualidade,
  navegador, segurança e promoção, além das regras de revisão humana. Isso foi adiado por orientação
  expressa do responsável para não mexer em `main`; não é uma impossibilidade técnica.
- **Provar os bloqueios:** executar e registrar cenários controlados de rejeição de push direto e
  promoção com origem inválida. A leitura da API comprova a configuração, mas não substitui essas
  tentativas reais. Um push de teste pode ser aceito se houver erro na proteção; por isso o protocolo
  precisa limitar esse efeito e ter autorização para o alvo. `git push --dry-run` não serve como prova.

O agente pode preparar e executar a configuração e as provas dentro do escopo autorizado.
Esta entrega autoriza validação local e PR para `dev`; não altera proteções de `main`, não executa
push direto nas branches protegidas e não promove nem faz merge em produção.
