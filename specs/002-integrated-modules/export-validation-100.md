# Perfil C1 — validação inicial com100 registros

Decisão do usuário em21/09/2026: usar **100 registros sintéticos** nesta etapa. Este documento substitui exigências de massa de50 mil/100 mil ou mais na rodada atual; não modifica a regra de produto de exportação sem teto funcional de quantidade/período. Estado: roteiro, nenhum teste executado por este registro.

## Massa e jornadas

- Reutilizar uma massa de100 registros de domínio por cenário, em banco descartável/CI. Nunca usar contas/dados reais nem o banco do preview. Não ligar localhost.
- Distribuir esses100 registros por mais de uma página da interface; escolher filtros com resultados conhecidos, zero resultados, datas empatadas, acentos, aspas, valores semelhantes a fórmulas e alguns textos longos. Datas podem cobrir intervalo superior a366 dias sem aumentar a quantidade.
- Conferir Excel, CSV e PDF, seleção/ordem das colunas, todas as abas/datasets autorizados, erro com filtros preservados, retomada por nova tentativa, revogação e interrupção controladas. Se uma exportação de100 termina antes da revogação, pausar o stream no teste entre lotes; não inflar a massa.
- Executar uma exportação por vez para as medições iniciais. Abrir uma tela comum durante a transferência para verificar responsividade; não executar teste de estresse com múltiplas exportações nesta rodada.

## Medições e critérios

| Verificação | Registro | Critério nesta etapa |
| --- | --- | --- |
| Arquivos | IDs, contagem lógica, campos, valores, ordem, hash quando aplicável | Massa de 100 registros de entrada por cenário. Em listagens detalhadas sem agrupamento e sem filtro, conferir os 100/100 registros; com filtros, conferir exatamente o subconjunto esperado. Em resumos, séries e relatórios agrupados, conferir grupos, totais e valores calculados esperados a partir da mesma massa, sem exigir 100 linhas de saída. Em todos os casos, zero perdas/duplicações/campos proibidos e arquivos válidos em Excel, CSV e PDF. |
| Tempo | Tempo até o primeiro byte e duração total por formato | Medição diagnóstica; não inventar SLA de duração da exportação. Falha/timeout não conta como sucesso. |
| Recursos | RSS antes/pico/depois, CPU, conexões/cursor antes/durante/depois | Sem queda, OOM ou recurso de banco/stream deixado aberto após conclusão/falha/cancelamento. Não exigir retorno exato da RAM, pois o runtime pode retê-la. Valores ficam registrados com ambiente/commit. |
| Painel | Tempos observados e p95 de30 aberturas de uma tela comum durante a rodada | Preservar alvo existente de p95 até2s nas condições registradas; nenhuma requisição falha por exportação. Não generalizar a outros ambientes/cargas. |
| Segurança/recuperação | Matriz de papéis, revogação, interrupção e nova tentativa | Zero bytes liberados em pedido inicialmente negado; interrupção não declarada sucesso; configuração preservada; recursos fechados. Bytes já enviados antes de revogação não podem ser recolhidos. |

Registrar hardware/limites do runner, versões, commit, comandos, duração e resultados reais. O limite de tempo do executor de teste é operacional, não prazo ou limite de exportação para o usuário. Evidências em001/010/evidence/plan-2026-09-21-validation.md, somente após execução.

## Limites da evidência

A rodada comprova comportamento apenas com100 registros e as condições descritas. Não homologa grande volume, saturação, escalabilidade nem a virada real de planilha por mais de1.048.576 linhas. Essas provas ficam fora da rodada atual, sem obrigação de executá-las automaticamente; mecanismos de streaming/divisão/continuação e remoção dos tetos antigos continuam requisitos de implementação. Fronteiras podem ser verificadas por testes unitários de contadores/formatadores sem gerar massas acima de100 registros, sem apresentar isso como teste real de grande volume.
