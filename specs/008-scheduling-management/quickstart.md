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
sintéticos. Uma conta sem concessões de módulos deve ter acesso administrativo válido.

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
8. Conta administrativa sem concessão scheduling acessa tudo; sessão revogada falha.
   Busca de beneficiário não expõe cadastro completo nem exige members:read.
9. Bloqueio de associado/titular e alteração de vínculo concorrem com reserva; validar
   ordem transacional e inexistência de confirmação baseada em leitura obsoleta.
10. Mudança de horário com reserva incompatível é recusada sem cancelar a reserva.
11. Desktop/celular 390 px, claro/escuro e teclado: listar/configurar/criar/remarcar/
    cancelar sem overflow, foco perdido ou ações dependentes de cor/arraste.
12. Confirmar nenhuma chamada ao legado/Cal.com/app/site e nenhuma migração de dados reais.

Guardar relatório e capturas sintéticas em evidence/. Não declarar equivalência com
legado nem integração dos canais com base nestas provas da primeira entrega.
