# Conferência da entrega OAB com os padrões do projeto — 15/09/2026

## Escopo e fontes

Revisão da entrega OAB, solicitada após PR26. Fontes locais: AGENTS.md, constituição
1.1.0, docs/PRINCIPLES.md, docs/DELIVERY-WORKFLOW.md, docs/STACK.md, registro LEG-001,
.github/pull_request_template.md, workflows CI/Promotion e spec005/plan/tasks/contratos.
Não representa auditoria de toda a aplicação nem homologação do ambiente remoto.

## Ajustes necessários

1. Prefixo codex/ não corresponde aos prefixos do projeto. Entrega transferida para
   fix/oab-always-on-20260915, preservando a referência a2a559d do PR26. O PR substituto
   aponta para dev; a branch anterior não recebe commits nem sincronização.
2. Retirada a exceção codex/** introduzida no CI. O workflow volta a ser idêntico ao da
   base dev154cbed, aceitando feature/**, fix/**, chore/** e docs/**.
3. Proposta antiga da flag marcada explicitamente como histórico em spec/plan/tasks.
   Contrato e código vigentes ignoram a flag, conforme decisão final do usuário.
4. STACK identifica o provedor implementado OAB-BA/Implanta e mantém CNA/ConfirmADV como
   referências nacionais; LEG-001 descreve o exemplo atual sem flag e sem segredos.
5. Descrição do PR substituto inclui os quatro checkboxes do template e rollback por
   revert em branch/PR próprios; sem reintroduzir controle de ativação.

## Conferência por regra

| Regra | Resultado e evidência |
| --- | --- |
| Prefixo permitido e PR para dev | fix/oab-always-on-20260915; novo PR para dev após validação |
| Congelamento depois do PR | PR26 preservado em a2a559d; ajuste em branch nova sem PR anterior |
| Separação de trabalho | worktree .cache/pr-oab-always-on-20260915; Agendamentos não alterado, conforme exceção expressa do usuário |
| Spec/plano/tarefas existentes | spec005 atualizada, sem duplicar funcionalidade ou criar módulo |
| KISS/DRY/YAGNI e monólito | alteração restrita à condição no adaptador existente; nenhuma dependência, serviço ou interface nova |
| Contrato e rastreabilidade | endpoint e sete campos selecionados preservados; pesquisa oficial em research.md; origem em LEG-001 |
| Autorização e privacidade | sessão, members:read, origem, CSRF, limites e auditoria preservados; credenciais privadas não versionadas |
| PostgreSQL/migrations | nenhuma alteração de schema, dados ou avaliações |
| Testes e build | código abe436d aprovado no CI35013653279: 631 testes, build/qualidade/segurança; ajuste atual não muda apps/ ou packages/ |
| Template e revisão | seções e checklist completos no PR substituto; revisão humana de integração permanece necessária antes do merge |
| Promoção | nenhuma alteração em main, nenhum merge/deploy; workflow Promotion preservado |
| Homologação OAB | T028 continua aberta; testes sintéticos não atestam credenciais remotas |
| Proteções remotas | não verificadas: ambas as APIs de rules/branches/dev e branches/dev/protection retornaram HTTP403 por limitação do plano do repositório privado |

## Limites e pendências

A revisão confirma aderência da entrega revisada às regras de código e documentação
listadas. Não confirma enforcement remoto de proteção de branches; T095 da fundação
permanece pendente. Não altera plano do GitHub, visibilidade, permissões ou configuração
remota. Também não conclui revisão humana nem homologação T028.

Renomear diretamente a origem de PR aberto o encerra, segundo a documentação oficial:
https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-branches-in-your-repository/renaming-a-branch
Para preservar o histórico e o congelamento, a entrega usa a branch fix e PR substituto;
a referência anterior permanece disponível. Nenhum histórico é reescrito.

## Verificações locais desta revisão

- git check-ref-format aprovou fix/oab-always-on-20260915.
- git diff a2a559d -- apps packages vazio; árvores Git de apps/packages idênticas
  a abe436d, cujo CI completo foi aprovado. Não houve alteração de comportamento.
- git diff dev -- .github/workflows/ci.yml vazio: workflow restaurado integralmente.
- Prettier do workflow e git diff --check aprovados.
- infra/github/test-rulesets.ps1: dez cenários aprovados, com GitHub simulado;
  essa suíte não comprova configuração das proteções remotas.
- CI de aplicação reutilizado: https://github.com/Komunick/caabnovo/actions/runs/35013653279.
  Novos checks de push/PR serão iniciados pelo fluxo normal, sem bypass.
