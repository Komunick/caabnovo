# Módulos e responsabilidades — entrega integrada

Atualizado em 09/09/2026 por orientação do responsável: incluir todos os módulos no escopo da mesma
entrega, reaproveitar a fundação e fundir Operações com Auditoria. Melhorias posteriores não
dispensam integridade dos dados, autorização e uma jornada funcional verificável na primeira versão.

Cada funcionalidade nova tem spec, plano e tarefas próprios, ligados ao
[planejamento geral](../specs/002-integrated-modules/plan.md). A primeira implementação é
[Auditoria e Processamentos](../specs/003-audit-operations/spec.md). Essa separação organiza o
trabalho; não cria PRs preliminares ou um PR apenas de documentação.

## Comparação com a implementação atual

Inventário do projeto novo em `dev` após o PR #10 (`284f867`), obtido de rotas, módulos e migrations
deste repositório. Não foram consultados código, telas ou contratos do sistema antigo.

| Capacidade atual                        | Evidência no projeto novo                                                                    | Destino / decisão                                              | O que ainda precisa ser construído                                                                                                               |
| --------------------------------------- | -------------------------------------------------------------------------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Login, MFA e sessão                     | `modules/auth`, rotas `/login`, `/mfa`, `/sessions`                                          | Reutilizar em Equipe e acesso; sessões continuam pessoais.     | Recuperação de acesso e jornadas externas conforme requisitos. Não criar outro login por módulo.                                                 |
| Contas, funções e permissões            | `modules/users`, `/users`, tabelas `user`, `role`, `user_role`                               | Reutilizar em Equipe e acesso.                                 | Cadastro de colaboradores e escopos institucionais. Conta não é cadastro de associado, colaborador ou parceiro.                                  |
| Consulta e exportação de eventos        | `modules/audit`, `/audit`, `/audit/exports/[jobId]`                                          | Auditoria → Eventos.                                           | Históricos contextuais dos novos domínios usando a mesma trilha.                                                                                 |
| Lista, progresso e reenvio de jobs      | `modules/jobs`, `/operations/jobs`, `job_execution`                                          | Fundir na navegação: Auditoria → Processamentos.               | Novos tipos de job por domínio. Não criar outra central de jobs nem transformar eventos imutáveis em execuções editáveis.                        |
| Upload, quarentena e acesso a arquivos  | `modules/files`, `stored_file`, APIs `/api/v1/files`                                         | Serviço compartilhado usado por conteúdo, pessoas e parceiros. | Experiência de mídia/documentos e autorização por proprietário de domínio. Não duplicar storage ou tabela de arquivo por módulo.                 |
| Dashboard e navegação rápida            | Página inicial, `AuthorizedNav`, `WorkspaceControls`                                         | Meu trabalho, com entradas únicas por módulo.                  | Pendências reais de cada domínio. Não contar Eventos e Processamentos como módulos independentes.                                                |
| Filas, idempotência e worker            | `apps/worker`, `job_execution`, `idempotency_record`                                         | Infraestrutura comum.                                          | Publicação, mensagens e demais tarefas específicas com seus contratos.                                                                           |
| Notícias e mídia editorial | Editor, mídia, destaques, histórico, publicação, agenda e API pública v1 em /news, spec 004 | Comunicação → Conteúdo e destaques. | Função concluída no painel; interfaces externas integram o contrato público de consulta. |
| Associados e dependentes                | Sem cadastro de domínio correspondente                                                       | Pessoas.                                                       | Cadastro, vínculo, análise documental, credencial, verificações e elegibilidade. Não reutilizar a tabela de login como cadastro de beneficiário. |
| Oferta e agendamento                    | Sem domínio correspondente                                                                   | Atendimentos.                                                  | Unidades próprias, serviços, profissionais/recursos, disponibilidade, reservas, desfechos e avaliações.                                          |
| Parceiros e benefícios                  | Sem domínio correspondente                                                                   | Benefícios.                                                    | Organizações parceiras, unidades, contratos, ofertas, condições e avaliações.                                                                    |
| Colaboradores                           | Sem cadastro de domínio correspondente                                                       | Equipe e acesso, junto das contas existentes.                  | Dados administrativos e relação opcional com conta. Não recriar usuários ou papéis.                                                              |
| Campanhas e automações de comunicação   | Sem domínio correspondente                                                                   | Comunicação → Mensagens.                                       | Públicos, modelos, prévia, agendamento e acompanhamento por canal. Reutilizar worker e jobs.                                                     |
| Caassh                                  | Sem domínio correspondente                                                                   | Créditos.                                                      | Programa configurado, contas de crédito, lançamentos, lotes e correções rastreáveis. Regras institucionais precisam ser fornecidas.              |
| Área de parceiros / solicitações por QR | Sem domínio correspondente                                                                   | Portal do parceiro.                                            | Visão externa restrita dos mesmos parceiros e solicitações. Não criar cadastro paralelo de parceiro nem presumir pagamento bancário.             |
| Relatórios de negócio                   | Há somente exportação de auditoria                                                           | Relatórios, alimentados pelos domínios existentes.             | Consultas e exportações úteis de cada área; preservar filtros, período e permissões. Não manter dados editáveis duplicados para relatórios.      |

## Organização final do escopo

| Entrada            | Subáreas e responsabilidade                                                                                                                          |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Meu trabalho       | Pendências, próximos atendimentos e falhas que o perfil pode resolver.                                                                               |
| Pessoas            | Associados, dependentes, análise documental, verificações, credencial e elegibilidade.                                                               |
| Atendimentos       | Agenda, oferta de serviços, unidades próprias, profissionais/recursos, horários, exceções, presença/falta e avaliações.                              |
| Benefícios         | Parceiros, unidades de parceiros, ofertas, categorias/tags, condições, contratos, visibilidade e avaliações.                                         |
| Comunicação        | Notícias, mídia, destaques, versões, publicação, campanhas, segmentos e mensagens automáticas.                                                       |
| Créditos           | Caassh, regras configuradas, concessões individuais/em lote, extrato, conversão e correções rastreáveis.                                             |
| Equipe e acesso    | Colaboradores, contas, funções/grupos, permissões efetivas e escopos. Sessões e recuperação integram a segurança da conta.                           |
| Auditoria          | Eventos de negócio e Processamentos, incluindo falhas, progresso, exportações e reenvios autorizados.                                                |
| Relatórios         | Visões e exportações dos mesmos registros de negócio, sem segunda fonte de verdade.                                                                  |
| Portal do parceiro | Superfície externa com escopo de organização; consulta/operação de solicitações e QR conforme regras confirmadas. Não é uma cópia do administrativo. |

Todos esses domínios integram a entrega solicitada. A ordem interna de construção segue
dependências, sem retirar módulos do escopo ou gerar PRs preliminares. Contratações, migração de
dados e alterações em produção permanecem fora desta autorização.

## Regras para evitar duplicatas

O aplicativo mobile é consumidor previsto de parte das funções, conforme orientação de
09/09/2026. Cada spec deve declarar se atende painel, site, app ou portal, e definir o contrato e
os campos necessários ao destino. Os canais são independentes: conteúdo destinado somente ao app
não deve ser exposto automaticamente no site. Disponibilização de conteúdo e notificação push
são operações distintas. O app reutiliza os dados dos domínios; não ganha cadastros paralelos nem
acesso às APIs administrativas por esse vínculo.

1. Um domínio é responsável por cada registro: associado em Pessoas, colaborador em Equipe, parceiro
   em Benefícios. Relações entre esses registros não significam cópia automática dos dados.
2. Autenticação, autorização, arquivos, fila, idempotência e auditoria são reutilizados por todos.
3. Aprovação cadastral, vínculo, regularidade OAB, situação financeira, validade da credencial e
   elegibilidade são dimensões distintas, com fonte e atualização explícitas.
4. Unidade própria de atendimento e unidade de parceiro têm responsabilidades distintas. Endereço
   semelhante não é motivo para unificá-las numa entidade institucional indistinta.
5. Avaliação referencia atendimento ou benefício; moderação preserva o teor original e registra
   motivo.
6. Mensagem transacional referencia o evento do domínio; campanha referencia conteúdo e público.
   Ambas usam a mesma infraestrutura de envio e acompanhamento.
7. O portal consulta os mesmos registros autorizados do parceiro. QR representa uma solicitação
   identificável; pagamento concluído exige confirmação específica, se essa integração existir.
8. Créditos usam lançamentos; concessão, utilização e correção não são simples edição de saldo.
9. Menus, busca rápida e dashboard devem derivar de um catálogo único das áreas disponíveis,
   evitando entradas divergentes ou repetidas. O catálogo não substitui autorização das páginas e
   APIs.

## Fusão de Operações com Auditoria

- Uma entrada principal **Auditoria** reúne **Eventos** e **Processamentos**.
- `audit:read` permite consultar eventos; `audit:export` continua necessário para exportá-los.
- `jobs:read` permite acompanhar processamentos; `jobs:redrive` continua necessário para reenviar.
- Quem só pode acompanhar jobs acessa Processamentos sem ganhar acesso aos eventos.
- Quem só pode consultar eventos não ganha acesso aos jobs nem às ações de reenvio.
- Rotas existentes podem ser preservadas como compatibilidade; não devem criar uma segunda entrada
  “Operações” no menu ou dashboard.
- Eventos, logs técnicos e execuções mantêm semântica, persistência e retenção próprias. A fusão é
  de experiência e navegação, sem apagar histórico ou fundir tabelas com responsabilidades
  diferentes.

## Limite entre escopo confirmado e regras pendentes

Incluir todos os módulos confirma sua presença na entrega, mas não inventa regras de elegibilidade,
penalidades, vínculo, documentos ou conversão de créditos. Essas decisões devem ser levantadas e
registradas durante a especificação. Integrações sem contrato podem ser desenvolvidas com
adaptadores e dados sintéticos; não podem ser apresentadas como envio real, liquidação ou
homologação externa.

Uma primeira versão funcional exige persistência, autorização, estados coerentes, histórico e
cenários de aceite executáveis. Menus vazios, números fictícios e formulários sem operação real não
concluem um módulo. Refinamentos posteriores tratam melhorias, sem adiar correções conhecidas que
comprometam essas garantias.

## Notícias — conclusão da implementação (spec 004)

Gestão editorial, imagens, destaque/ordem, histórico, prévia, publicação, retirada, agenda,
cancelamento e retry implementados usando a fundação. API v1 pública por canal e página pública
entregues. Leitura sem login por decisão expressa do usuário, revisável; gestão e rascunhos
continuam privados. App/site externos integram o contrato de consulta nos seus repositórios.
Não é necessário fornecer credencial para esta leitura; publicação não envia push.
Ver [contrato](../specs/004-news-publishing/contracts/news.md) e
[evidência](../specs/004-news-publishing/evidence.md) para gates e limites.

## Associados — incremento administrativo em validação (spec 005)

Retomada em 10/09/2026 sobre `dev` com Notícias integrada. Cadastro único, dependências históricas,
documentos privados com revisão/substituição, avaliações manuais independentes, histórico e contrato
de leitura para Caassh implementados em `/members`. O usuário confirmou permissões próprias de
consulta, edição e análise com concessão inicial apenas ao administrador existente. Cadastro de
beneficiário não cria conta de acesso. Credencial registra situação e validade; emissão verificável,
políticas institucionais e identidade mobile permanecem dependências explícitas da mesma spec.
Ver [spec](../specs/005-members-management/spec.md) e [evidências](../specs/005-members-management/evidence.md).
O usuário esclareceu em 10/09/2026 que o módulo ainda não está pronto. As verificações acima
cobrem o incremento existente; a conclusão funcional deve preceder qualquer PR.

## Revisão de sobreposição: Usuários e Colaboradores — 10/09/2026

Solicitada pelo usuário durante a retomada de Associados. No código atual existem `modules/users`,
`user`, `role`, `user_role` e `session`; não existem módulo, rotas ou migration de Colaboradores.
Portanto, não foi encontrada duplicação implementada. US6 ainda é planejamento.

| Responsabilidade | Fonte de verdade | Limite da outra área |
| --- | --- | --- |
| Conta, e-mail de login, MFA, sessões, recuperação e status do acesso | Usuários / autenticação existentes | Colaboradores referencia a conta, sem outro login ou senha. |
| Funções de acesso, concessões e permissões efetivas | Usuários e RBAC existentes | Cargo funcional não concede função de acesso automaticamente. |
| Unidade, setor, cargo e situação do vínculo funcional | Futuro domínio Colaboradores | Esses campos não devem virar campos da conta de login. |
| Associação entre colaborador e conta | Vínculo explícito entre os registros | Colaborador pode existir sem login; conta pode existir sem colaborador. Não vincular por coincidência de nome/e-mail. |

O risco de sobreposição está em implementar duas telas independentes para criar contas ou conceder
permissões. A área de navegação prevista, **Equipe e acesso**, deve reunir as jornadas de Colaboradores
e Contas e acesso; a gestão de acesso continua usando os serviços e identificadores atuais.
Não criar um segundo catálogo de papéis, uma segunda política de MFA ou um novo cadastro de login.

Nome e contato precisam ter finalidade e proprietário explícitos no desenho de US6: dados da conta
são consultados pelo vínculo; e-mail profissional não altera automaticamente o identificador de
login. O desligamento deve remover concessões derivadas do vínculo encerrado, preservando a decisão
sobre outros vínculos; desativar a conta inteira exige autorização e regra próprias.

Pendências para a spec funcional de Colaboradores: campos administrativos necessários, cardinalidade
do vínculo, matriz por unidade/setor e efeitos do desligamento. Esta revisão delimita responsabilidades;
não implementa Colaboradores nem altera o funcionamento de Usuários.
