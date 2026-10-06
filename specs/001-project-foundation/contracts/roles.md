# Cargos e autoridade de concessão — decisão de 21/09/2026

Estado: decisão de produto e desenho para implementação; nenhuma conta, cargo ou permissão foi
alterada no banco nesta etapa. Segundo o usuário, hoje existe apenas Administrador; não houve
auditoria de contas.

| Cargo                              | Uso do painel                                                                                                                                                                | Concessão                                                                                                                                                                                        |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Administrador (`administrator`)    | Todas as permissões concretas dos módulos disponíveis, inclusive novos módulos ao entrarem no catálogo e exportação geral.                                                   | Pode atribuir cargos e permissões a qualquer colaborador.                                                                                                                                        |
| Gestor (`manager`, novo)           | Consulta a todos os módulos, exportação geral e acesso completo a Relatórios; alterações nos demais módulos somente quando recebidas. Pode administrar acessos de terceiros. | Pode conceder acessos de qualquer módulo, inclusive alterações que não possui; nunca altera os próprios acessos ou cargo. Não atribui cargos nem transforma Colaborador em Gestor/Administrador. |
| Colaborador (`collaborator`, novo) | Somente módulos/ações concedidos.                                                                                                                                            | Não concede cargos nem permissões, mesmo que o cliente envie chaves de gestão.                                                                                                                   |

## Resolução e limites

- Calcular autoridade no PostgreSQL com conta/sessão e vínculo de cargo ativos e vigentes. O cargo
  Administrador válido fornece o conjunto completo do catálogo; seleção individual vazia ou parcial
  não o reduz. Permissão desconhecida continua negada: não usar wildcard nem pular guardas de
  domínio.
- Novas permissões de funções disponibilizadas entram automaticamente no conjunto do Administrador.
  Isso resolve a primeira concessão de Agendamentos. Não ativa módulos futuros suspensos, envio real
  de Mensagens, nem cria exportação da Consulta OAB.
- Gestor recebe por cargo consulta a todos os módulos, exportação geral e todas as ações de
  Relatórios, inclusive novas capacidades correspondentes ao entrarem no catálogo. Seleção
  individual não retira essa base enquanto o cargo estiver vigente. Nos demais módulos,
  edição/publicação/cancelamento e outras mutações exigem concessão adicional; concedê-las a
  terceiro não as concede ao próprio Gestor. Não permite delegar gestão de cargos/acessos a um
  Colaborador.
- Separar a capacidade concreta `access:manage` da atribuição de cargos `roles:grant/revoke`.
  Administrador e Gestor ativos possuem a primeira; somente Administrador atribui cargos. As guardas
  verificam também o cargo vigente, impedindo que arrays legados com chaves de gestão promovam um
  Colaborador.
- Gestor consulta Colaboradores e exporta os campos autorizados por sua leitura, usa a interface de
  acessos existente e não recebe outras mutações de Colaboradores automaticamente. Segredos,
  utilidades pessoais de outra pessoa e dados fora da projeção autorizada continuam protegidos.
- Classificar operações por finalidade; não inferir consulta apenas pelo sufixo da chave. Em módulos
  com chave unificada, como messages:access, adequar guardas/contratos para consulta do Gestor sem
  liberar preparação/edição implicitamente. Coordenar com009 e seu gate M016, sem ativar envio real.
- Gestor não altera a própria configuração, nem indiretamente por cargo/papel compartilhado,
  chamadas diretas ou autoconcessão. Não pode reduzir o conjunto obrigatório de um Administrador.
- Ao perder o cargo Administrador/Gestor, a autoridade exclusiva desse cargo cessa na próxima ação;
  não materializar privilégios permanentes em `user_access`. Continuam a validade/revogação dos
  vínculos, controle de versão, confirmação, auditoria e proteção do último Administrador. Gestor
  não conta como último Administrador.
- Restrições de titularidade de utilidades pessoais, integridade de domínio, conta desativada e
  sessão inválida continuam aplicáveis. Ter todas as funções não torna ações inválidas válidas.

## Transição

A migration0025 implementada continua convertendo as chaves antigas de exportação. A0026 inclui os
dois novos cargos e a resolução acima, corrige a view e remove a concessão editorial indiscriminada.
Não atribuir novos cargos a contas por inferência, não criar contas e não reutilizar
`is_administrative` de forma que Gestor ganhe autoridade de Administrador. Numeração0025/0026
validada no CI. A decisão I1 substitui a regra anterior de não conceder novas permissões ao
Administrador: acesso total decorre do cargo, separado da conversão Q4. Gestor também recebe
exportação pela base de seu cargo, conforme complemento explícito do usuário. Para Colaborador, Q4
não cria exportação sem concessão anterior.

## Aceite

1. Administrador com configuração individual vazia/parcial usa todas as funções disponíveis;
   cadastrar uma nova permissão no catálogo de teste a disponibiliza sem autoconcessão manual.
2. Administrador atribui cada um dos três cargos e acessos a contas de teste; preserva a proteção do
   último Administrador e auditoria.
3. Gestor consulta todos os módulos, exporta todas as fontes autorizadas e executa todas as funções
   de Relatórios. Sem edição de Associados, concede essa edição a outro Colaborador; o destinatário
   edita e o Gestor continua apenas consultando/exportando Associados. Testar a base do cargo com
   override vazio e novo módulo de teste; Consulta OAB permanece sem exportação.
4. Gestor não modifica os próprios acessos/cargo por UI/API, não atribui Administrador/Gestor e não
   repassa chaves de gestão como se fossem permissões de um módulo.
5. Colaborador usa somente o concedido e não altera acessos de ninguém; testar requisições forjadas
   e chaves legadas.
6. Revogação/término do cargo, desativação ou sessão inválida removem a autoridade; testar
   concorrência e efeitos após locks. Conta/Sessões pessoais permanecem.

Tarefas:001 T101/T103/T114/T116,002 T105 e regressão006 T027/T028. U1 e C1 foram aprovados e
consolidados documentalmente: a autorização atual dos downloads históricos está em
[legacy-downloads.md](../../010-reports-analytics/contracts/legacy-downloads.md), e os critérios da
validação inicial com 100 registros estão em
[export-validation-100.md](../../002-integrated-modules/export-validation-100.md). Implementação do
recorte e testes de aplicação em validação final conforme
[evidências da entrega](../evidence/plan-2026-09-21-validation.md).

### Ajuste de autoridade para nova senha — 21/09/2026

Decisão mais recente do usuário: somente Administrador e Gestor podem solicitar uma nova senha para
outro colaborador. A autorização deriva do cargo (users:reset-password), nunca de concessão
individual; substitui a restrição inicial desta ampliação a apenas Administrador. Não exige
users:create/users:update/roles:grant para esta ação. Gestor não redefine senha de Administrador;
autogeração usa as Configurações pessoais. A conta destinatária precisa estar ativa. A geração
inicial continua em endpoint próprio.

## Cargo único — decisão de22/09/2026

roleIds na criação aceita zero ou um identificador; mais de um resulta422. Com a decisão de
05/10/2026 registrada ao final, zero cargos informados aplica Colaborador; não significa criar conta
sem cargo. A implementação desse padrão pertence ao PR #45. Conceder um cargo durante a validade de
outro retorna409 USER_ROLE_CONFLICT; repetição do mesmo cargo mantém ROLE_ALREADY_ASSIGNED. Revogar
antes de trocar, preservando proteção do último Administrador e autorização atual. Não há soma de
cargos. Intervalos consecutivos/expirados são históricos válidos; não sobrepor intervalos não
revogados. Migration0030 normaliza duplicidades com prioridade Administrador, Gestor, Colaborador,
depois legado; preserva user_access, linhas de atribuição e eventos anteriores, acrescentando
auditoria de sistema às revogações automáticas.

## Cargo base — decisão de 05/10/2026

Colaborador é o cargo base. A decisão do usuário em 05/10/2026 encerra P01/AC-T005 e a dúvida de
23/09, mantida ao final somente como histórico. Cadastro sem cargo informado aplica Colaborador;
"Sem cargo" deixa de ser uma escolha de cadastro. A transição das contas existentes ocorre pela
migration 0035, preservando acessos, e não impede revogar posteriormente o único cargo. Substitui a
regra de não atribuir cargos existentes por inferência somente no recorte explicitamente definido.

- **Contas novas:** `roleIds` vazio ou ausente cria a conta com Colaborador, vigente desde a criação
  e sem término. Cargo informado continua valendo e não recebe o cargo base junto (cargo único). O
  padrão é aplicado pelo sistema e não exige `roles:grant` de quem cria a conta; o autor do cadastro
  consta como quem concedeu. A auditoria `user.created` registra `baseRoleApplied`. O formulário
  pré-seleciona Colaborador e não oferece "Sem cargo"; o seletor continua visível só a quem pode
  atribuir cargos.
- **Contas existentes:** a migration 0035 concede Colaborador a toda conta sem cargo em vigor (cargo
  expirado, revogado ou nunca atribuído), exceto contas cuja exclusão já entrou em vigor. Cargo
  futuro já concedido é preservado: o cargo base termina onde ele começa. Contas desativadas, mas
  não excluídas, recebem o cargo.
- **Sem acesso novo:** o cargo base não pode ter permissões próprias. A migration recusa-se a rodar,
  e `createUser` recusa o cadastro com `BASE_ROLE_UNAVAILABLE` (409), se Colaborador estiver
  ausente, inativo, administrativo ou com permissões. `user_access` não é alterado e a permissão
  efetiva de cada conta permanece idêntica.
- **Autoria do sistema:** `user_role.granted_by` passa a aceitar nulo quando
  `grant_origin='system'`, como a revogação automática da migration 0030; não há usuário fictício.
  Concessão pela web exige `granted_by`. Cada concessão da migration gera evento `user.role.granted`
  com identidade `system:migration:0035` e origem `system`.
- **Não muda:** revogar o único cargo continua permitido e deixa a conta sem cargo; o filtro "Sem
  cargo" da lista permanece para esses casos. Contas sem cargo desse tipo não são regularizadas
  novamente. Cargo único, promoção e proteção do último Administrador seguem como definidos acima.
- **Numeração:** 0035 evita as migrations 0031–0034 reservadas ao PR de Agendamentos; o runner
  aplica por nome e aceita a lacuna.

Aceite: conta nova sem cargo nasce Colaborador sem `roles:grant`; cargo explícito prevalece; cargo
base com permissões ou ausente recusa o cadastro sem criar a conta; migration cobre cada situação
acima sem alterar `user_access`, permissões efetivas ou histórico e gera auditoria de sistema;
restrição de origem recusa concessão web sem autor e de sistema com autor.

## Promoção — 22/09/2026

POST /api/v1/users/{userId}/roles/{roleId}/promote, sem corpo. Exige sessão, origem/CSRF e
Administrador com roles:grant e roles:revoke. roleId é o cargo atual esperado. Resposta204; 403 sem
autoridade;404 conta/cargo indisponível;409 cargo mudou, expirou ou não tem sucessor. Próximo cargo:
collaborator→manager→administrator; não aceitar destino arbitrário. Preservar valid_until e
user_access. Revogar e conceder com dois eventos auditáveis na mesma transação/correlação; falha de
auditoria não pode deixar a conta sem cargo.

## Histórico do cargo base — 23/09/2026, encerrado em 05/10/2026

Consolidação documental original: CODEX/mafaltti. Pedido original recebido de outra conversa, com
autoria e solicitante não verificados. Em 23/09, Colaborador estava confirmado como cargo base e o
alcance para contas existentes sem cargo aguardava definição. Esse registro é histórico e não
constitui uma pendência vigente.

Em 05/10/2026, o usuário definiu que contas novas sem cargo informado nascem Colaborador e que
contas existentes sem cargo em vigor recebem esse cargo pela migration 0035, preservando
`user_access`. A implementação e o contrato detalhado pertencem ao
[PR #45](https://github.com/Komunick/caabnovo/pull/45), HEAD `310aacd`, ainda aberto na consulta de
06/10. A decisão encerra P01/AC-T005; integração, revisão humana e aplicação em banco de uso
continuam distintas dessa definição. A revogação do único cargo continua permitida no PR #45; não
interpretar cargo base como obrigação permanente de toda conta possuir cargo.

Conciliação por CODEX/mafaltti em 06/10/2026. Ao integrar o segundo dos PRs #42/#45, preservar a
seção de decisão de 05/10 e este encerramento histórico. A ausência de conflito textual não dispensa
conferir o contrato resultante. Não aplicar migrations ou alterar contas por esta revisão
documental.
