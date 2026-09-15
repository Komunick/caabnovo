# Revisão da primeira entrega — 15/09/2026

## Escopo e estado

US1 + US2 implementadas em feature/scheduling-management-20260915. Oferta própria
da agenda, expediente/jornada/almoço, disponibilidade, reserva, lista diária,
remarcação, cancelamento e histórico. T018–T020 aguardam encerramento dos gates finais.
Processamentos integrado em origin/dev 154cbed, incorporado à branch ativa antes do PR.

## Integridade e acesso

- Qualquer sessão ativa do painel pode usar Agendamentos. Guarda relê usuário/sessão
  na transação; não concede permissões de Associados ou outros módulos.
- Beneficiários: projeção mínima de nome, ano e OAB; confirmação recusa arquivo,
  bloqueio próprio ou titular vigente bloqueado. Inativo não cria veto novo.
- Advisory lock transacional 5010/1 coordena escritos de agenda e elegibilidade,
  antes dos locks de linhas. GiST impede sobreposição por profissional, inclusive
  entre unidades. Intervalos adjacentes são permitidos.
- Horários/ativação incompatíveis com reservas futuras são recusados. Alteração de
  duração não reescreve compromissos existentes. Remarcação tem rollback integral.
- Idempotência persistida, versões de edição e eventos append-only; cancelar libera
  a ocupação sem apagar registros. Motivo não é exigido nem introduzido na UI.
- Mutações validam Origin, CSRF, JSON limitado a 64 KiB e contratos; respostas
  no-store. Erros técnicos não entram no texto mostrado ao operador.

## Evidências já obtidas

CI [35011941648](https://github.com/Komunick/caabnovo/actions/runs/35011941648):
quality e security aprovados, com 291 unitários, 105 contratos e 180 integrações
(20 cenários de Agendamentos), migration do zero e build de produção.
Essa execução de navegador foi encerrada após incorporar a correção de seletor
de teste identificada na execução anterior; não representa aprovação E2E final.

Na primeira execução, a jornada completa de Agendamentos passou pelo navegador,
com cadastro de oferta via UI, recarga, remarcação, cancelamento, teclado e Axe
em 390 px claro/escuro. O segundo cenário falhou por ambiguidade com o anunciador
do Next.js; seletor corrigido para a região do módulo. A lista esperada de migrations
também foi atualizada após adicionar 0020. Não houve falha das regras de reserva.

Consulta diária: 427 ms para 10.000 reservas sintéticas canceladas, 25 retornadas,
na execução acima (primeira: 521 ms). Medição única de consulta no runner de CI;
não é SLA nem prova de capacidade de 10.000 atendimentos simultâneos.

## Migration e rollback

0020_scheduling.sql é aditiva; usa a extensão PostgreSQL btree_gist, cria tabelas,
FKs, índices, exclusão temporal, trilhas e grants mínimos do runtime. Não altera
nem migra dados reais. O executor existente de migrations aplica na ordem.
Sem variáveis de ambiente novas ou dependências. Rollback da aplicação preserva
as tabelas, reservas e trilhas; não executar DROP nem apagar pedidos/histórico.

## Limites da etapa

Uma faixa semanal por dia e almoço opcional. Sem virar a noite, exceções de agenda,
salas, grupos, avaliações, no-show/completed, lembretes ou regras de punição.
Nenhuma integração nova com Cal.com, legado ou canais app/site. Dados pessoais
reais não foram usados nos testes; preview, PostgreSQL e demais serviços locais
permaneceram desligados. Integração, build e navegador rodaram em infraestrutura de CI.

Próximo passo após a revisão desta entrega: UI01 do programa 002 e T022 da spec 008,
para especificar a primeira interface do usuário no app/site. Nenhuma dessas
funcionalidades posteriores é implementada automaticamente nesta entrega.
