# Implementation Plan: Conta: conciliação e regressão dos controles existentes

**Branch da entrega**: `docs/project-clarify-20260921` | **Data**: 2026-09-21
**Spec**: [spec.md](spec.md) | **Estado**: desenho concluído; implementação/validação pendentes.

## Summary

Preservar conta pessoal e recusas de concessão durante a adequação transversal, sem reintroduzir MFA ou justificativa.

US1/US2/US4 permanecem implementadas conforme evidências existentes; US3 recebe revisão documental/regressão. Não criar exportação de senhas, tokens ou novo módulo Conta.

## Technical Context

TypeScript 6.0.3, Node 24, Next 16.3.4, React 19.2.8, Zod 4.5.4 e pg8.23.0 do checkout;
PostgreSQL 18 no CI. Monólito modular; banco também armazena arquivos legados. Sem S3/MinIO
novo. Testes Vitest 4.1.11, Playwright 1.62.1 e Axe existentes. UI desktop/390 px, temas,
teclado e tokens compartilhados. Exportação incremental com pg-cursor/ExcelJS propostos
e PDFKit existente, sujeitos a spike/versão fixada no código; nenhum pacote instalado agora.

**Performance/escala**: preservar p95 de 2s das telas comuns; não aplicar esse alvo a
transferência integral arbitrária. Exportações não têm teto funcional de registros/período.
Aplicar o [perfil C1 de100 registros](../002-integrated-modules/export-validation-100.md):
medir tempo/recursos e validar integridade, resposta do painel e recuperação. Sem prova
de estresse/grande volume nesta rodada; manter produto sem teto funcional de registros.
**Restrições**: banco único, autorização atual por ação; sem localhost, deploy, seed real,
limpeza de dados ou implementação nesta fase. Q10/Q11 e módulos futuros continuam adiados.

## Constitution Check

Pré-pesquisa: escopo decorre de Q1–Q11 e complementos, sem política institucional inferida.
Pós-desenho: monólito/fonte única, negação por padrão, auditoria mínima, integridade no
PostgreSQL e UI compartilhada preservados. Constituição 2.0.0 concilia justificativas já
retiradas; autenticação continua sem MFA. Abstração de exportação cobre oito consumidores
reais, sem CRUD genérico. Não há violação de desenho sem justificativa. Aprovações
institucionais/produção permanecem pendentes; compatibilidade do desenho não é execução de gates.

## Phase 0 — Research

Decisões, alternativas e fontes em [research.md](research.md), com pesquisa transversal
[de 21/09](../002-integrated-modules/research-2026-09-21.md). Leitura estática conclui
as escolhas necessárias para este recorte; limitações operacionais viram validações
de implementação, não requisitos indefinidos. Sem consulta a contas/dados de produção.

## Phase 1 — Design

- Concessões continuam pelo gestor autorizado em Colaboradores, sem MFA e sem justificativa. Ajuste transversal do catálogo não concede gestão de usuários via configurações pessoais.
- Preservar senha atual/confirmar e-mail, expiração/uso único de tokens, revogação de sessões, proteção contra autoelevação e último administrador. Prazos de tokens de segurança não são prazo de exportação.
- Reconciliar contratos/modelo com remoções já executadas; não reexecutar migration0012 nem limpeza de segredos. Rodar regressão direcionada quando o catálogo e autorizadores forem implementados.
- Sem nova entidade, biblioteca, serviço externo ou mudança de autenticação. Templates e pesquisa de novos recursos de conta ficam fora do recorte.

Modelo em [data-model.md](data-model.md), interface em [contracts/exports.md](contracts/exports.md)
e [contrato comum](../002-integrated-modules/contracts/direct-exports.md). UI preserva
rascunhos/filtros e dados em falhas, sem exigir justificativa. Catálogo de colunas é
allowlist por função; servidor não confia no catálogo antigo do navegador.

## Project Structure

- `apps/web/modules/auth/account-settings-service.ts` (existente).
- `apps/web/modules/users/role-assignment-service.ts` (existente).
- `apps/web/modules/users/ui/role-grant-error.ts` (existente).
- `apps/web/tests/integration/account-settings.test.ts` (existente).

## Rollout, migração e rollback

Uma entrega/worktree; mudanças SQL aditivas e numeradas coordenadas pela spec001.
Preparar compatibilidade de leitura de chaves/snapshots antes de ativar migrações e
novos botões. Conta sem acesso não ganha concessão para preservar conveniência.
Diagnosticar conflitos antes da restrição008; parar sem corrigir registros automaticamente.
Rollback da UI/API deve preservar grants convertidos, dados e arquivos; não publicar
binário antigo que dependa exclusivamente de audit:export/reports:export após conversão.
Preferir correção compatível para frente; reversão SQL exige plano e evidência próprios.

## Validation e próximo passo

Usuário comum acessa sua conta, não altera outra nem ganha permissão; gestor concede sem MFA/justificativa, recusas permanecem específicas e último administrador protegido.

Executar roteiro [quickstart.md](quickstart.md) na implementação. Evidência anterior
nunca conclui tarefa nova. Pesquisa/plan encerrados; próximo comando desta solicitação:
speckit-tasks, organizado por história, com dependências e critérios independentes.

## Complexity Tracking

Núcleo comum necessário para aplicações repetidas em oito funções; adaptadores mantêm
as regras dos domínios. Sem microserviço, linguagem nova ou nova fonte de verdade.
Estado operacional serve somente à transferência atual; não é fila/histórico obrigatório.

## Histórico anterior — referência, não sequência executável atual

O conteúdo abaixo preserva decisões/evidências anteriores. Em caso de divergência,
valem o desenho de 21/09 acima e a spec vigente; não reabrir branches/PRs já integrados.

<details>
<summary>Plano anterior preservado</summary>

# Plano: Configurações da conta

Branch: `feature/account-settings`, base `origin/dev`. Status: implementação e correções verificadas; PR autorizado pelo usuário em 10/09/2026 após aprovação dos testes.

## Estrutura

- Página autenticada `/settings`, acessível sem `users:update`, com seções Perfil e Segurança.
- Componentes em `apps/web/modules/auth/ui`; mensagens de concessão no módulo Usuários.
- Alterações da própria conta passam por rotas `/api/v1/me/*`, derivando o usuário da sessão e validando origem, CSRF, payload estrito e versão.
- Operações transacionais em módulo auth usando PostgreSQL, credenciais Better Auth e auditoria existente. Não criar segunda identidade.
- Autenticador retirado conforme FR-019. Remover plugin, telas e bloqueios; limpar os dados legados pela migração 0012 e preservar os controles de permissão e auditoria.
- Troca de e-mail aprovada: senha atual + link no novo endereço. Pedidos em `account_email_change`, token aleatório de 256 bits armazenado apenas como SHA-256, validade de 30 minutos, confirmação autenticada pelo titular e uso único. Novo pedido invalida o anterior; senha alterada também invalida pedidos pendentes.
- Envio via SMTP configurável; Mailpit restrito ao loopback no local. Modo real exige HTTPS, servidor SMTP, autenticação e remetente. Procedimento obrigatório de transição em quickstart.md. Falha de envio desfaz o pedido; se a entrega ocorrer e o commit falhar, o link não é utilizável e um novo pedido deve ser feito.
- Menu de conta no nome reúne Configurações, Sessões e Sair na mesma branch. Não incluir configurações institucionais ou sugestões da pesquisa neste incremento.
- Campos de senha reutilizam `components/ui/password-input.tsx`, com Eye/EyeOff do Lucide, senha oculta inicialmente e botão que alterna a visibilidade sem enviar o formulário; aplicado no login, Configurações e recuperação (FR-018).
- Quando o menu é recolhido, o próprio contêiner do menu da conta recebe margem superior automática, mantendo o botão Conta no rodapé mesmo com o rodapé informativo oculto.

## Validação

- Recuperação por `/forgot-password` e `/reset-password`, com rotas de autenticação controladas, serviço transacional e envio SMTP. Link com token em fragmento, validade de 30 minutos, consumo único, troca da senha, auditoria, invalidação de pedidos e encerramento de sessões na mesma transação.
- Política compartilhada de novas senhas em contracts: 12–72, maiúscula, minúscula e número; símbolo opcional. Hook de autenticação valida cadastro/alteração/redefinição antes de consumir o token. Formulários não exibem faixa numérica. Menu sem avatar, com nome ou “Conta” quando recolhido.

- Integração em PostgreSQL isolado: perfil, senha incorreta, conflito, identidade, revogação e auditoria sem segredos.
- Navegador: descoberta de Configurações sem permissões administrativas, alteração de dados, recuperação e erros de concessão.
- Typecheck, lint e formatação dos arquivos alterados; verificar teclado, 390px e axe.
- Não modificar as contas pessoais existentes nos testes. Usar contas sintéticas próprias da jornada.

## Entrega

Branch e spec independentes de Associados. Publicar a branch e abrir PR para dev após concluir os testes, conforme autorização explícita do usuário em 10/09/2026. Preservar revisão humana específica de autenticação/permissões e CI antes de merge; homologação em DEV ocorre no fluxo de entrega.

Campos comuns (11/09/2026): consumir ValidatedTextField/requiredEmailSchema em
login, recuperação e solicitação de novo e-mail. Manter senha, confirmação e
política de envio; validar entrada inválida sem chamada HTTP e fluxos já aceitos.
Entrega transversal nas tarefas CF01–CF03 da fundação.
## Plano da padronização de justificativas — 14/09/2026

1. Atualizar contratos de criação/alteração e registrar a distinção no serviço e auditoria.
2. Ajustar formulários e mensagens; manter ações sensíveis, permissões e concorrência.
3. Cobrir contratos negativos, criação sem motivo e motivo persistido em integração/E2E.
4. Executar formatação, lint, typecheck e testes sem serviços locais; CI executa banco,
   navegador e build. Abrir PR somente após validar a branch nova. Esta entrega é uma
   regra compartilhada coesa, coordenada pela spec 001, sem criar spec duplicada.


## Regra vigente: nenhuma justificativa obrigatória — 14/09/2026

Atualizar contratos e serviços desta função para aceitar omissão/vazio; manter o campo opcional no contrato para compatibilidade com clientes antigos. Retirar entradas, estados e bloqueios de justificativa das telas. Normalizar ausência para vazio nas colunas históricas não nulas e para null na auditoria; preservar autoria, resultado e datas. Migration aditiva de política retira somente restrições de texto obrigatório, mantendo consistência das decisões. Não são necessários estados especiais de criação de notícia. Cobrir ausência em contratos, autorização, integração e E2E; executar banco/navegador/build no CI com serviços locais desligados.

## Âncoras e streaming — 15/09/2026

Após montagem do AccountSettingsForm, verificar somente profile-title/email-title/password-title no hash e posicionar a seção no próximo frame. Cancelar frame ao desmontar. Validar pesquisa geral até a seção de senha em390px e entrada direta nas três seções. Incremento junto à navegação na branch única; nenhum contrato ou dado alterado.


## Preservação compartilhada — 16/09/2026

Branch fix/scheduling-select-20260916, baseada em dev após PR29. Usar armazenamento temporário
em memória no layout autenticado, por rota/formulário/cadastro, com controles nativos e estado
React preservados. Integrar sucesso/cancelamento aos descartes e testar navegação entre módulos.
Não usar cache público, localStorage ou salvamento automático no banco.

## Senha inicial — 17/09/2026

Gerador server-only com crypto.randomInt e lista local; hashPassword do Better Auth. Inserir account/credential na transação de criação. Resposta exclusiva de criação com initialPassword string/null; reenvio idempotente retorna null. Recibo transitório em memória com controles compartilhados. Ação no detalhe para cadastro sem senha: lock da conta, sessão/permissões revalidadas e comparação da autoridade. Não sobrescrever credenciais existentes. Sem migration ou backfill. Specs 001/006 compartilham o código. Testes leves locais e integração/E2E/build no CI; banco/preview pausados, nenhum merge automático.

## Checkpoint de revisão de código — 21/09/2026

Perfil/senha/troca de e-mail, recuperação, menu e senha inicial implementados. Não há MFA nem provedores sociais configurados. T025 registra homologação de entrega SMTP não comprovada, sem afirmar falha do ambiente. Tema Vitória e OAuth seguem futuros; preservação de erros transversal em 001 T097.

Revisão estática da base `ed31baf`; nenhum teste de aplicação ou homologação nesta etapa.
Evidências e limites: [revisão transversal](../002-integrated-modules/code-audit-2026-09-21.md).

Executar adequações e seus testes em retomada de implementação. Preservar dados e decisões adiadas; a revisão atual altera somente documentação.

</details>

## Complemento vigente I1 — 21/09/2026

Regressão T027/T028 deve usar a matriz dos três cargos de001. Gestor com consulta global, exportação geral e Relatórios completos pode conceder alteração de outro módulo que não possui a terceiro; não mostrar GRANT_BEYOND_AUTHORITY nesse caso. Gestor não altera a si nem atribui cargos; Colaborador não concede. Preservar Conta/Sessões e último Administrador.
