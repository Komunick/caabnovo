# Validação local e transição de ambiente

## Localhost

1. Aplicar migrations da branch com a conexão administrativa local: `0011_account_email_change.sql` e `0012_remove_authenticator.sql`. A segunda limpa segredos, códigos e desafios legados de MFA e registra auditoria, conforme a decisão em [authenticator-removal.md](authenticator-removal.md). São independentes de Associados; a numeração 0010 está reservada pela branch desse módulo.
2. Iniciar Mailpit restrito a loopback:

```powershell
docker run -d --name caab-settings-mailpit -p 127.0.0.1:1025:1025 -p 127.0.0.1:8025:8025 axllent/mailpit:v1.27.4
```

3. Configurar somente no arquivo local ignorado:

```dotenv
MAIL_MODE=local
SMTP_HOST=127.0.0.1
SMTP_PORT=1025
BETTER_AUTH_URL=http://localhost:3105
```

4. Abrir o menu no próprio nome, Configurações da conta. Validar nome, senha, novo e-mail e recuperação de senha pelo link no login com uma conta sintética. Verificar ausência do autenticador no login e em Configurações e posição inferior do botão Conta ao recolher a navegação. Os links chegam a `http://localhost:8025`; não são entregues à caixa real do destinatário.
5. Para testar uma confirmação, abrir o link da mensagem e usar a conta que solicitou a mudança. O token fica no fragmento, é removido da barra pelo cliente e não deve aparecer em logs de acesso.

## Obrigatório antes de sair do local

- Substituir `MAIL_MODE=local` por `MAIL_MODE=smtp`.
- Definir `SMTP_HOST`, `SMTP_PORT` (587 com STARTTLS ou 465 com TLS), `SMTP_USER`, `SMTP_PASSWORD` e `MAIL_FROM` por configuração de implantação/segredos.
- Definir `BETTER_AUTH_URL` com a URL pública HTTPS correta.
- Não publicar Mailpit nem copiar suas configurações, mensagens de teste ou credenciais locais para outro ambiente.
- Validar remetente autorizado, entrega real, tratamento de indisponibilidade, validade de 30 minutos e uso único dos links no ambiente de destino.
- Verificar que a aplicação recusa modo local quando a URL pública não é loopback. Essa proteção é testada; testes locais não comprovam entrega externa.
- Nenhuma credencial real deve entrar no repositório. A ativação de envio externo exige configuração do responsável pela implantação.

## Rollback

Reverter o código da feature preserva usuários e credenciais. Pedidos pendentes deixam de ser confirmáveis pela interface anterior e expiram; não remover tabelas nem alterar o histórico de auditoria para reverter uma versão.

A remoção dos segredos de MFA pela migração 0012 não é revertida pelo rollback do código. Uma eventual reintrodução do autenticador exige uma nova decisão de escopo e um novo cadastro das chaves; não restaurar segredos antigos.
