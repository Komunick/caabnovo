# Cargos e autoridade de concessão — decisão de 21/09/2026

Estado: decisão de produto e desenho para implementação; nenhuma conta, cargo ou permissão foi alterada no banco nesta etapa. Segundo o usuário, hoje existe apenas Administrador; não houve auditoria de contas.

| Cargo | Uso do painel | Concessão |
| --- | --- | --- |
| Administrador (`administrator`) | Todas as permissões concretas dos módulos disponíveis, inclusive novos módulos ao entrarem no catálogo e exportação geral. | Pode atribuir cargos e permissões a qualquer colaborador. |
| Gestor (`manager`, novo) | Consulta a todos os módulos, exportação geral e acesso completo a Relatórios; alterações nos demais módulos somente quando recebidas. Pode administrar acessos de terceiros. | Pode conceder acessos de qualquer módulo, inclusive alterações que não possui; nunca altera os próprios acessos ou cargo. Não atribui cargos nem transforma Colaborador em Gestor/Administrador. |
| Colaborador (`collaborator`, novo) | Somente módulos/ações concedidos. | Não concede cargos nem permissões, mesmo que o cliente envie chaves de gestão. |

## Resolução e limites

- Calcular autoridade no PostgreSQL com conta/sessão e vínculo de cargo ativos e vigentes. O cargo Administrador válido fornece o conjunto completo do catálogo; seleção individual vazia ou parcial não o reduz. Permissão desconhecida continua negada: não usar wildcard nem pular guardas de domínio.
- Novas permissões de funções disponibilizadas entram automaticamente no conjunto do Administrador. Isso resolve a primeira concessão de Agendamentos. Não ativa módulos futuros suspensos, envio real de Mensagens, nem cria exportação da Consulta OAB.
- Gestor recebe por cargo consulta a todos os módulos, exportação geral e todas as ações de Relatórios, inclusive novas capacidades correspondentes ao entrarem no catálogo. Seleção individual não retira essa base enquanto o cargo estiver vigente. Nos demais módulos, edição/publicação/cancelamento e outras mutações exigem concessão adicional; concedê-las a terceiro não as concede ao próprio Gestor. Não permite delegar gestão de cargos/acessos a um Colaborador.
- Separar a capacidade concreta `access:manage` da atribuição de cargos `roles:grant/revoke`. Administrador e Gestor ativos possuem a primeira; somente Administrador atribui cargos. As guardas verificam também o cargo vigente, impedindo que arrays legados com chaves de gestão promovam um Colaborador.
- Gestor consulta Colaboradores e exporta os campos autorizados por sua leitura, usa a interface de acessos existente e não recebe outras mutações de Colaboradores automaticamente. Segredos, utilidades pessoais de outra pessoa e dados fora da projeção autorizada continuam protegidos.
- Classificar operações por finalidade; não inferir consulta apenas pelo sufixo da chave. Em módulos com chave unificada, como messages:access, adequar guardas/contratos para consulta do Gestor sem liberar preparação/edição implicitamente. Coordenar com009 e seu gate M016, sem ativar envio real.
- Gestor não altera a própria configuração, nem indiretamente por cargo/papel compartilhado, chamadas diretas ou autoconcessão. Não pode reduzir o conjunto obrigatório de um Administrador.
- Ao perder o cargo Administrador/Gestor, a autoridade exclusiva desse cargo cessa na próxima ação; não materializar privilégios permanentes em `user_access`. Continuam a validade/revogação dos vínculos, controle de versão, confirmação, auditoria e proteção do último Administrador. Gestor não conta como último Administrador.
- Restrições de titularidade de utilidades pessoais, integridade de domínio, conta desativada e sessão inválida continuam aplicáveis. Ter todas as funções não torna ações inválidas válidas.

## Transição

A migration planejada0025 continua convertendo as chaves antigas de exportação. A0026 inclui os dois novos cargos e a resolução acima, corrige a view e remove a concessão editorial indiscriminada. Não atribuir novos cargos a contas por inferência, não criar contas e não reutilizar `is_administrative` de forma que Gestor ganhe autoridade de Administrador. Conferir numeração antes de implementar. A decisão I1 substitui a regra anterior de não conceder novas permissões ao Administrador: acesso total decorre do cargo, separado da conversão Q4. Gestor também recebe exportação pela base de seu cargo, conforme complemento explícito do usuário. Para Colaborador, Q4 não cria exportação sem concessão anterior.

## Aceite

1. Administrador com configuração individual vazia/parcial usa todas as funções disponíveis; cadastrar uma nova permissão no catálogo de teste a disponibiliza sem autoconcessão manual.
2. Administrador atribui cada um dos três cargos e acessos a contas de teste; preserva a proteção do último Administrador e auditoria.
3. Gestor consulta todos os módulos, exporta todas as fontes autorizadas e executa todas as funções de Relatórios. Sem edição de Associados, concede essa edição a outro Colaborador; o destinatário edita e o Gestor continua apenas consultando/exportando Associados. Testar a base do cargo com override vazio e novo módulo de teste; Consulta OAB permanece sem exportação.
4. Gestor não modifica os próprios acessos/cargo por UI/API, não atribui Administrador/Gestor e não repassa chaves de gestão como se fossem permissões de um módulo.
5. Colaborador usa somente o concedido e não altera acessos de ninguém; testar requisições forjadas e chaves legadas.
6. Revogação/término do cargo, desativação ou sessão inválida removem a autoridade; testar concorrência e efeitos após locks. Conta/Sessões pessoais permanecem.

Tarefas:001 T101/T103/T114/T116,002 T105 e regressão006 T027/T028. U1 e C1 foram aprovados e consolidados documentalmente: a autorização atual dos downloads históricos está em [legacy-downloads.md](../../010-reports-analytics/contracts/legacy-downloads.md), e os critérios da validação inicial com 100 registros estão em [export-validation-100.md](../../002-integrated-modules/export-validation-100.md). Implementação e testes de aplicação permanecem pendentes.
