# Evidência local — Auditoria e Processamentos

Data: 09/09/2026. Branch `feature/product-direction`. Funcionalidade concluída localmente; a entrega
integrada de todos os módulos continua em andamento. PR próprio autorizado em 09/09/2026; sem merge
ou alteração de main.

## Resultado

- Menu, busca e dashboard compartilham catálogo e mostram uma única área Auditoria.
- Eventos e Processamentos possuem navegação conforme permissões.
- Operador só de jobs entra em /audit/jobs; eventos/API de auditoria continuam negados.
- Auditor sem jobs:read não acessa lista/detalhe/API de jobs e mantém sua exportação autorizada.
- URLs anteriores redirecionam; registros, serviços, APIs e persistência reutilizados.
- Reenvio autorizado funciona com justificativa; nenhum papel foi ampliado para a fusão.

## Verificações

- Formatação, lint, typecheck e build de produção: passaram.
- Unitários: 34 passaram, incluindo seis cenários do catálogo.
- Contratos: 16 passaram.
- E2E Chromium afetados: 13 cenários únicos verificados. Na primeira execução, 12 passaram e o teste
  de tema/navegação excedeu os 5s de espera de login durante build concorrente. Log registrou login
  200 e renderizações de dashboard acima desse limite. Após o build, repetiu-se somente
  workspace-experience.spec.ts: seus dois testes passaram, sem mudança de código.
- Cobertura: acessibilidade automatizada, teclado/mobile, quatro perfis, negações em APIs,
  compatibilidade de URLs, reenvio e exportação. Sem repetição manual pelo Chrome do PR #10.
- Links relativos dos specs e git diff --check: passaram.
- Preparação do PR na branch isolada `feature/audit-operations`, sobre dev `284f867`: formatação,
  lint, typecheck, 50 testes unitários/contratuais e build passaram novamente. A implementação de
  Notícias e suas dependências/migrations não fazem parte desta branch. Não repetida a validação
  manual.

## Limites

A evidência comprova a fusão, não os módulos planejados. Paginação/filtros de jobs e pré-condição de
leitura antes do reenvio são melhorias pendentes na US3 deste mesmo spec. A lista atual ainda mostra
somente as 100 execuções recentes. Produção mantém pendências T089/T095. Não foi repetida a
integração de banco: esta função não altera migrations nem serviços de persistência; contratos e E2E
verificaram os fluxos reutilizados.
