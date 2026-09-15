# Revisão da primeira entrega — 15/09/2026

## Resultado e escopo

US1 + US2 implementadas em feature/scheduling-management-20260915, código 35687fe.
Oferta própria da agenda, expediente/jornada/almoço, disponibilidade, reserva,
lista diária, remarcação, cancelamento e histórico. Todos os gates aprovados e revisão visual concluída. Processamentos integrado em origin/dev 154cbed e incorporado à entrega.

## Gates

CI do código: [35015201675](https://github.com/Komunick/caabnovo/actions/runs/35015201675).

| Gate | Resultado |
| --- | --- |
| Formatação, lint, tipos | Aprovados |
| Unitários | 291 aprovados; 9 específicos de contratos/horários da agenda |
| Contratos | 105 aprovados |
| Integração PostgreSQL | 181 aprovados; 21 específicos de Agendamentos |
| Migration do zero | 0020 aplicada com histórico, FKs, GiST e grants validados |
| Build de produção | Aprovado, incluindo páginas e API da agenda |
| Segurança | Dependências e verificação de segredos aprovadas |
| Navegador e acessibilidade | 69 E2E e 6 testes de acessibilidade aprovados |

A execução local paralela inicial de unitários teve falha de processo. A repetição
com um worker passou sem erros; o CI também passou. Integração, build e navegador
rodaram somente no CI. Nenhum seed foi executado no banco do preview.

## Provas de integridade e acesso

- Qualquer sessão ativa do painel usa Agendamentos. Guarda relê usuário/sessão na
  transação; não concede permissões de Associados ou outros módulos.
- Beneficiários: projeção mínima de nome, ano e OAB; confirmação recusa arquivo,
  bloqueio próprio ou titular vigente bloqueado. Inativo não cria veto novo.
- Advisory lock transacional 5010/1 coordena escritas da agenda e elegibilidade,
  antes dos locks de linhas do domínio. Teste com comandos reais de bloquear,
  vincular e desvincular aguardando o lock confirma a releitura após a espera.
- Vinte pedidos diferentes disputam uma vaga: um sucesso. Vinte repetições da mesma
  chave/payload retornam a mesma reserva, com um evento. Payload diferente é recusado.
- GiST impede sobreposição global por profissional, inclusive entre unidades e
  em insert SQL direto. Intervalos adjacentes são permitidos.
- Almoço, expediente, dias fechados, ofertas inativas, horários passados e inícios
  forjados são recusados. Expediente e duração precisam ser escolhidos explicitamente.
- Horários/ativação incompatíveis com reservas futuras são recusados. Alteração de
  duração não reescreve compromissos existentes. Remarcação faz rollback integral
  em conflito e rejeita versão desatualizada.
- Cancelar libera a ocupação sem apagar registros. Replay não duplica eventos.
  Histórico e auditoria são append-only; não há motivo obrigatório.
- Catálogo distingue nomes iguais por unidade e preserva referências legíveis na
  edição. Lista e histórico são paginados; filtros da agenda permanecem na URL.
- Mutações validam Origin, CSRF, JSON limitado a 64 KiB e contratos; respostas
  no-store. Erros técnicos não entram no texto mostrado ao operador.

## Desempenho observado

Consulta diária de 10.000 reservas sintéticas canceladas retornou 25 registros em
154 ms no CI acima. Medição única no runner de CI, inferior à meta proposta de 2 s;
não é SLA nem prova de capacidade de 10.000 atendimentos simultâneos.

## Contraste do menu compartilhado

O teste de desktop identificou perda de contraste enquanto somente o fundo do menu
da conta animava na troca de tema. A correção mantém texto e fundo no mesmo tema
e preserva a transição de borda. O teste compartilhado agora mede os textos do
perfil durante a transição, além de executar Axe na jornada. Cabeçalho e atalhos
identificam Agendamentos como área disponível. Pesquisa e tarefas na spec 002.

## Evidências de interface

A jornada cria associado e toda a oferta pelo painel, sem SQL de preparação da
agenda; entra com conta comum, configura unidade/serviço/procedimento/profissional/
habilitação e horários, reserva, recarrega, filtra, remarca, consulta histórico e
cancela. Confere a vaga liberada, recuperação de erro, vazio, teclado, foco do
diálogo e overflow. Axe verifica WCAG 2.2 AA durante a jornada.

Capturas sintéticas do artefato scheduling-synthetic-evidence, CI 35015201675,
código 35687fe. As cinco imagens foram revisadas: formulários, ações e histórico
legíveis em celular de 390 px e desktop de 1280 px, nos temas apresentados, sem
extravasamento horizontal. O commit final acrescenta somente documentação e capturas.

Capturas:

- [Oferta em celular claro](scheduling-catalog-mobile-light.png).
- [Reserva em celular claro](scheduling-reserve-mobile-light.png).
- [Detalhes em celular escuro](scheduling-detail-mobile-dark.png).
- [Detalhes em desktop claro](scheduling-detail-desktop-light.png).
- [Detalhes em desktop escuro](scheduling-detail-desktop-dark.png).

## Migration e rollback

0020_scheduling.sql é aditiva; usa a extensão PostgreSQL btree_gist, cria tabelas,
FKs, índices, exclusão temporal, trilhas e grants mínimos do runtime. Não altera
nem migra dados reais. O executor existente aplica migrations na ordem.
Sem variáveis de ambiente novas ou dependências. Aplicar migration antes do rollout.
Rollback da aplicação preserva tabelas, reservas e trilhas; não executar DROP nem
apagar pedidos/histórico. Revisão humana: regras de agenda, bloqueios e auditoria.

## Limites e próximo passo

Uma faixa semanal por dia e almoço opcional. Sem virar a noite, exceções de agenda,
salas, grupos, avaliações, no-show/completed, lembretes ou punições. Nenhuma integração
nova com Cal.com, legado ou canais app/site. Dados pessoais reais não foram usados
nos testes; preview, PostgreSQL e demais serviços locais permaneceram desligados.

Após revisão desta entrega, o próximo passo é UI01 do programa 002 e T022 da spec 008:
especificar a primeira interface do usuário no app/site, incluindo identidade,
contratos de reserva e transição do legado. T021–T024 são posteriores; esta entrega
não implementa automaticamente esses incrementos nem reativa CAASSH.