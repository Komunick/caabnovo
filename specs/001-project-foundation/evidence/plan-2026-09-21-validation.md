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

## Pendências de fechamento

Navegador da exportação,30 aberturas/p95, temas/390px e jornadas complementares do Gestor e reserva
mantida/cancelada após exclusão. Snapshot entre lotes e formato PDF longo/faixas em validação
adicional. Não marcar as tarefas dependentes desses resultados antes do CI.

## Rollback e limites

Reverter aplicação por PR se necessário; preservar colunas, estado operacional, auditoria,
identidades e arquivos existentes. Não reverter chaves de permissão sem conciliar código/view. Não
executar DELETE de domínio para rollback. Migrations nunca aplicadas ao preview local. A ponte
interna do ExcelJS está vinculada à4.4.0 e exige revalidação ao atualizar. PDF mantém português;
code points fora da fonte padrão têm representação Unicode explícita na legenda. Somente
Colaboradores recebeu novo adaptador; os demais continuam nas suas tarefas próprias.
