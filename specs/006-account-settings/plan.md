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
