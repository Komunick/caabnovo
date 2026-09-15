# Processamentos US3 — 15/09/2026

Branch própria solicitada pelo usuário: feature/processamentos-20260915.
Código final em 85e5845; validação remota [CI 35006098095](https://github.com/Komunick/caabnovo/actions/runs/35006098095), integralmente aprovada.

## Comportamento entregue

- Leitura e reenvio exigidos antes da transação e antes de inicializar a fila pela rota.
- Consulta com filtros por estado/tipo, páginas de 25 (máximo 100), próxima/primeira
  página preservando filtros e reinício ao aplicar/limpar; aviso recuperável para URL inválida.
- Ordenação por created_at/id, preservando microssegundos no cursor. Tipos conhecidos
  apresentados em português; nomes históricos continuam aceitos. Datas em America/Sao_Paulo.
- Limite de tentativas, bloqueio concorrente, rollback e auditoria sem motivo obrigatório preservados.
- Sem migration, dependência, variável nova ou mudança de dados do preview. Consulta de
  lista continua interna ao painel; contratos das APIs de detalhe/reenvio preservados.

## Validação

Formatação, lint e tipos aprovados localmente; 282 unitários e 105 contratos abrangidos
pela suíte final (o sexto unitário de jobs foi validado após a suíte inicial de 281).
Pesquisa oficial prévia e desenho em research.md/plan.md/contracts/navigation.md.

Regressões de PostgreSQL: 137 execuções com datas empatadas e microssegundos em páginas
de 25/100; filtros combinados, vazio, limite exato, inserção entre páginas e rejeição de
cursor inválido. Reenvio: negação sem efeitos, concorrência com um único enfileiramento,
auditoria, falha de fila com rollback, limite de tentativas e registro inexistente.

Navegador: navegação antiga, reenvio autorizado sem motivo e isolamento dos perfis;
nova jornada cobre teclado, filtros, continuação/primeira página, limpeza, vazio,
URL inválida e acessibilidade desktop/celular. Capturas sintéticas em jobs-synthetic-screenshots.

Resultado final: 282 unitários + 105 contratos + 160 integrações + 67 E2E + 6 a11y = 620 testes
aprovados; formatação/lint/tipos/build/dependências/segredos também aprovados.
Capturas desktop e celular revisadas no artefato jobs-synthetic-screenshots do CI final.
Tabela móvel mantém largura legível e rolagem própria acessível por teclado, sem ampliar
a largura da página. Botões separados e foco visível. T010–T013 da spec003 e T009/T010
do programa concluídas. Build e E2E executados remotamente; nenhum seed no preview principal.

Primeira validação e4b6f53 aprovou backend/build/segurança e 66 E2E; teste novo confundia
alerta da página com anunciador Next. Seletor corrigido sem relaxar a expectativa.
A revisão visual identificou tabela comprimida no celular: largura mínima e contêiner
restrito corrigidos; regressão cobre rolagem por teclado e ausência de overflow da página.

## Limites e rollback

Cada página reflete o estado consultado naquele momento. Alterações de estado pelo worker
podem mudar a composição de páginas filtradas; não há snapshot de toda a consulta.
Reversão da aplicação pelo fluxo de PR não exige rollback de banco, pois não há migration.
Revisão humana de permissões necessária antes de eventual integração autorizada.
