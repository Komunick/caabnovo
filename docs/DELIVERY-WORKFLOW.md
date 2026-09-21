# Fluxo de Entrega — Git, PRs e Deployments

Este documento define como alterações passam do desenvolvimento à produção.

## 1. Papéis das branches

- `main`: produção.
- `dev`: desenvolvimento e integração.
- `feature/*`, `fix/*`, `chore/*` e `docs/*`: branches curtas de trabalho.

Nunca realizar commits ou pushes diretos em `dev` ou `main`.

Regra vigente do usuário, consolidada em 17/09/2026: manter uma única branch/worktree
por entrega. PRs abertos podem receber atualizações (correções, commits e pushes) ou
ser cancelados/fechados sem merge conforme o escopo autorizado. Abrir PR não congela
a branch. PRs já mergeados não podem ser alterados, inclusive título, descrição e
demais metadados; suas branches não podem ser reutilizadas para novas alterações.
Correções posteriores entram por nova branch e novo PR. Preservar a worktree integrada.
Isolamento adicional somente quando solicitado.
Não aprovar ou integrar PR por iniciativa do agente; checks não são aprovação humana.

## 2. Política de merge

- Toda alteração entra por Pull Request.
- PRs de trabalho apontam para `dev`.
- Cada funcionalidade nova deve ter um spec próprio em `specs/`, com plano, tarefas e critérios de
  aceite antes de sua implementação. O plano geral organiza dependências; não substitui esses specs.
- Correções, melhorias e mudanças de uma função existente atualizam seu spec, plano e tarefas; não
  criam outro spec. Antes de abrir um spec, conferir se já existe um responsável pela função.
- Antes de implementar uma função nova ou evoluí-la, analisar práticas atuais do mercado em fontes
  oficiais e registrar data, referências, decisões e limites da pesquisa no `research.md` existente.
- Reunir as alterações autorizadas na única branch ativa até o PR. Cada função mantém
  spec, plano, tarefas, testes e evidências próprios dentro dessa mesma entrega.
- Abrir o PR quando o conjunto estiver pronto para revisão. Correções posteriores usam a mesma branch enquanto o PR não estiver integrado.
- Produção recebe apenas PR de promoção `dev` → `main`.
- Merge em `main` é exclusivamente humano.
- Não contornar CI, reviews ou proteções de branch.
- Preferir squash para mudanças coesas, conforme a política do repositório.

## 3. Ambientes

- Branch de feature: validação local e preview quando disponível.
- Merge em `dev`: deploy no ambiente DEV.
- Merge em `main`: deploy no ambiente PROD.

DEV e PROD devem ter bancos, storages, segredos e integrações separados.

### Preview local — decisão de 17/09/2026

Localhost permanece desativado até ordem explícita do usuário para ligá-lo. Quando autorizado, atualizar o preview para a versão mais recente do repositório local antes de disponibilizá-lo, conferindo e registrando branch, commit e eventuais alterações locais que compõem essa versão. Não reutilizar silenciosamente build antigo; preservar banco, contas e arquivos. Essa regra não autoriza ligar serviços agora.

Quando ligado, o preview principal usa `http://localhost:3107` e os limites locais
de recursos registrados em `AGENTS.md`. Builds e E2E pesados ficam no CI quando
houver pouca memória local; testes usam bancos descartáveis.

## 4. Fluxo padrão

1. Conferir e sincronizar a pasta principal em `dev`, preservando o trabalho local.
2. Reutilizar a branch da entrega enquanto seu PR não tiver sido integrado.
3. Reunir nessa branch as alterações autorizadas, com seus respectivos specs e tarefas.
4. Adicionar ou atualizar testes e documentação.
5. Executar os gates locais possíveis.
6. Criar PR para `dev` usando o template.
7. Corrigir falhas de CI e observações da revisão na mesma branch do PR ainda aberto.
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
- Exportações seguem o [padrão obrigatório](EXPORT-STANDARD.md): Excel, CSV e PDF
  em todos os módulos/abas aplicáveis, com filtros e download direto. Conferir os
  três formatos, seleção/ordem das colunas, completude dos dados e permissões antes
  de concluir sua entrega.

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

1. Criar ou atualizar a única branch de trabalho ativa enquanto o PR não estiver integrado.
2. Implementar mudanças pequenas e revisáveis.
3. Executar lint, typecheck, testes e build.
4. Preparar migrations e documentação.
5. Abrir PR para `dev` com resumo, riscos e plano de teste.
6. Preparar PR de promoção quando solicitado.
7. Cancelar/fechar PR aberto sem merge quando autorizado pelo pedido ou escopo da entrega.

A IA não pode:

- Alterar PR já mergeado ou reutilizar sua branch para novas mudanças.
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
