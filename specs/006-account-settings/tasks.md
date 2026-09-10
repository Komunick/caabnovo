# Tarefas: Configurações da conta

- [x] T001 Criar branch própria baseada em dev e retirar o código de Configurações da branch de Associados.
- [x] T002 Registrar escopo e cenários em spec.md; incorporar a escolha de senha atual + link e a exigência de substituir o envio local fora do localhost.
- [x] T003 Implementar edição do próprio nome com validação de sessão e versão, auditoria e formulário.
- [x] T004 Implementar troca de senha com confirmação da senha atual e encerramento das outras sessões.
- [x] T005 Definir e implementar troca de e-mail conforme FR-006, com testes de disponibilidade, confirmação e preservação da identidade.
- [x] T006 Implementação inicial de MFA retirada por decisão explícita posterior do usuário; substituída por T022/FR-019.
- [x] T007 Exibir causas de recusa na concessão de funções; orientação de ativação de MFA retirada por FR-019.
- [x] T008 Executar integração, navegador, acessibilidade, lint e typecheck; registrar evidências e limitações.
- [x] T009 Disponibilizar preview local preservando a separação das branches. Em 10/09/2026, após as correções, o usuário autorizou abrir o PR de Configurações para dev condicionado aos testes aprovados. Essa autorização não equivale a homologação em DEV nem aprovação de merge. Nenhum PR de Associados.
- [x] T010 Aplicar o logo oficial enviado pelo usuário no componente de marca compartilhado e conferir login/menu lateral, conforme inclusão autorizada nesta branch.
- [x] T011 Aplicar nova política de senha (máximo 72, maiúscula, minúscula e número), retirar faixa numérica e avatar, mantendo o menu acessível.
- [x] T012 Implementar recuperação por e-mail com expiração, uso único, encerramento de sessões e auditoria; documentar envio real fora do localhost.
- [x] T013 Validar limites e requisitos, link vencido/reutilizado, recuperação pelo navegador e regressões de Configurações.

Preview de Configurações no endereço habitual `http://localhost:3105/settings`. Associados continua separado em `http://localhost:3106/members`. Autorização explícita posterior permite publicar esta branch e abrir seu PR para dev; revisão humana e CI continuam exigidos antes de merge.

## Pendências encontradas na revisão de 10/09/2026

Detalhes históricos e resolução em [review.md](review.md). Correções verificadas automaticamente; entrega por PR autorizada em T009.

- [x] T014 Revalidar sessão não revogada e conta ativa; testar sessão revogada e conta desativada. Endpoints MFA removidos retornam 404 (R01, FR-010/019, SC-004).
- [x] T015 Bloquear rotas nativas alternativas de alteração de conta para preservar auditoria, encerramento de sessões, versão e invalidação de pedidos; testar chamadas diretas (R02, FR-005/011).
- [x] T016 Garantir redefinição transacional de senha, token, auditoria, pedidos pendentes e sessões; testar falha injetada na auditoria e concorrência (R03, FR-011/016).
- [x] T017 Tratar indisponibilidade na recuperação sem confirmar envio indevido; verificar SMTP antes da consulta de conta e testar respostas equivalentes para endereços conhecidos/desconhecidos, falha e nova tentativa (R04, FR-002).
- [x] T018 Retirada: retomada do cadastro MFA deixou de existir por decisão explícita de remover o autenticador (R05, FR-019, T022).
- [x] T019 Apresentar erro específico de nome inválido, inclusive somente espaços, preservando os demais dados; validado no navegador (R06, US1/AC3).
- [x] T020 Validar concessão administrativa sem MFA, recusas traduzidas e jornadas de Configurações/recuperação por teclado em 390px; validar limites com rate limiting habilitado e executar os gates afetados (FR-009/012/019, SC-003/005).
- [x] T021 Adicionar ícone de olho nos sete campos atuais de senha de login, Configurações e redefinição, preservando valor, autocomplete, limites e teclado; sem envio ao alternar (FR-018). O oitavo campo pertencia ao autenticador retirado.
- [x] T022 Remover autenticador de Configurações, login, endpoints e regras administrativas; migrar dados legados com auditoria; atualizar constituição, spec e testes conforme decisão explícita (FR-019).
- [x] T023 Manter o botão Conta no rodapé quando a navegação estiver recolhida; incluir regressão no navegador (FR-001/017).
