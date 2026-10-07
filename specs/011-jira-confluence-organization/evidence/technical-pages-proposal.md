# Conteúdos técnicos propostos

Prévia integral das páginas existentes. Regras remotas duplicadas serão consolidadas; histórico
permanece nas versões. Fontes locais: constituição 2.1.0 e AGENTS vigente; Stack/manifests em
dev748539d; entrega documental local de 23/09 consultada como proposta, não como publicação. Não
republicar preços/quotas comerciais históricos como atuais.

## Alvo 2621487: Regras e Restrições do Projeto

# Regras e Restrições do Projeto

Orientação vigente reconciliada em 01/10/2026. Fontes: AGENTS da pasta principal, constituição
2.1.0, workflow de entrega e specs da função. Esta página orienta a consulta; não substitui decisões
e evidências responsáveis nem concede autorização por si.

## Entrada e documentação

A cada pedido, ler AGENTS e docs/agentcache.md da pasta principal; confirmar objetivo, escopo,
autorizações e estado no Git. Consultar PRD/MODULES, spec, plano, tarefas e contratos responsáveis
antes de alterar função. Instruções adicionais do diretório também se aplicam. Não criar
documentação concorrente de função existente. Specs em andamento ficam na worktree da entrega.

## Branches e preservação

Manter principal em dev, sincronizada por fetch e fast-forward quando seguro. Conferir
alterações/divergências e preservar trabalho local antes de movimentá-lo. Uma branch/worktree por
entrega, salvo isolamento pedido. PR aberto pode receber correções; PR integrado encerra a branch
para trabalho novo. Não apagar worktrees, ignorados, dependências, ambientes ou backups por
organização genérica. Não fazer commit/push direto em dev/main.

Abrir/reabrir PR, aprovar ou integrar exige pedido explícito. Merge em main é exclusivamente humano.
Checks não substituem aprovação. Não modificar metadados de PR integrado nem reutilizar sua branch
para trabalho novo.

## Implementação e qualidade

Aplicar KISS, DRY e YAGNI; preservar o monólito modular e contratos. Regras críticas e autorização
ficam no servidor. PostgreSQL é autoridade para dados, agenda, permissões e auditoria;
constraints/transações protegem integridade e concorrência. Não inventar regras de produto ausentes.

Selecionar validações pela stack e pelo risco real da mudança; registrar versão, comandos,
resultados e limites. Antes de merge, cumprir gates aplicáveis de lint, tipos, testes e build.
Alterações sensíveis exigem revisão humana específica. Não contornar checks ou apresentar CI como QA
humano. A documentação tem formatação explícita: o comando geral pode ignorar docs/specs.

## Segurança e histórico

Autenticação, sessão e autorização server-side com menor privilégio e negação por padrão. MFA não
integra o requisito vigente. Preservar validações de upload, arquivos privados, sanitização,
proteção de dados e auditoria append-only; nunca registrar segredos.

Motivo é obrigatório nas solicitações de exclusão de Colaboradores e Associados, conforme decisão de
21/09. Nas demais ações, não reintroduzir justificativa genérica obrigatória. Preservar motivos
históricos, autor, data e eventos, sem preenchimento retroativo fictício. Regras de
explicação/comprovante de um processo específico, como pedido de falta, pertencem ao seu contrato e
não são justificativa genérica de edição.

## Banco, arquivos e ambientes

Preservar dados, contas, permissões e funcionalidades aceitas. Testes usam dados sintéticos e
ambientes descartáveis; não aplicar seeds no banco de uso. Migrations são versionadas, sem
reescrever as já aplicadas. Aplicação no banco real e infraestrutura exigem escopo autorizado.
Arquivos usam a arquitetura documentada do projeto; retirada de uma tecnologia do código não
comprova desativação remota.

Não iniciar localhost ou serviços pausados sem ordem explícita. Quando autorizado, seguir runbook,
atualizar preview para a versão atual e preservar banco. Configuração em infra/compose não é prova
de implantação. Backups exigem preservação e verificação; nenhuma limpeza destrutiva implícita.

## Interface

Antes de planejar/alterar UI, ler docs/caab-design.md vigente e os critérios da função. Ao concluir,
revisar e registrar evidências. WCAG 2.2 AA, sem significado apenas por cor/ícone; Lucide é padrão.
Não inventar guia substituto se a fonte não estiver disponível.

## Integrações

OAB somente por integração oficial formalmente autorizada ou consulta manual registrada; sem
scraping, automação para contornar CAPTCHA ou decisão crítica automática a partir da consulta.
Preservar compatibilidade dos contratos externos versionados. Jobs exigem idempotência,
observabilidade e rastreabilidade proporcionais. Não ativar canais, importar legado ou alterar
infraestrutura por inferência.

## Caderno e autoria

Usar somente o agentcache da pasta principal para as frentes compartilhadas. Registrar pedido,
autor/solicitante, estado, worktree, próximo passo e impedimentos; reler antes de salvar. Transferir
informação duradoura para fonte responsável e retirar nota concluída. Não transformar caderno em
backlog/histórico completo. Identificar autor real do registro; consultar solicitante no perfil
GitHub autenticado uma vez por sessão. Na falta de prova, registrar não verificado; não deduzir de
nome de pasta ou autor Git.

## Trabalho no Jira e Confluence

Tipo segue entrega, sem obrigação de épico/história/spike. Testes rotineiros ficam no aceite:
revisão/testes IA e QA humano identificado, mantendo executor no Assignee. PR/histórico sustentam
atribuições; conta técnica não comprova autoria humana. Merge sem prova de QA não reabre
automaticamente item histórico. Sugestões e funcionalidades previstas ficam no Confluence com
vínculo à execução quando definida.

Preservar chaves, páginas e histórico. Quando houver histórico visível, manter o corpo vigente sem
diário duplicado. Não enviar mensagens a terceiros sem instrução explícita. Operações reversíveis já
autorizadas não exigem reconfirmação a cada passo; o escopo e a revisão concreta pedida pelo usuário
continuam valendo.

## Fontes

[Constituição](https://github.com/Komunick/caabnovo/blob/dev/.specify/memory/constitution.md) ·
[Workflow](https://github.com/Komunick/caabnovo/blob/dev/docs/DELIVERY-WORKFLOW.md) ·
[Stack](https://github.com/Komunick/caabnovo/blob/dev/docs/STACK.md) ·
[Ferramentas](https://github.com/Komunick/caabnovo/blob/dev/docs/TOOLING.md).

AGENTS e runbook locais devem ser lidos no checkout vigente; não prometer URL GitHub para arquivo
ainda não versionado.

---

## Alvo 2588776: Stack, ferramentas e processo

# Stack, ferramentas e processo

Referência de navegação técnica para toda a equipe, também ligada pelo Banco de Consulta da I.A.
Revisão em 01/10/2026 contra dev 748539d e fontes da entrega. A fonte de versões efetivas é o
manifest/lockfile do checkout, não uma tabela copiada de versões nesta página.

## Arquitetura e dependências

Monorepo com painel Next.js/React e BFF, worker e pacotes compartilhados; monólito modular, sem um
serviço por domínio. TypeScript no produto; SQL para persistência; Python apenas como ferramenta
auxiliar quando usado na manutenção.

- Web: Next.js App Router, React, Tailwind, Radix Dialog, Lucide, Zod e autenticação Better Auth.
- Notícias: Payload CMS, adaptador PostgreSQL e editor Lexical.
- Persistência: PostgreSQL, Drizzle e consultas SQL/pg; dados e conteúdo de arquivos no banco
  segundo os contratos.
- Worker: pg-boss, Pino, file-type e OpenTelemetry nas dependências/configuração.
- Exportações: núcleo direto compartilhado, Excel/CSV/PDF; consumidores têm entregas próprias.
  Relatórios detalhados sem agrupamento foram integrados pelo PR40; demais modos não se tornam
  completos por isso.
- Agenda: FullCalendar integrado pelo PR34; não é apenas opção futura. Read/write possui base no
  PR36; extensões administrativas/faltas e correções de 30/09 estão em worktree local, sem
  integração comprovada.

[Manifests e lockfile](https://github.com/Komunick/caabnovo/tree/dev) e
[STACK.md](https://github.com/Komunick/caabnovo/blob/dev/docs/STACK.md) definem versões e
arquitetura. Referências históricas podem ter estado superado; conferir PR/evidência da função. Não
inferir hospedagem a partir de dependência.

## Organização

apps/web: páginas/APIs/domínios; apps/worker: processamento; packages/db: repositórios/migrations;
packages/contracts: contratos; packages/news/config: componentes compartilhados; infra:
configuração; docs: referências; specs: entregas.

TanStack Table/Query, React Hook Form, shadcn/ui, Cal.com e Caddy citados em material histórico não
ganham status de dependência instalada por citação. Conferir código/manifest antes de afirmar
adoção. S3/MinIO não é o armazenamento atual de arquivos; não presumir estado de serviços remotos.

## Testes e qualidade

Vitest para unitários/contratos/integrações; Playwright e Axe para jornadas/acessibilidade;
Testcontainers para bancos descartáveis. ESLint, TypeScript, Prettier e gates GitHub Actions;
verificações de segredos/dependências conforme workflow.

O .prettierignore ignora documentação geral. Usar comandos explícitos de
[TOOLING.md](https://github.com/Komunick/caabnovo/blob/dev/docs/TOOLING.md) para docs/specs.
Código/testes aprovados não certificam QA humano nem produção implantada.

## Spec Kit

Configuração local registra Spec Kit 1.0.2 com PowerShell e specs numeradas. Disponíveis:
constitution, specify, clarify, plan, tasks, checklist, analyze, implement, converge e
taskstoissues. Cada comando tem finalidade; sua disponibilidade não significa execução automática.
taskstoissues cria issues GitHub, não converte tarefas para Jira. Diretório numerado identifica a
spec, não impõe nova branch. A seleção da feature é local por worktree.

## Ferramentas do agente

Git, terminal, conectores, navegador e skills auxiliares dependem da sessão; não são dependências do
CAAB. Leitura de Jira/Confluence foi confirmada para esta organização em 01/10/2026; não há
sincronização automática estabelecida. Capacidade de leitura não comprova qualquer permissão de
escrita.

## Comunicação prevista

WAHA está escolhido para o recorte de WhatsApp de Agendamentos, sem instalação/ativação presumida.
Ticketz (atendimento), FreeResend + SES, Resend, Brevo (e-mail) e SMSGate (SMS) permanecem
referências de planejamento da página anterior; adoção e disponibilidade precisam ser confirmadas no
recorte responsável. Valores/limites comerciais antigos não são reproduzidos como atuais.

Nodemailer instalado não prova envio de campanhas nem entrega dos avisos de Agendamentos. CAAB-2
trata serviço transacional; caixa de entrada é próxima funcionalidade com escopo pendente.
Transporte real de avisos é trabalho distinto de intenção persistida. Preferências comerciais de
campanhas não substituem regra operacional confirmada.

## Infraestrutura e estado local

Compose/infra descrevem PostgreSQL, antivírus e telemetria configurados. Não foi verificada
implantação remota. Localhost/serviços pausados permanecem sujeitos a autorização. A conciliação
documental de 23/09 está em entrega local; não tratá-la como documento integrado sem conferir Git.

[Regras](https://komunick.atlassian.net/wiki/spaces/CAABNOVO/pages/2621487) ·
[Workflow](https://github.com/Komunick/caabnovo/blob/dev/docs/DELIVERY-WORKFLOW.md) ·
[Specs](https://github.com/Komunick/caabnovo/tree/dev/specs).
