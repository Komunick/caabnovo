# Cargo base de Colaboradores — evidência de 05/10/2026

Autoria: CLAUDE; solicitante Gabriel-Komunick (`gh api user`, 05/10/2026). Estado: implementado na
worktree, **ainda não publicado nem validado em PostgreSQL ou navegador**.

## Escopo

Decisão em [roles.md](../contracts/roles.md#cargo-base--decisão-de-05102026), tarefas CB01–CB06.
Arquivos de produção: `packages/db/migrations/0035_default_collaborator_role.sql`,
`packages/db/src/repositories/{roles,user-roles}.ts`, `apps/web/modules/users/user-service.ts`,
`apps/web/modules/users/ui/{role-options,user-form}.tsx`.

## Executado localmente (Windows, sem Docker)

| Verificação                                                                | Resultado                                |
| -------------------------------------------------------------------------- | ---------------------------------------- |
| `tsc --noEmit` em `packages/db` e `apps/web`                               | aprovado                                 |
| ESLint nos arquivos alterados                                              | aprovado, sem avisos                     |
| Prettier nos arquivos de código, testes e documentos alterados             | aprovado                                 |
| Unitários de `apps/web/modules/users` (inclui 5 testes novos da tela)      | 17 aprovados                             |
| Contratos (`--project contract`)                                           | 169 aprovados                            |

## Escrito e não executado

- `apps/web/tests/integration/default-collaborator-migration.test.ts`: recusa com base ausente,
  inativa ou com permissões e sem efeito persistido; cobertura de conta sem cargo, com acesso
  individual, cargo expirado, só revogado, administrador vigente, cargo futuro, excluída e
  desativada; `user_access`, permissões efetivas e histórico inalterados; auditoria de sistema;
  restrição de origem.
- `apps/web/tests/integration/user-access.test.ts`: conta nova sem cargo recebe Colaborador mesmo
  sem `roles:grant`; base ausente ou com permissões recusa o cadastro sem criar a conta.
  Ajustado o teste de perfil, que passou a precisar do cargo base semeado.
- `apps/web/tests/e2e/user-administration.spec.ts`: o filtro "Sem cargo" agora cria a conta e
  revoga o cargo base para continuar tendo uma conta sem cargo.
- `packages/db/tests/migrations.test.ts`: lista de migrations inclui 0035.

Docker indisponível nesta máquina; PostgreSQL e navegador ficam para o CI. Nenhum teste de banco foi
substituído por mock.

## Revisão pelo guia de design

Mudança de interface restrita ao seletor de cargo inicial: um controle de rádio já existente, agora
pré-selecionado, sem a opção "Sem cargo". Mantidos rótulo, descrição associada por `aria-describedby`,
`required`, rascunho preservado e restauração do padrão ao limpar o formulário. A posição segue a
linha "funções iniciais se permitidas" do guia. Sem captura visual: não foi feita revisão em
navegador nem em 1280/390/320px.

## Limites e pontos para decisão

- Nenhuma migration foi aplicada em banco de uso. CB06 exige conferir as contas sem cargo e que
  Colaborador não tenha permissões nesse banco; a migration aborta se tiver.
- Revogar o único cargo de uma conta ainda a deixa sem cargo; a regra não cobre esse caminho.
- Contas desativadas (não excluídas) recebem o cargo; contas com exclusão já em vigor não.
- Numeração 0035 pressupõe a integração do PR de Agendamentos (0031–0034) sem conflito de nome.
- Conciliação conferida por simulação de merge (`git merge-tree`), sem escrever em nenhuma branch:
  com o PR #42 não há conflito (a seção do cargo base fica antes de "Promoção", longe do fim onde o
  #42 escreve, e declara encerrada a pendência de 23/09/2026 dele); com o PR #43 e com a branch de
  fechamento de Agendamentos há conflito inevitável em `packages/db/tests/migrations.test.ts`, que
  lista as migrations por igualdade exata. Quem integrar por último resolve listando
  `0031`–`0034` e depois `0035`, sem enfraquecer a asserção.
