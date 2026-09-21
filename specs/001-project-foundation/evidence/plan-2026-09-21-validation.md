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
  quality/security aprovados; navegador em acompanhamento neste checkpoint. Quality:385 testes
  unitários,145 de contrato,233 de integração; formatação, lint, tipos, migrations e build
  aprovados. CI usa Node24.20.0, PostgreSQL18 descartável, Ubuntu do workflow; limites do runner são
  os fornecidos pelo GitHub. Não foi medido hardware físico dedicado.

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
