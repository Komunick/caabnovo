# Inventário de worktrees e divisão do trabalho — 02/10/2026

Autoria: CODEX. Solicitante não verificado: consulta autenticada desta sessão retornou HTTP 401.
Escopo: análise e divisão em três frentes para outras instâncias de terminal; sem execução das
frentes.

## Evidência e limites

Inventário das dez pastas registradas no Git, confrontado com as pastas diretas de .cache que contêm
.git. Conferidos HEAD, branch, índice, alterações rastreadas/não rastreadas, caminhos ignorados,
divergência e integração de entregas. Revisão dirigida dos diffs, contratos, tarefas e checkpoints;
não equivale a revisão linha por linha de todo o código nem a homologação. Fetch confirmado: dev e
origin/dev em 748539d, sem divergência. Nenhum PR aberto na consulta GitHub. Nenhuma alteração
staged nas dez pastas.

Contagens abaixo são anteriores à gravação deste relatório; ignorados não entram na contagem. Avisos
de acesso ao runtime reports-pdf-review-runtime e links quebrados de dependências limitaram a
enumeração interna de ignorados. Credenciais, bancos e conteúdo de runtimes não foram inspecionados.

| Pasta (relativa à principal)                 | HEAD    | Rastreado alterado | Não rastreado | Interpretação                                                     |
| -------------------------------------------- | ------- | -----------------: | ------------: | ----------------------------------------------------------------- |
| (principal)                                  | 748539d |                  0 |             4 | dev sincronizada; quatro documentos locais, sem código modificado |
| /.cache/pr-40-security-20260930              | cffb173 |                  0 |             0 | Relatórios integrado; árvore idêntica à dev atual                 |
| /.cache/pr-access-export-foundation-20260921 | 71a6602 |                  0 |             0 | Colaboradores integrado no PR37                                   |
| /.cache/pr-design-guide-20260922             | ab643a5 |                  0 |             0 | Guia com commits preservados; PR38 fechado sem integração         |
| /.cache/pr-docs-roles-20260923               | 89d2356 |                 20 |             0 | Consolidação documental local; dois commits atrás de dev          |
| /.cache/pr-jira-confluence-20261001          | 748539d |                  5 |            61 | Organização Jira e auditoria documental local                     |
| /.cache/pr-project-clarify-20260921          | c63786b |                  0 |             0 | Planejamento integrado no PR35                                    |
| /.cache/pr-scheduling-research-20260923      | 500f84f |                 55 |            89 | Implementação local extensa de Agendamentos, ainda não integrada  |
| /.cache/pr-single-collaborator-role-20260922 | 21b5bc6 |                  0 |             0 | Cargo único integrado no PR39                                     |
| /.cache/preview-latest                       | 2515ef3 |                  0 |             0 | Preview histórico; não usar como base de entrega                  |

A principal contém AGENTS.md, docs/agentcache.md, docs/caab-design.md e
docs/runbooks/local-workspace.md não rastreados. Código versionado limpo não significa pasta
inteiramente limpa. Histórico de squash explica divergências: árvores de cffb173 e 748539d iguais;
71a6602 e 3907248 iguais; 21b5bc6 e 89d2356 iguais; c63786b e 63b36e7 iguais. PRs35/37/39/40
confirmados integrados. Não reaplicar commits antigos pela contagem de ahead.

## Andamento corrigido

Agendamentos é a maior entrega funcional local: 55 arquivos rastreados alterados e 89 não
rastreados, incluindo código, testes e evidências. Há implementação de permissões, sobreposição,
aprovação/remarcação, faltas/contestações e exportações; não tratar esses recortes como
inexistentes. O checkpoint de 02/10 registra conciliação com Relatórios e dependências já integrados
e T089 de entrega real de e-mails como próximos passos. Validações anteriores não comprovam a versão
reconciliada com dev.

Relatórios já tem implementação integrada pelo PR40. Exportar o conjunto completo de dados em
Relatórios (CAAB-24) precisa ser confrontado com seus recortes, não reiniciado: Exportar análise
detalhada sem agrupamento (CAAB-43) está em QA; Exportar detalhe agrupado, resumo e evolução sem os
limites antigos (CAAB-44) constitui o recorte restante a conferir/implementar.

Cargos e navegação também têm base integrada. Gerenciar cargos e acessos de Administrador, Gestor e
Colaborador (CAAB-19) conserva decisão pendente para contas sem cargo. Restringir criação de contas
ao fluxo administrativo (CAAB-18) e Mostrar apenas funções autorizadas na navegação (CAAB-20) estão
em QA. Não abrir uma frente de reconstrução de acessos já entregues.

Conciliar a documentação do projeto (CAAB-38) tem trabalho real preservado: 20 alterações na entrega
documental, mais cinco alterações e 61 arquivos novos na entrega Jira. O guia do PR38 também precisa
de conciliação; fechamento do PR não comprova integração.

O quadro tem 11 itens Em Desenvolvimento e quatro em QA na auditoria desta sessão. Os 11 incluem o
épico Agendamentos (CAAB-37), cinco filhos de Agendamentos e dois registros históricos:
Implementação (CAAB-4) e UI e UX (CAAB-5). Portanto não são 11 implementações independentes. A
preferência atual é simultaneidade em três frentes, com prioridade máxima de Agendamentos.

## Três frentes simultâneas propostas

1. **Agendamentos — prioridade máxima.** Reutilizar .cache/pr-scheduling-research-20260923.
   Preservar todo o trabalho local; conciliar a base; conferir os critérios e completar somente
   lacunas de Impedir sobreposição de agendamentos da mesma pessoa (CAAB-26), Sinalizar reservas de
   pessoa bloqueada sem cancelá-las (CAAB-27), Separar consulta e alteração em Agendamentos
   (CAAB-28), Operar aprovação, remarcação e recuperação de atendimentos (CAAB-40) e Tratar faltas,
   justificativas e contestações (CAAB-41). Integrar Entregar os avisos operacionais de Agendamentos
   por e-mail (CAAB-42), com a dependência mínima de Serviço de e-mail transacional e definição da
   caixa de entrada (CAAB-2). Validar a versão conciliada. App/site e WAHA não entram por
   inferência.
2. **Relatórios e exportações.** Nova branch/worktree a partir de dev, a preparar pela respectiva
   instância; a branch anterior tem PR integrado e não deve ser reutilizada. Conferir aceite e
   pendências de Exportar o conjunto completo de dados em Relatórios (CAAB-24), fechar a validação
   técnica de Exportar análise detalhada sem agrupamento (CAAB-43) e trabalhar o recorte de Exportar
   detalhe agrupado, resumo e evolução sem os limites antigos (CAAB-44), sem refazer adaptadores já
   integrados. Preservar a fundação de Disponibilizar motor compartilhado de download direto
   (CAAB-22). Homologação humana continua distinta da validação técnica.
3. **Documentação e fechamento de acessos.** Reutilizar .cache/pr-docs-roles-20260923 como entrega
   de consolidação, preservando suas 20 alterações antes de atualizar a base. Conciliar as fontes da
   entrega Jira e do guia de design em Conciliar a documentação do projeto (CAAB-38). Conferir
   código/evidências de Gerenciar cargos e acessos de Administrador, Gestor e Colaborador (CAAB-19),
   Restringir criação de contas ao fluxo administrativo (CAAB-18) e Mostrar apenas funções
   autorizadas na navegação (CAAB-20). Documentar a decisão ainda necessária para contas sem cargo e
   preparar aceite; não inventar a regra. Esta frente pode avançar na documentação enquanto essa
   decisão estiver pendente.

As três instâncias são abertas pelo usuário. Este assistente não ocupa uma dessas frentes. Esta
divisão substitui a recomendação anterior de reduzir simultaneidade. Não foram criadas worktrees,
iniciados serviços, alterados tickets, executadas implementações, feitos commits ou PRs.

## Coordenação necessária

- Agendamentos é responsável pelas mudanças de modelo de reservas, migrations locais0031–0034 e
  permissão scheduling:review_absences. Outras frentes não devem criar migrations com esses números.
- Relatórios coordena o motor compartilhado de exportação. Na conciliação de runtime.ts, preservar
  usersExport, reportExports da dev e schedulingExports local; não substituir um registro pelo
  outro. Conferir também export-screen.tsx e packages/db/src/repositories/reports.ts, atingidos
  pelos dois recortes. Agendamentos fornece suas mudanças de consulta/modelo para a compatibilidade.
- A frente documental consolida MODULES/PRD/STACK/TOOLING, que se sobrepõem nas duas entregas.
  Agendamentos e Relatórios mantêm suas specs/evidências locais e comunicam o estado à consolidação.
  Não copiar documentos inteiros de uma base antiga por cima da versão atual.
- Preservar as demais worktrees e ignorados. A ausência de mudanças locais não autoriza excluí-los.
- Ordem de prioridade para resolver dependências: Agendamentos primeiro; as outras duas frentes
  continuam simultaneamente nas partes independentes.

## Verificação desta análise

Inventário Git e integração remota conferidos; não foram executados testes da aplicação. Evidências
históricas foram usadas como histórico, sem declarar novos testes ou aceite.
