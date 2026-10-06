# Cargo base de Colaboradores — evidência de 05/10/2026

Autoria: CLAUDE; solicitante Gabriel-Komunick (`gh api user`, 05/10/2026). Estado: publicado na
branch `feature/roles-default-collaborator-20261005`, validado no CI (PostgreSQL e navegador) em
de3dade, execução 37340177136, com security, quality e browser aprovados. Sem QA humano; a migration
não foi aplicada em banco de uso (CB06 aberto).

## Escopo

Decisão em [roles.md](../contracts/roles.md#cargo-base--decisão-de-05102026), tarefas CB01–CB06.
Arquivos de produção: `packages/db/migrations/0035_default_collaborator_role.sql`,
`packages/db/src/repositories/{roles,user-roles}.ts`, `apps/web/modules/users/user-service.ts`,
`apps/web/modules/users/ui/{role-options,user-form}.tsx`.

## Executado localmente (Windows, sem Docker)

| Verificação                                                           | Resultado            |
| --------------------------------------------------------------------- | -------------------- |
| `tsc --noEmit` em `packages/db` e `apps/web`                          | aprovado             |
| ESLint nos arquivos alterados                                         | aprovado, sem avisos |
| Prettier nos arquivos de código, testes e documentos alterados        | aprovado             |
| Unitários de `apps/web/modules/users` (inclui 5 testes novos da tela) | 17 aprovados         |
| Contratos (`--project contract`)                                      | 169 aprovados        |

## Escrito localmente e executado só no CI

- `apps/web/tests/integration/default-collaborator-migration.test.ts`: recusa com base ausente,
  inativa ou com permissões e sem efeito persistido; cobertura de conta sem cargo, com acesso
  individual, cargo expirado, só revogado, administrador vigente, cargo futuro, excluída e
  desativada; `user_access`, permissões efetivas e histórico inalterados; auditoria de sistema;
  restrição de origem.
- `apps/web/tests/integration/user-access.test.ts`: conta nova sem cargo recebe Colaborador mesmo
  sem `roles:grant`; base ausente ou com permissões recusa o cadastro sem criar a conta. Ajustado o
  teste de perfil, que passou a precisar do cargo base semeado.
- `apps/web/tests/e2e/user-administration.spec.ts`: o filtro "Sem cargo" agora cria a conta e revoga
  o cargo base para continuar tendo uma conta sem cargo.
- `packages/db/tests/migrations.test.ts`: lista de migrations inclui 0035.

Docker indisponível nesta máquina, então PostgreSQL e navegador só rodaram no CI (ver abaixo, onde
esses testes falharam antes de passar). Nenhum teste de banco foi substituído por mock.

## Primeiro CI e correções

O CI do primeiro commit (d7b9c3c, execução 37327454231) falhou. Nenhuma falha foi de produto; todas
vieram de fixtures ou de pressupostos antigos:

- Migration: a fixture criou contas `disabled` sem `deactivated_at`
  (`user_deactivation_consistent`); o terceiro teste falhou em cascata.
- `user-access`: o criador sem `roles:grant` precisava das permissões no catálogo, que a suíte
  trunca.
- `account-member-lifecycle`: o filtro "Sem cargo" usava contas criadas com `roleIds: []`, que agora
  nascem Colaborador.
- E2E `direct-exports` (linha 237): a conta criada pela API já tem cargo, então inserir Gestor por
  SQL violava `user_role_single_period`.
- `security`: aviso `braces` já presente em `dev`; resolvido trazendo o commit do PR #44 para esta
  branch.

Correções em ab63396 e b551ac8. O CI de b551ac8 (execução 37329824115) mostrou que o ajuste da
fixture de migration deixou texto SQL corrompido (`NULLNULL,NULL))`), erro de edição automática que
o Prettier e o ESLint não detectam por estar dentro de uma string; corrigido no commit seguinte.
Nesse CI, security passou e o quality falhou apenas nesse teste. O CI de b2a61d9
(execução 37331901542) e o de de3dade (execução 37340177136, que já inclui os testes de G02 e G03)
fecharam verdes nos três jobs. Quality aprovou 29 arquivos de integração, com os de migration e de
criação de conta.

## Revisão pelo guia de design

Mudança de interface restrita ao seletor de cargo inicial: um controle de rádio já existente, agora
pré-selecionado, sem a opção "Sem cargo". Mantidos rótulo, descrição associada por
`aria-describedby`, `required`, rascunho preservado e restauração do padrão ao limpar o formulário.
A posição segue a linha "funções iniciais se permitidas" do guia. Sem captura visual: não foi feita
revisão em navegador nem em 1280/390/320px.

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
  lista as migrations por igualdade exata. Quem integrar por último resolve listando `0031`–`0034` e
  depois `0035`, sem enfraquecer a asserção.

## Conciliação com dev após PR42/43 — 06/10/2026

Autoria: CODEX. Solicitante: mafaltti, login Danilo-Komunick, perfil GitHub get_profile já
consultado nesta sessão. Pedido: corrigir os conflitos do PR45, validar/publicar na mesma branch;
sem merge do PR, serviços, PostgreSQL local ou banco de uso.

Base preservada: `310aacd6d384db3a31f33071d3c4923ab46c984c`; dev recebida: `ea0bc3b`, após
integração humana de PR42/43. Merge-tree e merge local identificaram conflitos em
`packages/db/tests/migrations.test.ts`, `pnpm-workspace.yaml` e `pnpm-lock.yaml`. Resolução compõe
as migrations 0031–0036 por ordem de nome, com 0035 do cargo base e 0036 de Agendamentos, mantendo
igualdade exata da asserção. O teste de upgrade de Agendamentos também aplica 0035 entre 0034/0036;
não era conflito textual, mas precisava validar a sequência real da composição.

Dependências mantêm source-map-js 1.2.2 de dev. Comparação estrutural confirma único delta contra a
branch anterior nesse pacote/override/snapshot/referências; demais 962 entradas, configurações e
importers preservados. Código de cargo base/G02/G03 e SQL da 0035 não foram alterados. Código e
migrations de Agendamentos vêm de dev; não copiar implementação de Relatórios do PR46.

Contrato mantém a decisão de 05/10 e o encerramento histórico de 23/09, conciliados pelo PR42.
Corrigida a frase genérica "Toda conta passa a ter cargo" para explicitar cadastro/transição e a
revogação posterior já permitida, sem criar regra nova. Bloco CB agora reconhece P01/AC-T005
encerrada; CB06, AC-T006, aplicação de dados e homologação permanecem distintos. DS/AC/HIN e tarefas
originais preservados, sem reatribuir autoria das implementações anteriores.

Instalação congelada e audit aprovados: zero HIGH/CRITICAL, duas LOW e duas MODERATE. Nenhum
threshold, scanner, workflow ou asserção relaxado. Testes reais de PostgreSQL, matriz temporal, E2E
e acessibilidade da nova composição ficam no CI; os resultados de 310aacd permanecem históricos. A
versão publicada e o resultado dos seis checks serão registrados no corpo atualizado do PR45. Não
aplicar a migration em dados de uso por esta conciliação.

Conferência local da resolução: 16 arquivos de código/testes/migration próprios do PR45 continuam
idênticos a 310aacd; a lista de migrations é a exceção intencional. Código de Agendamentos e de
exportações idêntico a dev; migrations de dev e a 0035 própria preservadas. Asserção exige todas as
36 migrations por igualdade exata, e o upgrade aplica 0035 antes de 0036. Estados CB/AC/DS mantidos,
incluindo CB06/AC-T006 abertas. Três Markdown editados formatados, 26 links relativos e quatro
âncoras válidos (duas de entrada), sem destinos ausentes. URLs externas e outras formas Markdown não
auditadas integralmente. Os dois testes alterados passam no Prettier; usado o formatador existente
diretamente porque o wrapper pnpm exec não resolveu o binário nesta sessão Windows. Diff sem erros.
PostgreSQL e navegador serão comprovados pelo CI, sem substituir por mocks.
