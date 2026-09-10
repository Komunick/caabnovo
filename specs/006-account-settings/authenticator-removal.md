# Decisão: remoção total do autenticador

Em 10/09/2026, o responsável pelo produto solicitou explicitamente: “remova totalmente o autenticador” e confirmou a retirada da aba de Configurações. Essa decisão substitui tanto a exigência anterior de MFA para administradores quanto o pedido intermediário de um botão administrativo para remover MFA.

- Login passa a usar e-mail e senha, sem desafio TOTP, códigos de recuperação ou confiança de dispositivos.
- Configurações mantém nome, troca de e-mail, troca/redefinição de senha e os ícones de olho. Não há seção nem botões de autenticador.
- Administração mantém permissões server-side, justificativas, auditoria e proteção do último administrador. Concessões não dependem mais de MFA.
- As rotas de autenticador são removidas. As rotas nativas alternativas de alteração de conta continuam bloqueadas.
- Migração `0012_remove_authenticator.sql` desativa o estado legado, elimina chaves/códigos e desafios de autenticador e registra a retirada na auditoria. Preserva usuários, senhas, funções e histórico. Colunas/tabela legadas permanecem apenas para compatibilidade de migrations; o contrato v1 mantém `twoFactorEnabled=false`, sem funcionalidade associada.
- Não haverá a permissão nem o botão intermediário para um administrador remover MFA de si ou de terceiros: o recurso inteiro foi retirado.

A Constituição IV e a referência em STACK são atualizadas nesta branch conforme a decisão explícita do usuário. Esta alteração abandona a proteção por segundo fator; continuam exigidas senha, controle de permissões, validação de sessão, limitação de tentativas e auditoria.

Não publicar a aplicação anterior com o novo banco como estratégia de rollback: ela ainda pode exigir MFA. As chaves eliminadas não serão recuperadas; uma futura reintrodução do recurso exigirá nova decisão e novo cadastro dos autenticadores.

Implementação na branch `feature/account-settings`, separada de Associados. Em 10/09/2026, o usuário autorizou publicar a branch e abrir PR para dev após aprovação dos testes. A atualização da base de outras branches deve seguir o fluxo normal de integração, sem copiar funcionalidades entre elas.
