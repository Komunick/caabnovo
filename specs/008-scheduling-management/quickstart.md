# Validação planejada — Agendamentos externos 2C (24/09/2026)

**Estado:** roteiro para implementação futura, não evidência de testes executados.
Referências: [spec](spec.md), [contrato lógico v1](contracts/channels.md), [modelo](data-model.md).
Os roteiros administrativos anteriores permanecem abaixo e não comprovam o novo recorte.

## Pré-requisitos de 2C

- Suite de contratos/domínio e adaptadores sintéticos de identidade/entrega implementados antes
  de executar os cenários. Os testes atuais podem cobrir apenas a agenda administrativa.
- Ambiente CI/descartável conforme [stack](../../docs/STACK.md) e
  [workflow](../../docs/DELIVERY-WORKFLOW.md); nunca dados reais ou banco do preview.
- Node/pnpm e dependências do lockfile. Guia de design acessível antes de desenhar/revisar UI.
- Fixtures: titular T1 com dependente D1, outro titular T2, dependente D2 sem vínculo com T1,
  equipe do estabelecimento E1, colaborador autorizado de backup e conta somente consulta.
  Ofertas: serviço para ambos e exclusivo de titular; modo profissional e capacidade 2;
  confirmação imediata/manual; revisão publicada e rascunho divergentes. Relógio controlável.
- Identidades/contatos/provedores sintéticos devem estar identificados como tal; nenhum envio real.

## Execução futura

Conferir seletores de testes após implementá-los; zero testes encontrados ou suite apenas antiga
não atende ao recorte. Comandos existem no package.json consultado, mas não foram executados:

```powershell
corepack pnpm test:unit scheduling
corepack pnpm test:contract scheduling
corepack pnpm test:integration scheduling
corepack pnpm test:e2e scheduling --project=chromium
corepack pnpm test:a11y --project=chromium
```

Execução de integração/browser e demais gates no ambiente autorizado/CI. Este guia não inicia
serviço local nem instala dependências. Rodar format/lint/typecheck/build/security conforme workflow
quando houver código; não criar repetição de CI por mudança exclusivamente documental.
Para documentos, o comando próprio é format:docs:check; format:check geral não cobre specs/docs.

## Matriz de jornadas e resultados esperados

| Caso | Ações com dados sintéticos | Resultado verificável | Referência |
| --- | --- | --- | --- |
| V01 Identidade e público | Visitante consulta oferta/tenta vagas; T1 escolhe D1 antes do serviço; D1 tenta T1; titular por dependente tenta serviço exclusivo. | Só catálogo público; representações indevidas negadas; perfil do atendido determina elegibilidade; API direta também nega. | FR-01/02/04/25; SC-03/24 |
| V02 Publicação | Salvar novo, publicar direto; salvar edição e publicar alterações; repetir/comando concorrente/inválido. | Mesmo ID; rascunho invisível; revisão pública única app/site; falha preserva publicada; descrições acessíveis abaixo dos botões. | FR-19; SC-18 |
| V03 Vagas e capacidade | 20 envios diferentes por painel/app/site para vaga única e capacidade 2; mesmo beneficiário entre unidades; adjacência. | Uma ou duas ocupações conforme recurso; conflito global da mesma pessoa; adjacências aceitas; nenhuma dupla confirmação. | FR-03/14; SC-01/02/13 |
| V04 Equipe e confirmação | Criar imediato/manual; equipe vinculada e backup disputam decisão; usuário só consulta e permissão revogada tentam agir. | Pendência ocupa; um único efeito de aprovação/recusa; autoria/apoio auditados; nenhuma permissão herdada do vínculo. | FR-03/21; SC-20 |
| V05 Troca voluntária | Pedir, substituir, recusar, retomar e confirmar; terceiro ocupa origem liberada; falhar transação inicial; usar duas trocas. | Só destino retido; falha inicial preserva origem; recusa não a restaura; uma utilização por ciclo; terceiro ciclo negado. | FR-07/08/10/11/18; SC-05/07/09/10/17 |
| V06 Limites temporais | Prazo de troca 24h/exatamente/menos; horizonte 90 dias/início no limite/acima; políticas alteradas; destino já iniciado. | Guardas independentes; redução não reescreve reservas existentes; aprovação nunca retroativa; sem expiração automática. | FR-08/15/16/17; SC-07/14/15/16 |
| V07 Cancelamento | Cancelar confirmado antes/exatamente no início; cancelar sem horário após recusa/indisponibilidade e após origem; corrida com aprovação. | Aplicar guarda da situação; liberar só ocupação própria; preservar histórico; decisão atrasada não reabre registro. | FR-09/18/20; SC-08/17/19 |
| V08 Recuperação isenta | Equipe registra indisponibilidade com 0/1/2 trocas usadas; nova escolha, recusa, retomada/confirmação/cancelamento. | Mesmo ID, bloqueio real mantido, zero vagas sem escolha, uso voluntário inalterado; cliente não forja isenção; terceiros preservados. | FR-20; SC-19 |
| V09 Profissional e jornada | Seleção habilitada/desabilitada, qualquer disponível, nenhum profissional cadastrado, profissional sem vaga e troca de beneficiário. | Sem campo desnecessário; profissional informado antes de concluir e sem troca silenciosa; fallback indevido negado. | FR-13/14/25; SC-12/13/24 |
| V10 Fila e alertas | Origem amanhã vs mês seguinte; destinos invertidos; empate; idade 23h59min59s/24h; início em 24h00min01s/24h; atraso desligado. | Prioridade usa origem; urgência usa destino e independe da idade; atraso/urgência não liberam vaga, mudam ordem ou transferem responsabilidade. | FR-07/22; SC-06/21 |
| V11 Avisos e histórico | Quatro eventos; três canais ativos; preferências distintas, vínculo encerrado entre evento/envio, sem contato, retry e resultado externo incerto. | Destinatários atuais, sem duplicação cega; reserva não é revertida por envio; sem confirmação falsa; histórico por beneficiário com autor separado. | FR-12/23/24; SC-11/22/23 |
| V12 Acesso e UX | Sessão/vínculo revogados entre leitura/comando/replay; ações por teclado, 390 px, temas, falha/conflito e retorno ao fluxo. | Zero exposição privada/ação indevida; campos preservados; estado textual e foco coerentes; evidência pelo guia/WCAG. | FR-01/02/04/05; SC-03/04 |

“FR/SC” na matriz refere-se ao prefixo 2C da spec. Além das jornadas, conferir rollback/idempotência
com isolamento real no PostgreSQL; mock de repositório não comprova ausência de corrida.
Revisar limites configurados também após espera por lock e com fusos de navegador diferentes.

## Homologação externa e transição

| Dependência | Evidência necessária antes de ativar |
| --- | --- |
| Contas existentes | Mecanismo, mapeamento verificável identidade→pessoa, revogação, separação do painel e teste de continuidade autorizado. |
| Mensagens | Provedor/contatos/templates, política finita de tentativas/reenvio, recibos seguros, preferências/supressões conciliadas; falha não altera reserva. |
| Legado | Fonte/data/versão, reservas futuras e histórico inventariados, IDs reconciliados, janela de corte e retorno sem perda. |
| Contrato HTTP/UI | Caminhos versionados e schemas executáveis vinculados ao contrato lógico, compatibilidade com UI01/UI02 e guia visual. |

Resultado desconhecido sobre reservas futuras mantém corte pendente. Não usar massa sintética
como prova de inventário ou entrega real. Guardar commit, ambiente, casos, resultados e limitações
em evidence/ da entrega; nenhuma tarefa é concluída apenas por este roteiro.

---

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
