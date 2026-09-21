# Feature Specification: Relatórios e Análises

## Checkpoint de revisão de código — 21/09/2026

Versão inicial de três abas, consultas salvas e exportadores implementada. Mantém 50 mil linhas/366 dias, fila e Excel apenas no detalhe; seleção de colunas existe, ordem segue catálogo. EX01/EX02 e DX01–DX03 permanecem. T025 cobre autorização de Agendamentos também nos resumos/arquivos; T026 cobre coleta nos consumidores externos ainda não comprovada.

Revisão estática da base `ed31baf`; nenhum teste de aplicação ou homologação nesta etapa.
Evidências e limites: [revisão transversal](../002-integrated-modules/code-audit-2026-09-21.md).

**Feature Branch**: `feature/reports-analytics-20260918`
**Created**: 2026-09-18
**Status**: Versão inicial integrada pelo PR #34; homologação em DEV não registrada.
Adequações de 21/09 à permissão geral e à exportação direta sem teto de período/registros
pendentes de implementação; evidências anteriores não validam este novo fluxo.
**Input**: Brainstorm aprovado: relatórios dos domínios, métricas dos sites/app/painel,
três abas e exportação. Todos os módulos devem futuramente oferecer baixar/exportar.

## Clarifications

### Session 2026-09-21

- Q: Quem poderá baixar/exportar dados em cada módulo? → A: Uma permissão geral de exportação, combinada com o acesso aos módulos. Quem só acessa Associados e Colaboradores só pode exportar esses módulos; a permissão não concede acesso a outros.

- Q: Quem já possui uma permissão antiga de exportação deve receber automaticamente a nova permissão geral? → A: Sim (B). Converter automaticamente quem já possui alguma permissão de exportação, mantendo acesso restrito aos módulos/dados autorizados. Segundo o usuário, atualmente só existem as contas de teste dele e do agente; não foi realizada auditoria de contas neste clarify.

- Q: Por quanto tempo os arquivos de exportação devem ficar disponíveis para baixar novamente? → A: Substituir essa jornada por download direto, sem prazo ou limite de exportação. Clicar em “Exportar [módulo]” abre tela de filtros (data, ordenação, ações, áreas, nomes e outros pertinentes); escolher Excel, CSV ou PDF inicia o download diretamente. Exportar todos os resultados autorizados dos filtros, sem limitar à página, quantidade de registros ou duração do período. Não exigir fila, histórico de arquivos ou retorno posterior para baixar.

- Q: Na tela de exportação, a pessoa poderá escolher quais colunas aparecerão no arquivo? → A: Sim (A), permitir selecionar e ordenar as colunas autorizadas, com uma seleção inicial adequada ao módulo, nos três formatos Excel, CSV e PDF.

Checkpoint de 21/09/2026: Q7 registrada; seleção e ordem de colunas pendentes de implementação/validação. Estado das demais decisões: decisões de acesso e exportação registradas, incluindo
conversão automática e download direto Excel/CSV/PDF como padrão obrigatório.
Adequação de código e validação permanecem pendentes; nenhum teste ou homologação
foi concluído por este registro.

## User Scenarios & Testing

### US1 — Resumo gerencial (P1)

Gestor escolhe semana, mês ou período e acompanha indicadores reais, comparação com
período anterior de igual duração e pontos de atenção. Exporta Excel/CSV/PDF do resumo
pelo fluxo “Exportar Relatórios” → filtros → formato → download direto.
Teste independente: massa sintética conhecida produz os mesmos totais na tela e no arquivo.
Aceite: filtros e período permanecem ao trocar de aba; dados sem permissão não aparecem;
período anterior zero não produz percentual infinito; reservas não são chamadas de atendimentos.

### US2 — Análise detalhada (P1)

Operador escolhe associados, dependentes, agendamentos, parceiros, benefícios,
contratos, notícias, colaboradores ou acessos; filtra, agrupa, escolhe colunas,
consulta todas as páginas e salva a consulta. “Exportar Relatórios” abre filtros;
escolher Excel, PDF ou CSV inicia diretamente o download de todos os resultados
autorizados, sem teto funcional de quantidade/período ou prazo de download.
Teste independente: segunda página e exportação preservam filtros e colunas;
consulta salva pertence ao usuário e é reautorizada a cada uso.
Aceite: ação visível “Salvar consulta” com Plus, abertura, atualização e exclusão
da consulta; conteúdo não salvo preservado entre módulos, limpo ao salvar/cancelar/sair.

### US3 — Resultados e evolução (P1)

Gestão apresenta alcance, adesão, engajamento, cobertura e resultados, com séries
temporais e comentários identificados como análise da gestão. Modo apresentação
e exportações Excel/CSV/PDF compartilham dados agregados, definições e data de atualização.
Teste independente: filtros equivalentes mantêm totais iguais nas três abas;
arquivo emitido permanece uma fotografia datada, sem fingir histórico de estados.

### US4 — Acessos e uso (P1)

Gestor acompanha visualizações, sessões, visitantes reconhecidos, contas ativas,
retorno, telas, dispositivos, origens e versões por canal/fonte, além de atividade
recente e jornadas instrumentadas. Painel começa a coletar após implantação;
sites/app externos enviam eventos por integração documentada e autenticada.
Teste independente: navegação sem reload conta uma visualização; retry não duplica;
inatividade reinicia sessão; canal sem eventos mostra “Sem dados”.
Aceite: ambiente de teste separado; coleta não bloqueia o uso; robôs conhecidos
filtrados; dados pessoais digitados, URLs completas, cookies e senhas não são coletados;
identidade autenticada vem do servidor; nenhum total é chamado de pessoas entre canais.

### Edge Cases

- Datas inválidas, intervalo invertido, ausência de dados e período parcialmente coberto.
- Permissão revogada entre solicitação, geração e download; acesso a arquivo/consulta alheio.
- Reenvio de evento/exportação, interrupção do download, erros e tentativa novamente
  com filtros preservados; grande volume ou período não pode produzir corte silencioso.
- CSV com acentos, aspas e fórmulas; PDF paginado; arquivo Excel verdadeiro.
- Alterações cadastrais posteriores não permitem reconstruir estados antigos não registrados.

## Requirements

- **FR-001**: Exatamente três abas principais: Resumo gerencial, Análise detalhada,
  Resultados e evolução; manter padrão visual e acessibilidade dos módulos existentes.
- **FR-002**: Semana/mês/período explícito, comparação e horário de atualização em tela/arquivo.
- **FR-003**: Consultas autorizadas dos mesmos registros dos domínios, com paginação,
  pesquisa, filtros, colunas e agrupamentos; sem duplicação de cadastro.
- **FR-004**: Excel/CSV/PDF nas exportações das três abas; preservar modo apresentação.
  “Exportar Relatórios” abre tela de filtros com data/período, ordenação, nomes,
  áreas e ações quando pertinentes à consulta. Os botões dos três formatos iniciam
  diretamente o download, mantendo filtros e agrupamentos. Na tela de exportação,
  permitir selecionar e reordenar colunas autorizadas a partir de uma seleção inicial
  adequada; Excel/CSV/PDF contêm exatamente essas colunas nessa ordem.
- **FR-005**: Exportar todos os resultados dos filtros selecionados, além da paginação
  visual, sem teto funcional de quantidade de registros ou duração do período.
  Download direto, sem prazo de disponibilidade e sem etapa de fila/histórico para
  buscar o arquivo depois. Nunca truncar ou exibir arquivo incompleto como sucesso.
- **FR-006**: Consulta exige acesso a Relatórios e leitura dos domínios consultados.
  Exportação exige também a permissão geral de exportação do sistema, sem permissão
  específica de exportação de Relatórios. Revalidar na solicitação, geração e download;
  arquivos e consultas privados, sem ampliar acesso a módulos, registros ou campos.
  Converter automaticamente a permissão antiga de exportação na geral para quem
  já a possui; manter acesso a Relatórios e leitura dos domínios inalterados.
  U1 de21/09: arquivos antigos exigem permissões atuais de todas as fontes presentes,
  mesmo que a lista de permissões da geração omita a chave; incluir scheduling:read
  em detalhes/resumos/apresentações legados com Agendamentos. Escopo não determinável
  com segurança nega o download; preservar arquivos/registros e verificar todos os caminhos.
- **FR-007**: Consultas salvas reutilizam configuração com dados atualizados; arquivos
  emitidos preservam resultados e contexto da geração.
- **FR-008**: Métricas distintas de visualização/sessão/visitante/conta/ação; definições
  visíveis, início da coleta e ausência de dados explícitos; sem histórico inventado.
- **FR-009**: Coleta por canal e fonte, minimizada e deduplicada; conclusão de negócio
  confirmada no servidor; acesso ao painel não equivale a produtividade.
- **FR-010**: Evolução e comparativos apresentam crescimento e queda igualmente;
  comentários da gestão separados de evidências; sem atribuir receitas ou impacto não medidos.
- **FR-011**: Registrar nos planos a opção de baixar/exportar em todos os módulos
  existentes e futuros. Implementação dos botões dos outros módulos é tarefa transversal posterior.
- **FR-012**: Validar autorização, filtros, contagens, arquivos reais, banco, jornada por
  navegador, estados vazios, mobile, temas e acessibilidade com dados sintéticos.
- **FR-013**: Gerar relatório sempre consulta os dados atuais, inclusive com os mesmos filtros.
- **FR-014**: Durante geração/download, informar andamento; falha ou interrupção
  mantém filtros/colunas/formato disponíveis para nova tentativa e explica o erro.
  Não exigir que o usuário acompanhe jobs ou busque o arquivo em outra tela.
- **FR-015**: Analytics de reserva confirmada executa após a resposta HTTP; coleta lenta ou
  indisponível não altera nem atrasa a confirmação de uma reserva persistida.

### Key Entities

- Consulta salva: proprietário, título, filtros, colunas, agrupamento e versão.
- Exportação: solicitante, filtros, ordenação, colunas, formato, resultado e contexto
  da geração, entregue por download direto; sem validade de link como requisito do fluxo.
- Evento de uso: fonte/canal/ambiente, instante, tela/ação permitida e identificadores opacos.
- Indicador: definição, unidade, período, resultado e comparação.

## Success Criteria

- **SC-001**: Totais conferem com 100% dos registros da massa conhecida e arquivos baixados.
- **SC-002**: Usuário sem acesso não lê nenhum resultado, consulta ou exportação restrita.
  A permissão geral de exportação sozinha não concede Relatórios nem leitura de outros
  domínios. Sem a permissão geral, a consulta autorizada permanece e a exportação falha.
- **SC-003**: Três abas navegáveis por teclado e sem rolagem horizontal da página a 390 px.
- **SC-004**: Reenvio de mesmo evento não altera visualizações; canais não instrumentados
  permanecem sem dados, e o painel demonstra coleta após navegação real.
- **SC-005**: Exportações além da primeira página preservam acentos, colunas, filtros
  e ordenação nos três formatos. Conjuntos maiores que 50 mil linhas e períodos
  maiores que366 dias não são recusados por esses tetos antigos nem truncados.
  C1 de21/09 define a validação inicial com100 registros: arquivos completos e período
  amplo nessa massa; remover tetos pelo código/contratos, sem declarar grande volume testado.
- **SC-006**: “Exportar Relatórios” → ajustar filtros → escolher Excel/CSV/PDF inicia
  o download diretamente; os três formatos respeitam seleção e ordem das colunas.
  Sucesso entrega o conjunto completo e falhas preservam
  configuração para repetir, sem retorno obrigatório a histórico de exportações.

## Assumptions

- Sem provedor atual nem migração de métricas. Coleta própria inicial no monólito,
  sem contratação ou transmissão a terceiros; integração externa não instala sites/app ausentes.
- Datas de negócio em America/Bahia; coleta em UTC. Semana começa segunda-feira.
- Dados demográficos/cadastrais mostram estado atual; evolução histórica usa datas
  efetivamente registradas. Métricas administrativas agregadas, sem ranking individual.
- Fontes externas exigem integração em seu servidor; credenciais nunca vão ao navegador/app.
- Localhost continua desligado. Banco descartável, navegador e build pesados no CI.
- Metas, receitas, gravações de tela e geolocalização por IP não são necessárias para esta entrega.


Checkpoint de 21/09/2026 — plan concluído: desenho, pesquisa, modelo, contratos e
roteiro atualizados. Nenhum código, serviço, migration ou teste de aplicação executado.
Tarefas serão detalhadas em seguida; políticas e funções adiadas permanecem pendentes.

Checkpoint de 21/09/2026 — tasks concluídas: 13 tarefas novas (T027–T039), com histórias, dependências, caminhos e aceite; nenhuma implementação/teste de aplicação executado. Ver tasks.md.

Checkpoint final de21/09/2026 — plan seguido de tasks encerrados. Conferência
documental de IDs, fases, links e preservação do histórico concluída; código,
testes de aplicação e homologações não executados. Próximo passo recomendado:
análise cruzada antes da implementação. Detalhes no relatório do programa002.

Checkpoint U1/C1 — 21/09/2026: usuário aprovou proteção de downloads antigos com autorização atual e escolheu100 registros para a validação inicial. Plan/tasks/contratos/roteiro conciliados; nenhuma correção funcional ou teste executado. Provas reais de grande volume ficam fora da rodada atual. I1/D1 permanecem registrados; implementação pendente.
