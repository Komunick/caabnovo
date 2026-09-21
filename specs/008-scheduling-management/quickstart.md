# Validação do incremento — Agendamentos: acesso, integridade por pessoa e exportação

## Estado e pré-requisitos

Pré-requisitos de execução futura: Node 24/pnpm do package.json, dependências fixadas,
PostgreSQL 18 descartável/Testcontainers e Chromium no CI. Nunca usar banco do preview
ou contas reais como seed. Localhost continua desligado; os comandos abaixo são roteiro,
não foram executados neste planejamento. Variáveis/segredos seguem `.github/workflows/ci.yml`.

```powershell
corepack pnpm install --frozen-lockfile
corepack pnpm test:unit
corepack pnpm test:contract
corepack pnpm test:integration apps/web/tests/integration/scheduling.test.ts
corepack pnpm test:e2e scheduling.spec.ts --project=chromium
corepack pnpm test:a11y --project=chromium
```

O job browser existente prepara ambiente/contas sintéticos; não copiar seus seeds
para o preview principal. Testes de migração/conflito usam banco descartável. Antes
de entrega de código, completar format/lint/typecheck/build/security e evidências
visuais pelo workflow de CI, sem iniciar builds/serviços pesados no computador.

## Jornada independente

Duas reservas concorrentes da mesma pessoa em profissionais/unidades distintos: uma aceita; titular/dependentes distintos podem coincidir. Bloqueio mantém reserva/vaga e mostra aviso. Sem read some/nega; só read não altera. Exportação não herda teto visual.

Para cada dataset do contrato, abrir Exportar [módulo], variar filtros, selecionar/reordenar colunas por teclado e baixar Excel/CSV/PDF. Ler arquivos com parsers independentes, confrontar IDs/contagem/conteúdo/ordem com a massa conhecida. Vazio mantém cabeçalho; mais de uma página não corta resultados.

Matriz negativa: anônimo, sessão revogada, sem acesso, leitura sem geral, geral sem
leitura, leitura+geral sem escrita, campo proibido, operação de outro usuário e
revogação entre lotes. Preservar filtros após falha; interrupção não retorna sucesso.
Testar teclado,390 px, desktop e temas. Módulos negados têm zero entradas no menu,
busca e Início; controles pessoais da conta continuam disponíveis.

## Evidência esperada

Registrar comandos, versões/commit, fixtures sintéticas, resultados, arquivos
validados e capturas em `specs/008-scheduling-management/evidence/plan-2026-09-21-validation.md`
(arquivo futuro). Nunca marcar tarefas como concluídas por este roteiro.
Requisitos e representações: [modelo](data-model.md), [contrato](contracts/exports.md).

## Roteiro anterior — histórico

Não executar serviços/seeds indicados abaixo no preview principal. O roteiro atual
usa CI/banco descartável; passos substituídos não autorizam reativação local.

<details>
<summary>Roteiro anterior preservado</summary>

# Roteiro de validação

## Incremento de calendário — 18/09/2026

Após configurar/criar pela jornada abaixo, alternar Mês/Semana/Dia/Lista; conferir
filtros, URL, recarga, anterior/próximo/hoje e abrir reserva por teclado. Usar browser
em Pacific/Auckland: a reserva de 08h da Bahia deve continuar às 08h. Remarcar e
cancelar pelos detalhes, retornar ao calendário e verificar situação/horário.
Testar 390px e desktop nos temas, rolando somente a grade quando necessário.
Erros/mais de 1.000 reservas não podem resultar em calendário vazio ou parcial.
Rodada final: testes scheduling de unidade/integração, scheduling.spec.ts completo,
gates gerais do projeto e revisão das capturas do CI. Nenhum serviço local autorizado.

**Estado atual:** código implementado e gates aprovados; [resultados e capturas](evidence/release-review.md).
Não executar contra dados reais nem reativar localhost/PostgreSQL por este documento.

## Preparação

Usar branch vigente sem PR, ambiente descartável/CI,
banco vazio separado do preview, aplicar migrations pelo procedimento do projeto.
Dados sintéticos: duas unidades, dois serviços numa unidade, dois procedimentos de
30/60 minutos, dois profissionais, duas contas administrativas e associados/dependentes
sintéticos. Q8 exige duas contas administrativas: uma com acesso concedido a
Agendamentos e outra sem essa concessão, para os cenários positivos/negativos.

## Comandos

Da raiz da worktree, com dependências e variáveis do CI configuradas:

- corepack pnpm format:check
- corepack pnpm lint
- corepack pnpm typecheck
- corepack pnpm exec vitest run --project unit scheduling --maxWorkers=1
- corepack pnpm exec vitest run --project integration scheduling
- corepack pnpm --filter @caab/web exec playwright test scheduling.spec.ts --project=chromium
- corepack pnpm test:a11y
- corepack pnpm build
- corepack pnpm security:scan

Esses filtros encontram os testes da feature; zero testes não é
aprovação. Integração/build/E2E no CI enquanto vigorar a suspensão dos serviços locais.

## Provas de aceite

1. US1: configurar catálogo e horários pela UI; criar e reencontrar após recarga.
2. Fora de expediente/almoço: horário não oferecido e POST forjado recusado.
3. Disputa: 20 pedidos diferentes na mesma vaga → um sucesso; sobreposição parcial
   entre procedimentos diferentes também recusada; horários adjacentes aceitos.
4. Retry: 20 envios com mesma chave/payload → mesmo resultado, uma reserva/evento.
5. US2: remarcar; verificar vaga antiga livre. Conflito mantém versão/datas anteriores.
6. Cancelar/repetir cancelamento; preservar histórico e liberar vaga.
7. Editar em duas telas; versão desatualizada não sobrescreve.
8. Após adequação Q8/AC01–AC03, conta administrativa sem concessão de Agendamentos
   não vê o módulo na barra lateral/busca/Início nem acessa URL/API. Conta com acesso
   realiza jornadas autorizadas; sessão ou concessão revogada falha. Código atual
   ainda precisa ser adaptado; evidências anteriores não validam este novo controle.
   Busca de beneficiário não expõe cadastro completo nem exige members:read.
9. Bloqueio de associado/titular e alteração de vínculo concorrem com reserva; validar
   ordem transacional e inexistência de confirmação baseada em leitura obsoleta.
10. Mudança de horário com reserva incompatível é recusada sem cancelar a reserva.
11. Desktop/celular 390 px, claro/escuro e teclado: listar/configurar/criar/remarcar/
    cancelar sem overflow, foco perdido ou ações dependentes de cor/arraste.
12. Confirmar nenhuma chamada ao legado/Cal.com/app/site e nenhuma migração de dados reais.

Guardar relatório e capturas sintéticas em evidence/. Não declarar equivalência com
legado nem integração dos canais com base nestas provas da primeira entrega.

## Matriz de permissões — Q9 de 21/09/2026

Após AC01/AC02: sem consulta, módulo oculto e URL/API negados; somente consulta
permite leituras e impede mutações; consulta+alteração permite oferta/horários e
criação/remarcação/cancelamento de reservas. Concessão de alteração sem consulta é
recusada. Testar UI e API, com revogação entre leitura e comando. Exportar exige
consulta + permissão geral, sem exigir alteração. Código ainda tem lacuna; nenhum
desses testes novos executado no clarify.

</details>
