# Feature Specification: Relatórios e Análises

**Feature Branch**: `feature/reports-analytics-20260918`
**Created**: 2026-09-18
**Status**: Implementado; validação de entrega em andamento
**Input**: Brainstorm aprovado: relatórios dos domínios, métricas dos sites/app/painel,
três abas e exportação. Todos os módulos devem futuramente oferecer baixar/exportar.

## User Scenarios & Testing

### US1 — Resumo gerencial (P1)

Gestor escolhe semana, mês ou período e acompanha indicadores reais, comparação com
período anterior de igual duração e pontos de atenção. Exporta PDF/CSV do resumo.
Teste independente: massa sintética conhecida produz os mesmos totais na tela e no arquivo.
Aceite: filtros e período permanecem ao trocar de aba; dados sem permissão não aparecem;
período anterior zero não produz percentual infinito; reservas não são chamadas de atendimentos.

### US2 — Análise detalhada (P1)

Operador escolhe associados, dependentes, agendamentos, parceiros, benefícios,
contratos, notícias, colaboradores ou acessos; filtra, agrupa, escolhe colunas,
consulta todas as páginas, salva a consulta e exporta Excel, PDF ou CSV.
Teste independente: segunda página e exportação preservam filtros e colunas;
consulta salva pertence ao usuário e é reautorizada a cada uso.
Aceite: ação visível “Salvar consulta” com Plus, abertura, atualização e exclusão
da consulta; conteúdo não salvo preservado entre módulos, limpo ao salvar/cancelar/sair.

### US3 — Resultados e evolução (P1)

Gestão apresenta alcance, adesão, engajamento, cobertura e resultados, com séries
temporais e comentários identificados como análise da gestão. Modo apresentação
e PDF institucional compartilham dados agregados, definições e data de atualização.
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
- Reenvio de evento/exportação, exportação sem worker, erros e tentativa novamente.
- CSV com acentos, aspas e fórmulas; PDF paginado; arquivo Excel verdadeiro.
- Alterações cadastrais posteriores não permitem reconstruir estados antigos não registrados.

## Requirements

- **FR-001**: Exatamente três abas principais: Resumo gerencial, Análise detalhada,
  Resultados e evolução; manter padrão visual e acessibilidade dos módulos existentes.
- **FR-002**: Semana/mês/período explícito, comparação e horário de atualização em tela/arquivo.
- **FR-003**: Consultas autorizadas dos mesmos registros dos domínios, com paginação,
  pesquisa, filtros, colunas e agrupamentos; sem duplicação de cadastro.
- **FR-004**: PDF/CSV no resumo; Excel/PDF/CSV no detalhamento; PDF executivo e modo apresentação.
- **FR-005**: Exportações completas dos filtros selecionados, fora da paginação visual,
  com processamento observável, histórico privado e repetição segura. Nunca truncar silenciosamente.
- **FR-006**: Permissões específicas para consultar e exportar, combinadas às permissões
  de leitura dos domínios; arquivos e consultas privados, sem ampliar acessos.
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

### Key Entities

- Consulta salva: proprietário, título, filtros, colunas, agrupamento e versão.
- Exportação: solicitante, configuração, estado, arquivo, contexto e validade.
- Evento de uso: fonte/canal/ambiente, instante, tela/ação permitida e identificadores opacos.
- Indicador: definição, unidade, período, resultado e comparação.

## Success Criteria

- **SC-001**: Totais conferem com 100% dos registros da massa conhecida e arquivos baixados.
- **SC-002**: Usuário sem acesso não lê nenhum resultado, consulta ou exportação restrita.
- **SC-003**: Três abas navegáveis por teclado e sem rolagem horizontal da página a 390 px.
- **SC-004**: Reenvio de mesmo evento não altera visualizações; canais não instrumentados
  permanecem sem dados, e o painel demonstra coleta após navegação real.
- **SC-005**: Exportações além da primeira página preservam acentos, colunas e filtros.

## Assumptions

- Sem provedor atual nem migração de métricas. Coleta própria inicial no monólito,
  sem contratação ou transmissão a terceiros; integração externa não instala sites/app ausentes.
- Datas de negócio em America/Bahia; coleta em UTC. Semana começa segunda-feira.
- Dados demográficos/cadastrais mostram estado atual; evolução histórica usa datas
  efetivamente registradas. Métricas administrativas agregadas, sem ranking individual.
- Fontes externas exigem integração em seu servidor; credenciais nunca vão ao navegador/app.
- Localhost continua desligado. Banco descartável, navegador e build pesados no CI.
- Metas, receitas, gravações de tela e geolocalização por IP não são necessárias para esta entrega.
