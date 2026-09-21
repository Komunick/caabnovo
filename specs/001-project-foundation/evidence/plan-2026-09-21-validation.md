# Validação do incremento de acesso, exportação e ciclo de vida

## Escopo e estado em21/09/2026

Entrega feature/access-export-foundation-20260921. Base dev63b36e7; localhost desativado. Este
relatório cobre somente alterações autorizadas, sem homologar os demais módulos. Clarify e analyze
serão executados após implementação/gates, somente neste recorte.

## Execuções concluídas

- [CI35637568416](https://github.com/Komunick/caabnovo/actions/runs/35637568416), commit7f6304f:
  quality, browser e security aprovados. Inclui T097, cargos/acessos, ciclo de colaboradores,
  associados e nova senha. Foram corrigidas fixtures antigas; não relaxadas as autorizações.
- [CI35640590161](https://github.com/Komunick/caabnovo/actions/runs/35640590161), commit67c4292:
  quality, browser e security aprovados. Quality:385 testes unitários,145 de contrato,233 de
  integração; formatação, lint, tipos, migrations e build aprovados. CI usa Node24.20.0,
  PostgreSQL18 descartável, Ubuntu do workflow; limites do runner são os fornecidos pelo GitHub. Não
  foi medido hardware físico dedicado.

## Perfil inicial de exportação (100 registros sintéticos)

Medição do CI67c4292 com consumidor lento e leitores independentes:

| Formato | Primeiro byte | Rodada completa | RSS antes/pico nos writes/depois | Conexões dados/controle |
| ------- | ------------- | --------------- | -------------------------------- | ----------------------- |
| CSV     | 18,7ms        | 207,3ms         | 256,7/256,9/258,5MB              | 1/1                     |
| XLSX    | 12,7ms        | 461,6ms         | 258,5/263,5/266,4MB              | 1/1                     |
| PDF     | 16,0ms        | 504,1ms         | 267,1/268,7/305,2MB              | 1/1                     |

A duração e RSS final desta primeira rodada incluem leitura independente do arquivo para
verificação. O pico é amostrado nos writes, não um profiler contínuo; não generalizar estes valores.
Teste ajustado na revisão seguinte separa geração de verificação. As100 linhas foram conferidas nos
três formatos. Pools estavam ociosos ao final; testes cobriram revogação sob backpressure,
interrupção, unicidade de requestId e dono. Não é prova de grande volume/estresse.

## Validação complementar

CI35641862727, commit385f0d6: quality e security aprovados:387 testes unitários,145 de contrato,234
de integração, lint, tipos, migrations e build. Inclui snapshot entre lotes sob alteração
concorrente, PDF longo em faixas horizontais e erro de writer. Navegador testa adicionalmente Gestor
concedendo escrita que não possui, gerando senha sem escrita geral e reserva mantida/cancelada após
exclusão. Navegador ainda em andamento neste checkpoint.

A rodada seguinte inicia as30 aberturas do painel em paralelo aos downloads (a primeira rodada as
abria entre formatos) e confere erro real de configuração seguido de nova tentativa com o formulário
preservado. A evidência de desempenho anterior não comprova simultaneidade.

## Perfil com geração separada da verificação

CI385f0d6, Node24.20.0, PostgreSQL18 e100 registros por formato, consumidor lento:

| Formato | Primeiro byte | Geração/transferência | RSS antes/pico/depois | CPU usuário/sistema | Conexões dados/controle |
| ------- | ------------- | --------------------- | --------------------- | ------------------- | ----------------------- |
| CSV     | 32,5ms        | 213,8ms               | 259,6/259,7/259,7MB   | 36,0/4,2ms          | 1/1                     |
| XLSX    | 22,1ms        | 493,0ms               | 260,8/264,2/264,2MB   | 110,8/18,6ms        | 1/1                     |
| PDF     | 19,4ms        | 338,1ms               | 265,1/266,7/265,7MB   | 149,7/12,4ms        | 1/1                     |

RSS pós-leitura independente:260,8/265,1/303,8MB respectivamente. Pico amostrado nos writes; CPU
inclui o processo do teste, sem isolamento de hardware. Pools/cursor liberados ao final. Não
representa limite de memória sob grande volume nem SLA de exportação.

## Navegador e revisão visual

CI385f0d6:89 E2E e6 testes de acessibilidade aprovados, além do smoke inicial de Relatórios.
Artefatos sintéticos de exportação e reservas foram baixados e inspecionados. O aviso de associado
excluído permanece após Manter reserva e registra responsável/data. As imagens iniciais de
exportação mostraram filtros nativos sem os componentes compartilhados; corrigidos em9464254, com
FormField/filter-grid, grupos/seleção e controles de ordem usando os tokens existentes.

CIc18ac5b: quality/security aprovados; navegador falhou porque o seletor genérico de alerta também
capturava o anunciador interno do Next.js. A mensagem correta estava presente. Corrigido em57d6b56.
O teste de conflito de acessos passou na repetição, mas sua dependência de uma conta estar na
primeira página foi removida; agora percorre a paginação da massa de100 registros.

## Fechamento validado

[CI35644236348](https://github.com/Komunick/caabnovo/actions/runs/35644236348), commit57d6b56:
quality, browser e security aprovados. Passaram387 testes unitários,145 de contrato,234 de
integração, 89 E2E,6 acessibilidade e2 testes do smoke inicial de Relatórios; formatação, lint,
tipos, migrations e build aprovados. Nenhuma falha ou repetição instável registrada na execução
final.

Exportação real de100 registros nos três formatos, com erro de configuração e nova tentativa,
colunas reordenadas, resultado vazio, Gestor/Colaborador e revogação. As30 aberturas do painel
iniciadas em paralelo aos downloads tiveram p95 de479,7ms, abaixo do alvo2s no runner. Os downloads
podem terminar antes das30 aberturas; não alegar carga concorrente sustentada ou estresse. Perfil
completo em [export-profile-57d6b56.json](export-profile-57d6b56.json).

Revisão visual concluída: filtros usam os controles compartilhados, colunas e botões permanecem
legíveis em390px/desktop e nos dois temas. Imagens e perfil no
[artefato de exportação](https://github.com/Komunick/caabnovo/actions/runs/35644236348/artifacts/10660201880)
e [reservas](https://github.com/Komunick/caabnovo/actions/runs/35644236348/artifacts/10660401502).
As capturas full-page mantêm a barra fixa na posição de rolagem do momento da captura.

Clarify restrito às alterações:1 pergunta respondida, confirmando que somente Administrador redefine
outro Administrador. Escopo/comportamento, modelo/ciclo de vida, UX, qualidade, dependências,
falhas, restrições, terminologia, aceite e placeholders claros; sem pendências novas. Seções
atualizadas: Clarifications e autoridade de nova senha nas specs001/006. Checklist00113/16 →13/16,
sem regressões; três itens documentais mantidos abertos por autorização do usuário. Sem hooks.

Analyze posterior, somente leitura e limitado ao mesmo recorte:23 requisitos,30 tarefas,100% de
cobertura; zero ambiguidades restantes, duplicações relevantes, questões críticas ou tarefas sem
requisito. Nenhum conflito constitucional identificado. T097–T123,005 LC01/LC02 e008 LC01 concluídos
com estas evidências. Isso não conclui os adaptadores futuros nem homologações institucionais.

Registros concorrentes sobre documentos/dependentes P01 foram preservados localmente e ficam fora
deste PR, por pedido explícito do usuário. Não pertencem ao recorte do clarify/analyze desta
entrega.

## Rollback e limites

Reverter aplicação por PR se necessário; preservar colunas, estado operacional, auditoria,
identidades e arquivos existentes. Não reverter chaves de permissão sem conciliar código/view. Não
executar DELETE de domínio para rollback. Migrations nunca aplicadas ao preview local. A ponte
interna do ExcelJS está vinculada à4.4.0 e exige revalidação ao atualizar. PDF mantém português;
code points fora da fonte padrão têm representação Unicode explícita na legenda. Somente
Colaboradores recebeu novo adaptador; os demais continuam nas suas tarefas próprias.
