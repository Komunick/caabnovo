# Fluxo de Entrega — Git, PRs e Deployments

Este documento define como alterações passam do desenvolvimento à produção.

## 1. Papéis das branches

- `main`: produção.
- `dev`: desenvolvimento e integração.
- `feature/*`, `fix/*`, `chore/*` e `docs/*`: branches curtas de trabalho.

Nunca realizar commits ou pushes diretos em `dev` ou `main`.

## 2. Política de merge

- Toda alteração entra por Pull Request.
- PRs de trabalho apontam para `dev`.
- Produção recebe apenas PR de promoção `dev` → `main`.
- Merge em `main` é exclusivamente humano.
- Não contornar CI, reviews ou proteções de branch.
- Preferir squash para mudanças coesas, conforme a política do repositório.

## 3. Ambientes

- Branch de feature: validação local e preview quando disponível.
- Merge em `dev`: deploy no ambiente DEV.
- Merge em `main`: deploy no ambiente PROD.

DEV e PROD devem ter bancos, storages, segredos e integrações separados.

## 4. Fluxo padrão

1. Atualizar a branch a partir de `dev`.
2. Criar branch curta com nome descritivo.
3. Implementar uma mudança coesa.
4. Adicionar ou atualizar testes e documentação.
5. Executar os gates locais possíveis.
6. Criar PR para `dev` usando o template.
7. Corrigir falhas de CI e observações da revisão.
8. Após merge, validar a implantação em DEV.
9. Quando solicitado, preparar promoção `dev` → `main`.
10. Um mantenedor humano revisa, aprova e executa o merge de produção.
11. Realizar smoke test e observar métricas após o deploy.

## 5. Gates obrigatórios

- Formatação.
- Lint.
- Typecheck.
- Testes unitários e de integração aplicáveis.
- Testes E2E dos fluxos críticos afetados.
- Build de produção.
- Migrations validadas em banco descartável ou DEV.
- Verificação de dependências e segredos.
- Testes de autorização quando uma rota, ação ou papel for alterado.
- Teste de acessibilidade quando houver mudança de UI relevante.

## 6. Regras para migrations

- Toda alteração de schema é versionada.
- Migration aplicada não deve ser reescrita; criar uma nova correção.
- Mudanças destrutivas exigem plano de migração e rollback.
- Deploy deve preservar compatibilidade durante a janela de transição.
- Backfill grande deve executar em job controlado, não bloquear o request web.
- Nunca usar dados pessoais reais em testes locais ou CI.

## 7. Mudanças sensíveis

Exigem revisão humana específica:

- Permissões e autenticação.
- Upload e processamento de arquivos.
- Dados de associados ou colaboradores.
- Regras de bloqueio.
- Agenda e prevenção de conflitos.
- Auditoria e retenção.
- Integrações com app, site, OAB ou terceiros.
- Segredos, infraestrutura e migrations destrutivas.

## 8. Responsabilidades da IA

A IA pode:

1. Criar ou atualizar branch de trabalho a partir de `dev`.
2. Implementar mudanças pequenas e revisáveis.
3. Executar lint, typecheck, testes e build.
4. Preparar migrations e documentação.
5. Abrir PR para `dev` com resumo, riscos e plano de teste.
6. Preparar PR de promoção quando solicitado.

A IA não pode:

- Fazer merge em `main`.
- Aprovar ou forçar deploy de produção.
- Ignorar CI ou proteção de branch.
- Inserir segredos no código.
- Automatizar consulta à OAB sem integração autorizada.
- Executar migration destrutiva em produção sem autorização humana explícita.

## 9. Responsabilidades humanas

- Validar regras de negócio e permissões.
- Homologar DEV.
- Aprovar mudanças sensíveis.
- Revisar e fazer merge da promoção para produção.
- Executar ou autorizar migrations críticas.
- Realizar smoke test de produção.
- Decidir rollback quando houver impacto operacional.

## 10. Template de Pull Request

```markdown
## O que mudou

## Por que

## Princípios aplicados
- KISS / DRY / YAGNI e trade-offs relevantes

## Como testar em DEV

## Permissões afetadas

## Migration, dados ou variáveis de ambiente

## Segurança e privacidade

## Evidências de UI
- Screenshots ou vídeo, quando aplicável

## Riscos e rollback
```

## 11. Promoção para produção

O PR `dev` → `main` deve conter:

- Resumo das funcionalidades e correções.
- Migrations e ordem de execução.
- Novas variáveis e integrações.
- Riscos conhecidos.
- Plano de rollback.
- Checklist de smoke test.
- Confirmação de homologação em DEV.

## 12. Rollback

- Preferir rollback da aplicação sem perda de dados.
- Migrations incompatíveis exigem estratégia expand/contract.
- Não apagar dados para simplificar rollback.
- Registrar incidente, decisão e ações executadas.
- Após estabilização, produzir correção por novo PR.

