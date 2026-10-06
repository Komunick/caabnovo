# Conteúdos de produto e navegação

Prévia integral, sem publicação. IDs NEW-* serão resolvidos após criação autorizada; não são URLs de
páginas existentes.

## Alvo 1867914: CAAB — documentação do projeto

# CAAB — documentação do projeto

Ponto de entrada para a equipe de produto, operação e desenvolvimento.

## Encontrar informação

- [Visão do projeto](https://komunick.atlassian.net/wiki/spaces/CAABNOVO/pages/819227): objetivos e
  fontes funcionais.
- Funcionalidades previstas: capacidades confirmadas aguardando revisão ou detalhamento.
- Sugestões: ideias em avaliação, como RH.
- Guias de uso: operação e validação das funções, com versão coberta.
- Decisões: orientação vigente e referências.
- [Referência técnica](https://komunick.atlassian.net/wiki/spaces/CAABNOVO/pages/2588761):
  arquitetura, stack e ferramentas.
- [Banco de Consulta da I.A.](https://komunick.atlassian.net/wiki/spaces/CAABNOVO/pages/3244094):
  instruções dos agentes e links necessários.
- [Organização do Jira e Confluence](https://komunick.atlassian.net/wiki/spaces/CAABNOVO/pages/7143436):
  critérios e modelos de trabalho.

As seções também ficam acessíveis pela árvore do espaço. Funcionalidades previstas e sugestões não
representam entregas homologadas.

## Links da equipe

[Quadro CAAB](https://komunick.atlassian.net/jira/software/c/projects/CAAB/boards/9) ·
[GitHub](https://github.com/Komunick/caabnovo) ·
[Onboarding](https://komunick.atlassian.net/wiki/spaces/DEV/pages/426207) ·
[Índice de projetos](https://komunick.atlassian.net/wiki/spaces/DEV/pages/393230).

Permissões do espaço continuam gerenciadas separadamente em
[Usuários do espaço](https://komunick.atlassian.net/wiki/spaces/CAABNOVO/settings/members).

---

## Alvo 819227: Visão do projeto

# Visão do projeto

O CAAB é um sistema interno de gestão para operação administrativa, com domínios de associados,
colaboradores, parceiros, notícias, agendamentos, auditoria, comunicação e relatórios. O repositório
também contém planejamento e contratos para app, site e portal de parceiros.

## Como consultar o projeto

- [Repositório](https://github.com/Komunick/caabnovo) e
  [quadro CAAB](https://komunick.atlassian.net/jira/software/c/projects/CAAB/boards/9).
- [PRD](https://github.com/Komunick/caabnovo/blob/dev/docs/PRD.md): objetivos e escopo.
- [Módulos](https://github.com/Komunick/caabnovo/blob/dev/docs/MODULES.md) e
  [specs](https://github.com/Komunick/caabnovo/tree/dev/specs): fontes funcionais; conferir data,
  versão e evidências.
- [Referência técnica](https://komunick.atlassian.net/wiki/spaces/CAABNOVO/pages/2588776) e
  [regras](https://komunick.atlassian.net/wiki/spaces/CAABNOVO/pages/2621487).
- [Organização do Jira e Confluence](https://komunick.atlassian.net/wiki/spaces/CAABNOVO/pages/7143436):
  tipos, categorias, modelos e validação.

Descrição, planejamento, código integrado e homologação são estados diferentes. Não considerar toda
funcionalidade listada como pronta. Agendamentos possui base integrada e incrementos locais;
app/site continuam adiados. CAASSH/Portal aguardam revisão; RH é sugestão.

## Começar o trabalho

Siga o [onboarding Komunick](https://komunick.atlassian.net/wiki/spaces/DEV/pages/426207), leia
AGENTS do checkout e sua spec responsável. Confirme escopo, critérios e executor. Detalhes de deploy
e ambientes seguem o
[workflow de entrega](https://github.com/Komunick/caabnovo/blob/dev/docs/DELIVERY-WORKFLOW.md);
nenhuma implantação foi conferida por esta página.

---

## Alvo 2588761: Referência técnica

# Referência técnica

Índice técnico para toda a equipe. A antiga página vazia Home é reaproveitada, preservando seu ID.

- [Stack, ferramentas e processo](https://komunick.atlassian.net/wiki/spaces/CAABNOVO/pages/2588776).
- [Regras e Restrições](https://komunick.atlassian.net/wiki/spaces/CAABNOVO/pages/2621487).
- [Stack canônica do repositório](https://github.com/Komunick/caabnovo/blob/dev/docs/STACK.md).
- [Ferramentas e validação documental](https://github.com/Komunick/caabnovo/blob/dev/docs/TOOLING.md).
- [Entrega, revisão e deploy](https://github.com/Komunick/caabnovo/blob/dev/docs/DELIVERY-WORKFLOW.md).

Versões efetivas vêm dos manifests/lockfile da entrega. Configuração não comprova serviço
implantado. Especificações em desenvolvimento permanecem na worktree da entrega, sem cópia
concorrente na principal.

---

## Alvo 3244094: Banco de Consulta da I.A.

# Banco de Consulta da I.A.

Orientações e referências para agentes que trabalham no CAAB. O restante do espaço atende também à
equipe humana.

- [Regras e Restrições do Projeto](https://komunick.atlassian.net/wiki/spaces/CAABNOVO/pages/2621487).
- [Stack, ferramentas e processo](https://komunick.atlassian.net/wiki/spaces/CAABNOVO/pages/2588776),
  compartilhada com a Referência técnica.
- [Organização do Jira e Confluence](https://komunick.atlassian.net/wiki/spaces/CAABNOVO/pages/7143436).

A entrada local é AGENTS → caderno temporário → documentação responsável. Conferir o estado no Git e
nas evidências; memória, histórico e CI não concedem autorização. Não duplicar aqui uma segunda
stack.

---

## Alvo NEW-PREVISTAS: Funcionalidades previstas

# Funcionalidades previstas

Capacidades confirmadas para revisão ou detalhamento. Estar nesta seção não significa implementação,
homologação ou autorização para ativar integrações.

- CAASSH e Portal de Parceiros: página conjunta própria; créditos e operação do parceiro mantêm
  escopos distintos.
- Caixa de entrada: uma das próximas funcionalidades; definição de público, canais e ações pendente
  no [CAAB-2](https://komunick.atlassian.net/browse/CAAB-2).
- App/site de Agendamentos: adiado, acompanhado em
  [CAAB-30](https://komunick.atlassian.net/browse/CAAB-30).

Antes de executar, registrar escopo, critérios verificáveis, dependências e ticket correspondente.
Uma sugestão aprovada é movida para cá mantendo a mesma página e seus vínculos.

---

## Alvo NEW-SUGESTOES: Sugestões

# Sugestões

Ideias em avaliação, sem compromisso de implementação. Cada página descreve problema, hipótese,
origem comprovada, questões e decisão atual.

RH permanece como sugestão própria. Aprovação move a mesma página para Funcionalidades previstas e
vincula a execução quando houver escopo definido. Não criar cópia da página nem apresentar sugestão
como requisito aprovado.

---

## Alvo NEW-GUIAS: Guias de uso

# Guias de uso

Orientações verificadas para operação do CAAB e validação humana. Os guias devem identificar função
e versão cobertas, pré-requisitos, passos observáveis e limites.

Nenhum novo tutorial funcional foi homologado por esta reorganização. Consulte os critérios e
evidências da função antes de publicar passos como funcionamento atual. O modelo de QA está em
Organização do Jira e Confluence.

---

## Alvo NEW-DECISOES: Decisões

# Decisões do projeto

Registre a decisão vigente, contexto, origem comprovada e referências responsáveis. Diferencie
decisão de produto, proposta, implementação e homologação.

Consulte [PRD](https://github.com/Komunick/caabnovo/blob/dev/docs/PRD.md),
[módulos](https://github.com/Komunick/caabnovo/blob/dev/docs/MODULES.md) e a spec da função. Se um
documento contém histórico, confira a decisão vigente e evidência da entrega.

Regras de execução ficam em
[Regras e Restrições](https://komunick.atlassian.net/wiki/spaces/CAABNOVO/pages/2621487). Sugestões
ainda não aprovadas ficam em Sugestões. Quando o histórico de versões é visível, mantenha no corpo
apenas a orientação atual.

---

## Alvo NEW-CAASSH: CAASSH e Portal de Parceiros

# CAASSH e Portal de Parceiros

**Estado:** funcionalidades previstas, aguardando revisão. Ainda não implementadas como entregas
completas por falta dessa revisão. **Origem:**
[CAAB-34](https://komunick.atlassian.net/browse/CAAB-34) e
[CAAB-35](https://komunick.atlassian.net/browse/CAAB-35); confirmação do usuário na organização do
projeto.

## O que se pretende

CAASSH trata créditos/pontuação para associados. Portal de Parceiros oferece uma área externa para
estabelecimentos consultarem e validarem benefícios/cupons. As frentes caminham juntas, mas regras
de crédito e operação do portal não são a mesma responsabilidade.

## Por que é importante

A revisão conjunta permite definir a relação entre benefício, associado e parceiro antes de
construir interfaces ou integrações.

## O que precisa de revisão

- Finalidade e regras de geração, uso, validade e ajuste de créditos.
- Regras de cupons, QR, validação e prevenção de reaproveitamento.
- Identidade e permissões do operador do parceiro.
- Relação com cadastros existentes, auditoria e atendimento a exceções.
- Escopo de uma primeira entrega e seus critérios de aceite.

Não presumir integração bancária, valor monetário, política de crédito ou QR já confirmada. A
existência de contratos ou protótipos não comprova homologação.

## Entrada em execução

Decisões acima revisadas, primeira entrega delimitada e vinculada a ticket com critérios
verificáveis. Os tickets de origem permanecem acessíveis; esta página concentra o detalhamento
enquanto aguarda revisão.

---

## Alvo NEW-RH: RH — sugestão em avaliação

# RH — sugestão em avaliação

**Estado:** sugestão, sem implementação autorizada. **Origem:**
[CAAB-36](https://komunick.atlassian.net/browse/CAAB-36). Proponente original não verificado.

## Problema e hipótese

Avaliar se a equipe precisa de gestão funcional de pessoas além do cadastro de contas e permissões
já oferecido por Colaboradores.

## Questões a avaliar

- Qual necessidade operacional não é atendida hoje?
- Quais dados e processos pertenceriam ao RH?
- Quem consulta e altera esses dados, com qual finalidade e retenção?
- Como reutilizar identidades sem duplicar Colaboradores ou Associados?

## Decisão atual

Manter como sugestão separada de CAASSH/Portal. Não reativar requisitos históricos de RH por
inferência. Se aprovada, mover esta mesma página para Funcionalidades previstas, preservar URL e
vincular o trabalho definido.
