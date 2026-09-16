# Retenção no sistema antigo — 16/09/2026

Inspeção local somente leitura autorizada pelo usuário nesta conversa. Nenhum código
antigo foi executado, banco consultado ou rotina de exclusão reaproveitada.

Raiz examinada: `C:/Projetos/caab-caapp`, incluindo `caab-api-master`,
`mono-caapp-main`, `painel-admin`, `apps`, specs e análise documental. Pesquisa excluiu
dependências, build, mapas, Git e arquivos de ambiente. Não foram lidas credenciais.

| Evidência | Resultado | Limite |
| --- | --- | --- |
| `mono-caapp-main/packages/api/src/config/database.js` | `paranoid: true`, timestamps e exclusão lógica global no Sequelize. | Ocultar/excluir logicamente não define quando apagar ou anonimizar os bytes. |
| `mono-caapp-main/packages/api/src/models/UserLog.js` e `ScheduleLog.js` | Há `deletedAt` nos logs. | Não demonstra prazo de retenção, descarte ou preservação legal. |
| `mono-caapp-main/packages/api/src/utils/expireToken.js` | Duração de token por plataforma. | Expiração de autenticação não é política geral de dados pessoais. |
| `mono-caapp-main/packages/api/src/tasks.js` | Rotinas de mensagens, status, créditos e restrições. | Não encontrada rotina de anonimização/descarte por categoria entre as tarefas registradas. |
| `caab-analise-do-claud/docs/Mapa de Conversão para Spec Kit.md`, item 013 | O próprio levantamento informa que faltam requisitos de retenção de logs. | Documento de análise, não aprovação institucional. |

Não foi encontrada uma política completa de retenção, matriz de prazos aprovada ou
controle de preservação legal no material local examinado. Isso não prova ausência de
uma política mantida fora dessas pastas. Nenhuma duração ou regra financeira do legado
foi convertida em prazo de descarte do sistema novo. T089 permanece dependente das decisões da CAAB.
