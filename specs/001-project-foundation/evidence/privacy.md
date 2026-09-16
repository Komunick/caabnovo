# Privacy and retention approval

Status: PENDING

Date: 2026-09-08

The data inventory and retention/legal-hold policy drafts are present, but no Jurídico/DPO approver,
approval date, policy version or category retention periods have been supplied. No period was invented
in code. The retention entry point rejects missing/unapproved policy and performs no destructive action.

Production promotion is intentionally blocked by `.github/workflows/promotion.yml` until this status is
changed to `APPROVED` by an authorized human and the category-specific controls/tests are implemented.

## Revisão em 16/09/2026

Inventário atualizado aos módulos existentes e legado inspecionado, sem política completa
aprovada encontrada. Nenhum prazo, aprovador ou descarte foi inventado. A promoção passa
pela aprovação estruturada e pelo bloqueio de implementação compartilhado com o worker;
esta linha Markdown não é mais suficiente para liberar produção. Testes recusam até uma
aprovação sintética estruturalmente válida enquanto os controles estiverem ausentes.
T089 continua PENDING. Ver docs/production-readiness.md e docs/privacy/legacy-retention-review-2026-09-16.md.
