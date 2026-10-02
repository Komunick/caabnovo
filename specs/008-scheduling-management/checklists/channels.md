# Checklist de requisitos: Agendamentos no app/site — 2C

**Objetivo:** revisão profunda da clareza, completude e consistência das regras antes do implement.
**Criada:** 28/09/2026. **Feature:** [spec.md](../spec.md), [plan.md](../plan.md),
[contrato](../contracts/channels.md).

**Autoria:** preparação-documental-CODEX-mafaltti. Solicitante verificado na conexão GitHub em
28/09/2026: name mafaltti, login Danilo-Komunick. A atribuição identifica este registro, sem
reatribuir decisões históricas.

**Responsável pela revisão:** checklist gerada com speckit-checklist; os marcadores pertencem ao
revisor. [x] significa requisito revisado e satisfeito, nunca implementação concluída. Todos os
itens são criados abertos. speckit-implement lê esse estado e não altera os marcadores.

## Identidade, autorização e histórico

- [ ] CHK001 O login geral e a ausência de login separado estão definidos sem presumir
      compatibilidade técnica já comprovada? [Clareza; Spec decisões de 28/09; Contrato §1.1]
- [ ] CHK002 A representação titular/dependente, sua revogação e a diferença entre autor e
      beneficiário cobrem leitura, comandos e replay? [Completude; Spec 2C-FR-02/12; Contrato §2/8]
- [ ] CHK003 A transferência antes do aceite define elegibilidade do dependente, serviço preservado,
      versão e acesso ao histórico anterior? [Cobertura; Spec decisões de 28/09; Contrato §5]
- [ ] CHK004 A importação opcional do histórico está distinguida da continuidade das reservas
      futuras, sem inferir contadores/status antigos? [Consistência; Spec 2C-FR-06; Plano transição;
      T042/T077]

## Ocupação, tempo e remarcação

- [ ] CHK005 A confirmação imediata padrão, sua desativação e a ocupação de pedidos manuais estão
      explícitas para solicitações existentes e novas? [Completude; Spec 2C-FR-03; Contrato §5/6]
- [ ] CHK006 O envio de troca, falha pré-commit, recusa e desistência têm efeitos distintos e
      inequívocos sobre origem/destino? [Consistência; Spec 2C-FR-03/10/18; Contrato §5/6/7]
- [ ] CHK007 O limite de duas trocas distingue utilização reservada, confirmação, alternativas e
      retomadas do mesmo ciclo? [Mensurabilidade; Spec 2C-FR-11; 2C-SC-10]
- [ ] CHK008 O prazo padrão de 24 h, limite exato, edição/desativação e exceções de
      retomada/recuperação têm referência temporal definida? [Clareza; Spec 2C-FR-08/18/20;
      2C-SC-07/17/19]
- [ ] CHK009 A edição de pedido inicial após o horário antigo está separada da troca voluntária e
      revalida futuro/horizonte/antecedência no destino? [Cobertura; Spec decisões de 28/09;
      Contrato §5]
- [ ] CHK010 Cancelamento, decisão da equipe e edição concorrentes possuem resultado, versão e
      liberação de vaga definidos? [Completude; Spec 2C-FR-09/17; Contrato §5/7]
- [ ] CHK011 A recuperação por indisponibilidade define causa autorizada, mesmo ID, bloqueio real,
      isenção e ausência de data imposta? [Consistência; Spec 2C-FR-20; 2C-SC-19]
- [ ] CHK012 Os modos com profissional e por capacidade finita têm limites, escolha opcional e
      conflito global do beneficiário sem fallback implícito? [Completude; Spec 2C-FR-03/13/14;
      2C-SC-02/12/13]
- [ ] CHK013 Antecedência de novas reservas e horizonte de 90 dias têm padrão, fronteiras e efeito
      sobre registros existentes definidos? [Mensurabilidade; Spec 2C-FR-15/16; 2C-SC-14/15]

## Equipe, publicação e experiência

- [ ] CHK014 Prioridade por início original, desempates, atraso de análise e urgência pelo destino
      estão separados sem expiração automática? [Consistência; Spec 2C-FR-07/17/22; Contrato §7]
- [ ] CHK015 Equipe principal e backup exigem permissões e autoria auditável sem concessão
      automática pelo vínculo? [Clareza; Spec 2C-FR-21; 2C-SC-20]
- [ ] CHK016 Salvar/Publicar e suas variantes na edição definem rascunho isolado, publicação
      conjunta atômica e descrições persistentes abaixo dos botões? [Completude; Spec 2C-FR-19;
      2C-SC-18]
- [ ] CHK017 A jornada por beneficiário, serviços exclusivos de titular e estados de erro/pendência
      contemplam app e site? [Cobertura; Spec 2C-FR-25; 2C-SC-04/24; T072/T073]
- [ ] CHK018 Os critérios de teclado, 390 px, temas e contraste são verificáveis e o guia visual é
      gate antes de layout/edição de UI? [Mensurabilidade; Spec 2C-SC-04; T043/T075]

## Comunicação e contratos

- [ ] CHK019 Os quatro eventos, três canais ativos inicialmente e preferências individuais se
      distinguem de entrega comprovada e contato autorizado? [Clareza; Spec 2C-FR-23/24; Contrato
      §10]
- [ ] CHK020 Destinatários de dependente, vínculo atual e transferência são consistentes com
      revalidação antes de cada envio/reenvio? [Cobertura; Spec 2C-FR-24; Contrato §5/10]
- [ ] CHK021 WAHA escolhido/a instalar e e-mail existente têm limites de integração explícitos sem
      reabrir escolha de fornecedor? [Consistência; Spec decisões de 28/09; Contrato §10.1/12]
- [ ] CHK022 Tentativas, timeout, reconciliação, repetição do job e recibos fora de ordem têm
      limites sem prometer entrega exatamente uma vez? [Mensurabilidade; Contrato §10.2; T044/T069]
- [ ] CHK023 Fronteiras HTTP pública, de associado, administrativa e callback têm autorização,
      idempotência, versões e erros distinguíveis? [Completude; Contrato §1.3/2/11; T041/T047/T070]

## Prontidão e rastreabilidade

- [ ] CHK024 Os 25 requisitos e 24 critérios possuem cobertura nas 38 tarefas, com dependências e
      limitações de ambiente explícitas? [Rastreabilidade; Tasks cobertura de 2C; Quickstart
      V01–V12]
- [ ] CHK025 O escopo exclui expansão automática, distingue documentos de execução e exige
      autorização antes do implement? [Consistência; Spec limites de 2C; Plano entrada no implement;
      Tasks estratégia incremental]

## Notas

Revisão por responsável da entrega antes de código; referências FR/SC acima são do incremento 2C. O
estado histórico de requirements.md trata da etapa 1 e não aprova esta checklist. Itens abertos
exigem revisão ou autorização explícita para prosseguir conforme speckit-implement; isso não
dispensa os gates factuais de ambiente, guia, identidade, dados e integração. Resultados e
limitações da preparação: [checkpoint](../evidence/pre-implement-2026-09-28.md).
