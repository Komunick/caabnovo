# Registro de reaproveitamentos do sistema antigo

Regra confirmada pelo usuário em 10/09/2026: todo reaproveitamento deve registrar origem,
adaptações, validação e pontos sujeitos a mudança. Este registro acompanha a spec e a branch
da funcionalidade. Não copiar credenciais, dados pessoais ou respostas brutas para evidências.

Cada novo item deve indicar: data e motivo, fontes exatas, partes efetivamente usadas,
diferenças em relação ao legado, arquivos do novo sistema, teste executado e seus limites,
ambientes configurados e condições para revisão ou desativação.

## LEG-001 — Consulta OAB-BA / STATUS CAAB

- **Data/autorização:** 10/09/2026. O usuário pediu localizar a API do painel antigo,
  continuar sua implementação e validar uma inscrição OAB/BA indicada por ele.
- **Origem:** `C:/Projetos/caab-caapp/caab-api-master/docs/apis/api-oab-caab-guide-en.md`,
  seção STATUS CAAB; `mono-caapp-main/packages/api/src/services/apiOab.js`,
  `controllers/OabTesteController.js`, `routes/oabTeste.js` e `tasks/verifyUserStatus.js`;
  tela `apps/painel-admin/src/features/associados/ConsultaOab.tsx` no mesmo projeto anterior.
- **Reaproveitado:** contrato do endpoint OAB-BA/Implanta, parâmetros do relatório STATUS CAAB,
  nomes dos headers de autenticação, credenciais históricas desse relatório e referência
  à existência de consulta avulsa. Os arquivos de ambiente antigos consultados estavam
  com as credenciais vazias; a origem dos valores usados na validação foi o guia.
- **Idade/validação:** o guia data as credenciais de fevereiro de 2021. Foram aceitas em
  uma consulta em 10/09/2026. Depois, o usuário esclareceu que não tinha autorização
  para usar a inscrição real. Número, resultado, auditoria local dessa consulta e capturas
  foram removidos; essa inscrição não deve ser reutilizada em testes. O teste descartado
  não serve como homologação autorizada; T028 permanece pendente. Valores dos segredos
  e nome retornado não estão neste registro.
- **Adaptado:** nova implementação em TypeScript, permissões do painel atual e auditoria;
  consulta limitada a número OAB/BA, sem consulta por CPF. Normalização conservadora de
  SIM/NAO/NÃO; número retornado deve corresponder ao solicitado. JSON bruto e informações
  financeiras não são exibidos. Não há cópia da interface antiga.
- **Não adotado:** transformar falhas em lista vazia; sincronização em lote; cálculo de
  ativo/inativo a partir de aprovação, credencial e inadimplência; relatório financeiro;
  consulta por CPF, fora do escopo conforme confirmação do usuário nesta revisão.
- **Destino:** `apps/web/modules/members/oab-provider.ts`, `oab-service.ts`,
  `http/oab-route.ts`, `ui/oab-lookup.tsx`, `/members/oab` e `/api/v1/members/oab-query`.
  Contratos e detalhes em [spec 005](../specs/005-members-management/contracts/oab-query.md)
  e [evidências do legado](../specs/005-members-management/contracts/oab-legacy.md).
- **Configuração:** restrita ao servidor local; não implica configuração ou deploy em DEV
  hospedado. O `.env.example` mantém a integração desativada e os campos de segredo vazios.
- **Revisar quando:** houver troca/recusa de credenciais, mudança do endpoint/relatório,
  resposta divergente/ambígua, nova UF ou tipo de inscrição, necessidade de critérios
  institucionais ou implantação em outro ambiente. Essas extensões exigem contrato e testes
  próprios; não inferir regras a partir de campos financeiros do legado.
- **Desativação:** `OAB_API_ENABLED=false` no ambiente do servidor, com recarga/reinício
  conforme a hospedagem. Preservar auditoria e avaliações manuais existentes.

## LEG-002 — Pesquisa de ativação e bloqueio (sem cópia de regra)

- **Data/motivo:** 10/09/2026, pergunta explícita do usuário sobre o comportamento antigo.
- **Origem:** no projeto `C:/Projetos/caab-caapp/mono-caapp-main/packages/api/src/`,
  `controllers/UserBlockAdmController.js` (userBlock/userUnblock), `controllers/UserController.js`
  (update/setActivateStatus), `controllers/ScheduleController.js` (verificação USER_BLOCKED),
  `tasks/resetUserPunishment.js`, `tasks/verifyUserStatus.js` e `tasks.js`.
- **Encontrado:** bloqueio define punished=FIRST e data; registra administrador, mensagem
  e evento de bloqueio; pode enviar notificação. Desbloqueio limpa punição e registra autor,
  data e motivo. Rotina agendada diariamente prevê expiração em 30 dias (FIRST e SECOND).
  Agendamentos verificam bloqueio do associado e do titular; isso pode impedir agendamento
  do dependente sem alterar diretamente seu cadastro. Ativo/inativo é calculado separadamente
  a partir de aprovação, OAB, validade e inadimplência; ativação também percorre dependentes.
- **Limites/falhas:** inspeção de código local, sem execução ou dados reais. A verificação
  de bloqueio em ScheduleController depende da ausência do header platform e lê objetos da
  requisição; não comprova imposição uniforme no servidor. Prevenção de bloqueio duplicado
  está comentada. Não adotar esses atalhos nem inferir restrição financeira universal.
- **Uso no novo painel:** pesquisa para comparação e decisão de escopo, sem copiar código,
  prazo de 30 dias, propagação a dependentes, notificações ou regras financeiras. Proposta
  atual: transições manuais auditadas e situação disponível no contrato de leitura.
  Usuário confirmou desbloqueio manual e registro da integração futura com Agenda para
  impedir novos agendamentos do associado/dependentes; prazo automático não será adotado.
- **Revisão necessária:** confirmar duração, alcance por finalidade, comportamento de
  dependentes e autorização antes de implementar automações ou integrar consumidores.
- **Ambientes:** nenhuma alteração no legado, nenhuma chamada externa e nenhum deploy.

## Relação com a orientação anterior

Os documentos de direção do produto de 09/09 restringiam a consulta ao legado. A solicitação
explícita posterior do usuário autorizou a investigação e o uso desta integração OAB.
Este registro documenta essa exceção concreta e exige rastreabilidade; não transforma
o sistema antigo em referência automática para regras ou arquitetura dos demais módulos.
