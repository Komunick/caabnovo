# Revisão de finalidade e continuidade — 21/09/2026

A finalidade aprovada é preparar comunicados/campanhas aos associados, selecionar públicos e
programar solicitações. Conversa interna e suporte por tickets são módulos futuros separados. Esta
revisão não homologa o protótipo nem autoriza envio real.

| Aspecto                         | Evidência no código existente                                                                                                | Decisão nesta entrega                                                                                         |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Campanhas/modelos/públicos      | `packages/db/src/repositories/messaging.ts` e `modules/messaging/ui/editor.tsx` mantêm conteúdo, versão e seleção de público | Aderência técnica à finalidade; manter dados e edições                                                        |
| Programação e estados           | `processScheduledMessages` registra bloqueio por ausência de canal; solicitações não são entregues externamente              | Preservar bloqueio e não reprocessar automaticamente                                                          |
| Preferências                    | Cadastro de preferências do protótipo, sem canal real configurado                                                            | Não inferir consentimento ou criar diretório exportável                                                       |
| Consulta versus alteração       | A chave unificada `messages:access` autorizava ambas                                                                         | Manter chave para leitura e introduzir `messages:write` para mutações; Gestor não recebe esta última por base |
| Exportação específica do módulo | Adaptador e telas ainda planejados                                                                                           | Fora do recorte atual da base; não iniciar T004–T007                                                          |

Decisão de continuidade: o pedido explícito de prosseguir com o escopo autorizado de001 permite
adequar autorização do protótipo existente aos três cargos. Prosseguir somente com essa adequação
nesta entrega. A migração preserva a escrita de quem já tinha concessão explícita unificada e não a
concede à nova base do Gestor. M009/M010 e homologação funcional continuam pendentes. Testes antigos
não constituem aprovação de produto; validação atual de autorização ainda será executada. Esta
decisão não libera os adaptadores de exportação dos demais módulos.
