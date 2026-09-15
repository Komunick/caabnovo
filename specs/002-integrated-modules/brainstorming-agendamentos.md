# Brainstorming: Agendamentos

Atualizado em 15/09/2026. Estado: brainstorming e pesquisa em andamento; sem implementação.

## Decisões vigentes do usuário — 15/09/2026

- **Qualquer pessoa com acesso válido ao painel administrativo pode consultar e fazer
  alterações em Agendamentos.** Não exigir papel de gestor, vínculo com profissional,
  restrição por unidade ou permissão adicional específica do módulo nesta etapa.
  A autenticação e a auditoria das alterações permanecem. Esta decisão trata do acesso
  a Agendamentos; não altera as permissões dos demais módulos.
- O painel é o local onde **a CAAB administra a oferta e o serviço de agendamentos
  do app/site**. O acesso independente de negócios/profissionais não é premissa atual.
- A CAAB cadastra unidades; **cada unidade oferece um ou mais serviços**. Cadastra
  também profissionais e procedimentos e configura suas relações na oferta.
- O módulo permite configurar quando a unidade estará aberta e as demais condições
  de funcionamento da agenda, cujo detalhamento continua no brainstorming.
- **Ver e gerenciar avaliações faz parte do módulo.** Responder, ocultar, excluir,
  publicar e critérios de avaliação ainda precisam de definição; não presumir que
  gerenciar autoriza reescrever a opinião do autor.
- Exemplo fornecido: um local que oferece massagens, com cadastro da unidade, seus
  serviços, profissionais e procedimentos. Nomes, durações e relações específicas
  dos exemplos da pesquisa são ilustrativos, não configurações reais aprovadas.
- **Cal.com é referência de pesquisa. Não integrar ao projeto, salvo se nenhuma
  outra possibilidade for encontrada.** Comparar primeiro uma solução própria e
  alternativas viáveis; preferência ou conveniência não satisfazem essa condição.
- O pedido autoriza registrar decisões e pesquisar o mercado; a implementação
  continua pendente de consolidação do escopo.

Estas decisões substituem a hipótese de administração autônoma por profissionais/
negócios e a abertura genérica anterior para integrar Cal.com no futuro. Mantêm o
recorte multissetorial e CAASSH desativado.

Pesquisa complementar: [gestão pela CAAB — 15/09/2026](pesquisa-gestao-agendamentos-2026-09-15.md).

## Histórico confirmado em 14/09/2026

- O módulo se chama **Agendamentos**, não Atendimentos.
- A próxima versão será uma grande evolução e precisa de novo brainstorming.
- A formulação inicial previa profissionais/negócios configurando reservas em diferentes
  áreas: barbearia, medicina, futevôlei, fisioterapia, psicologia, spa e zumba.
  A administração foi esclarecida em 15/09: será feita pela CAAB no painel administrativo.
- Restaurantes foram retirados do recorte atual; registrar somente a possibilidade futura.
- A etapa atual é **somente pesquisa**, com conclusões para revisão posterior. Não iniciar
  implementação nem converter propostas do mercado em regras aprovadas.
- CAASSH está desativado e pendente de revisão; não pressupor dependência de créditos.

## Pesquisa registrada

[Pesquisa de mercado de 14/09/2026](pesquisa-mercado-agendamentos-2026-09-14.md):
comparação de fontes oficiais de plataformas de beleza, saúde, esporte, bem-estar
e reservas multissetoriais. Distingue atendimento individual, vaga em sessão coletiva,
recursos físicos, repetição da oferta e reserva recorrente do participante.

Estado: concluída para revisão, sem aprovação das propostas. Referências de restaurantes
foram preservadas e identificadas como possibilidade futura. Não foi criada spec funcional.

## Continuidade da conversa

Administração, finalidade, canais app/site, unidade com vários serviços, cadastro
de profissionais/procedimentos e gestão de avaliações estão esclarecidos. Detalhar
um caso de massagem da configuração à reserva, realização, cancelamento e avaliação.
Confirmar se serviço agrupa procedimentos, se um procedimento/profissional atende
várias unidades e como isso será mostrado no app/site.

## Tópicos a explorar a partir do fluxo

- Quem pode agendar, para quem e em quais canais.
- O que é reservado: serviço, profissional, sala, equipamento ou capacidade de grupo.
- Como a oferta é criada e como se encontram horários adequados.
- Confirmação, remarcação, cancelamento, presença e falta.
- Exceções, conflitos e decisões que exigem intervenção da equipe.
- Comunicações, integrações, permissões e acompanhamento da operação.
- O que precisa estar na primeira entrega e o que pode ser evolução posterior.

Esses tópicos são perguntas de descoberta, não funcionalidades aprovadas.
Nenhuma duração, capacidade, penalidade ou regra de elegibilidade foi definida.
A proposta anterior de regras configuráveis sem penalidades não foi aceita como escopo.

## Resultado esperado

Registrar decisões, alternativas e dúvidas; consolidar jornadas e limites; criar
a spec funcional com plano, tarefas e critérios de aceite após o brainstorming.
US4/T022–T026 do programa anterior permanecem como referência suspensa.
