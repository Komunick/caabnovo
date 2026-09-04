<!--
Sync Impact Report
- Version change: scaffold sem versão -> 1.0.0
- Modified principles:
  - placeholder 1 -> I. Simplicidade antes da abstração
  - placeholder 2 -> II. Monólito modular e contratos explícitos
  - placeholder 3 -> III. Integridade no PostgreSQL
  - placeholder 4 -> IV. Segurança, privacidade e menor privilégio
  - placeholder 5 -> V. Auditoria, histórico e responsabilidade
- Added principles:
  - VI. Integrações autorizadas e rastreáveis
  - VII. Acessibilidade e consistência visual
- Added sections:
  - Restrições Técnicas e Operacionais
  - Fluxo de Entrega e Gates de Qualidade
- Removed sections: nenhuma; seções genéricas do scaffold foram concretizadas
- Follow-up TODOs: nenhum
-->
# Constituição do Projeto CAAB

## Core Principles

### I. Simplicidade antes da abstração

Toda alteração DEVE aplicar KISS, DRY e YAGNI. A solução DEVE atender ao requisito atual da
forma mais direta, legível e operável possível. Uma abstração somente PODE ser criada depois de
existirem pelo menos três repetições reais, equivalentes e demonstráveis, com responsabilidade
única e benefício superior à indireção adicionada. Similaridade aparente, reutilização hipotética
ou necessidade futura não confirmada NÃO justificam abstração.

Racional: simplicidade reduz custo de revisão, teste, operação, remoção e evolução do sistema.

### II. Monólito modular e contratos explícitos

O sistema DEVE permanecer um monólito modular. Notícias, agendamentos, associados, parceiros,
colaboradores, usuários e auditoria DEVEM possuir fronteiras claras de domínio, regras e acesso a
dados. Regras críticas DEVEM residir no servidor e no módulo responsável, nunca exclusivamente na
interface ou no CMS. A criação de serviços separados exige evidência verificável de uma fronteira
real de carga, segurança, implantação ou responsabilidade operacional.

Toda comunicação destinada ao aplicativo ou ao site externo DEVE usar API documentada e
versionada. Mudanças de contrato DEVEM preservar compatibilidade durante uma migração planejada ou
introduzir uma nova versão explícita.

Racional: fronteiras modulares preservam coesão sem antecipar a complexidade operacional de
microserviços, enquanto contratos versionados protegem consumidores externos.

### III. Integridade no PostgreSQL

O PostgreSQL DEVE ser a fonte de verdade para agenda, associados, permissões e auditoria. CMS,
cache, interface, calendário ou integração externa NÃO PODEM manter uma autoridade concorrente
sobre esses domínios.

Conflitos de agendamento DEVEM ser impedidos no servidor por transação e por restrição adequada no
banco. A confirmação DEVE revalidar a disponibilidade dentro da transação; validações visuais ou
prévias NÃO substituem essa garantia. Alterações de schema DEVEM usar migrations versionadas, e
chaves estrangeiras, constraints e índices DEVEM expressar a integridade aplicável.

Racional: invariantes persistidas no banco continuam válidas sob concorrência, retries e clientes
distintos.

### IV. Segurança, privacidade e menor privilégio

Toda ação executada no servidor DEVE autenticar a identidade quando não for pública e DEVE aplicar
autorização server-side com negação por padrão e menor privilégio. Administradores DEVEM usar MFA.
Papéis ou escopos informados pelo cliente NÃO PODEM ser tratados como fonte confiável.

O projeto DEVE adotar OWASP ASVS nível 2 como baseline verificável e cumprir a LGPD por meio de
finalidade, minimização, acesso controlado, retenção definida e descarte apropriado. Conteúdo rico
DEVE ser sanitizado contra código ativo e embeds não autorizados. Uploads DEVEM validar allowlist de
tipo, extensão, MIME real, assinatura, tamanho e nome físico gerado pelo sistema; arquivos DEVEM ser
isolados de caminhos executáveis e submetidos à verificação de segurança antes da disponibilização.
Dados pessoais e segredos DEVEM ser protegidos em trânsito, em repouso quando aplicável e em logs.

Racional: os controles protegem dados pessoais e operações críticas mesmo quando um cliente, arquivo
ou conteúdo externo é malicioso.

### V. Auditoria, histórico e responsabilidade

Alterações críticas DEVEM gerar auditoria append-only para a aplicação, contendo ator, ação,
entidade, identificador, data, origem e identificador de requisição; valores anteriores e posteriores
DEVEM ser incluídos somente quando permitidos e com campos sensíveis redigidos. Senhas, tokens,
cookies, segredos, arquivos completos e dados pessoais desnecessários NÃO DEVEM ser registrados.

O histórico de registros auditáveis DEVE ser preservado. Esses registros DEVEM usar exclusão lógica,
salvo exigência legal de descarte devidamente documentada. Ações sensíveis DEVEM exigir justificativa
registrada e autorização específica; a aplicação NÃO PODE editar nem apagar eventos de auditoria.

Racional: uma trilha íntegra permite atribuição de responsabilidade e investigação sem ampliar a
exposição de dados.

### VI. Integrações autorizadas e rastreáveis

A verificação da OAB NÃO PODE usar scraping, automação de navegador nem contornar CAPTCHA. Na
ausência de integração oficial formalmente autorizada, a consulta DEVE ser manual e registrar fonte,
data, método, operador e resultado. Uma integração oficial somente PODE ser adotada após autorização
e contrato técnico documentados; seu resultado NÃO PODE, isoladamente, determinar uma decisão
interna crítica.

Jobs assíncronos DEVEM ser idempotentes, observáveis e rastreáveis por identificador de correlação.
DEVEM persistir progresso, tentativas e estado terminal, aplicar retry controlado quando seguro e
registrar erros úteis sem expor segredos ou dados pessoais desnecessários.

Racional: integrações e jobs falham fora do controle da aplicação; autorização, idempotência e
rastreabilidade limitam duplicidade, abuso e decisões sem evidência.

### VII. Acessibilidade e consistência visual

Toda interface no escopo do projeto DEVE atender à WCAG 2.2 nível AA como critério de aceite,
incluindo contraste, foco visível, semântica, teclado e nomes acessíveis. Estado ou significado NÃO
PODEM ser comunicados apenas por cor ou ícone. Lucide React DEVE ser a biblioteca padrão de ícones;
logos e símbolos institucionais PODEM usar assets próprios, mas outra biblioteca de ícones exige
emenda a esta constituição.

Racional: acessibilidade é requisito funcional e uma linguagem visual única reduz inconsistência e
carga cognitiva.

## Restrições Técnicas e Operacionais

- APIs externas DEVEM possuir prefixo explícito de versão e documentação de contrato.
- Estados relevantes DEVEM usar valores controlados e transições server-side explícitas; textos
  livres NÃO PODEM funcionar como máquina de estado.
- Datas persistidas DEVEM usar UTC e ser exibidas no timezone de negócio definido pelo produto.
- Operações críticas sujeitas a retry DEVEM aceitar estratégia de idempotência proporcional ao risco.
- Decisões de implementação DEVEM permanecer coerentes com `docs/STACK.md`, salvo emenda aprovada ou
  decisão arquitetural documentada que não contradiga esta constituição.
- Regras de negócio ainda não confirmadas NÃO DEVEM ser inventadas. Lacunas DEVEM ser registradas na
  especificação da funcionalidade e validadas com a área responsável antes da implementação.

## Fluxo de Entrega e Gates de Qualidade

Toda mudança DEVE partir de branch curta `feature/*`, `fix/*`, `chore/*` ou `docs/*` e entrar por Pull
Request direcionado a `dev`. Commits ou pushes diretos em `dev` e `main` são proibidos. Produção
somente PODE receber Pull Request de promoção de `dev` para `main`, e o merge em `main` somente PODE
ser executado por mantenedor humano. CI, revisão e proteções de branch NÃO PODEM ser contornados.

Antes do merge, a mudança DEVE passar por lint, typecheck, testes aplicáveis e build de produção.
Testes de autorização são obrigatórios sempre que rota, ação, permissão ou papel for criado ou
alterado. Mudanças de UI relevantes DEVEM incluir verificação de acessibilidade; mudanças de banco
DEVEM validar migrations e constraints em ambiente descartável ou DEV. Falha em qualquer gate
bloqueia o merge.

Mudanças em autenticação, permissões, uploads, dados pessoais, agenda, auditoria, integrações ou
migrations destrutivas DEVEM receber revisão humana específica. O Pull Request DEVE explicar a regra
atendida, riscos, trade-offs, evidências de teste e estratégia de rollback quando aplicável.

## Governance

Esta constituição prevalece sobre práticas, documentos e convenções conflitantes do projeto.
`docs/PRINCIPLES.md` é a fonte principal de contexto de governança; `docs/PRD.md`, `docs/STACK.md` e
`docs/DELIVERY-WORKFLOW.md` orientam produto, arquitetura e entrega somente quando não contradizem
esta constituição.

Uma emenda DEVE ser proposta em Pull Request próprio ou em seção claramente identificada de um Pull
Request, descrever motivação e impacto, atualizar o Sync Impact Report e obter aprovação de mantenedor
humano. Mudanças incompatíveis com regras vigentes exigem versão MAJOR e plano de migração; novas
regras ou expansões materiais exigem versão MINOR; esclarecimentos sem alteração normativa exigem
versão PATCH.

Toda especificação, plano, lista de tarefas e Pull Request DEVE demonstrar conformidade com os
princípios aplicáveis. Revisores DEVEM bloquear alterações que violem uma regra obrigatória ou que
não apresentem justificativa e plano de correção aprovados. Exceções temporárias exigem decisão
humana documentada, escopo, responsável, risco aceito e prazo de expiração; uma exceção NÃO altera a
constituição.

A conformidade DEVE ser revisada em cada Pull Request e novamente antes de qualquer promoção para
`main`. Divergências entre documentos DEVEM ser resolvidas pela ordem de precedência acima e, quando
afetarem governança, por emenda versionada.

**Version**: 1.0.0 | **Ratified**: 2026-09-04 | **Last Amended**: 2026-09-04
