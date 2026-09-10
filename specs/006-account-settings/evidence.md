# Evidências de Configurações da conta — 10/09/2026

**Estado atual:** correções R01–R04/R06 implementadas; R05 retirado pela remoção explícita do autenticador. Os registros anteriores abaixo são históricos, inclusive referências a MFA e ausência de autorização para PR. A seção final consolida a verificação atual e a autorização posterior para entrega (T009).

Branch própria `feature/account-settings`, baseada em `origin/dev` (`74d7bd0`), sem código de Associados. Sem push ou PR.

## Implementação

- Nome abre Configurações da conta, Sessões e Sair; acesso preservado sem permissão de gerenciar usuários.
- Edição do próprio nome, alteração de senha, troca de e-mail por senha atual + link, MFA e recuperação de uso único.
- Erros de concessão traduzidos com causa e orientação para o destinatário ativar MFA.
- Logo oficial copiado do arquivo fornecido; igualdade SHA-256 conferida. Arquivo original preservado; enquadramento visual feito no componente compartilhado.
- Migração 0011 aplicada ao banco local, acrescentando apenas a tabela de pedidos de e-mail. As migrations 0001–0009 são a base de dev; 0010 pertence exclusivamente à branch de Associados.

## Verificações

- 116 testes unitários e de contrato passaram (28 arquivos).
- 7 testes transacionais de Configurações passaram em PostgreSQL temporário isolado: perfil/versionamento, senha, sessões, e-mail, uso único, expiração, titularidade, colisão, falha de envio e limite de tentativas.
- 4 testes de integração de autenticação/MFA existentes passaram; executados separadamente dos sete testes finais acima.
- Jornadas Chromium verificadas: perfil/senha/e-mail/menu/saída; ativação de MFA, código inválido, login com autenticador, recuperação e recusa de reutilização; regressões de autenticação e sessão revogada.
- Execução final na porta 3105: os cinco testes de navegador passaram juntos (41 segundos), incluindo entrega do link na caixa local apontando para a porta correta.
- Axe nas configurações, ativação de MFA e menu da conta; largura de 390 pixels sem rolagem horizontal; Escape e foco do menu verificados.
- Capturas de login e menu móvel inspecionadas com o logo oficial. Dados das capturas são sintéticos.
- Lint, TypeScript, formatação e build de todos os pacotes passaram.
- Auditoria de dependências passou o gate high: zero high/critical; permanecem 3 low e 5 moderate.

Um ensaio de navegador sob verificações simultâneas excedeu o limite de espera de cinco segundos do login (resposta em 5,1s). A jornada de MFA passou ao ser repetida isoladamente; o runner local usa tolerância de 15s para compilação de desenvolvimento. Não houve relaxamento das regras de autenticação.

## Ambiente e pendências

Configurações está em `http://localhost:3105/settings`; Associados foi preservado na porta 3106. Mailpit permanece somente no loopback, porta 8025 para mensagens e 1025 para SMTP. O worker e os serviços de dados de Associados foram preservados.

Envio externo não foi ativado nem validado. A troca obrigatória para SMTP real e HTTPS antes de sair do local está em FR-013 e quickstart.md. Essa pendência de implantação não é substituída pelos testes locais.

A revisão funcional do usuário ainda está pendente. Associados continua não pronto para PR. As sugestões da pesquisa de mercado permanecem fora do incremento aprovado.

## Ajuste de senha e recuperação

- 125 testes unitários/contratuais passaram (29 arquivos), incluindo limites 12/72 e requisitos de maiúscula, minúscula e número.
- 12 testes de integração passaram juntos em PostgreSQL isolado: sete de Configurações e cinco de autenticação. Recuperação cobre expiração, uso único, rejeição de senha inválida antes de consumir o token, encerramento de sessões, senha antiga inválida e desafio MFA preservado.
- Cinco jornadas Chromium existentes passaram. O primeiro ensaio de recuperação tentou reabrir o fragmento na mesma página de sucesso; o teste foi corrigido para sair da página antes de reabrir o link. Recuperação e Configurações passaram juntas na execução final (2 testes, 21,6 segundos).
- Entrega no Mailpit, redefinição, rejeição do link reutilizado, novo login e sessão anterior inválida conferidos no navegador.
- Menu sem avatar, acesso pelo texto Conta quando recolhido, campo com maxlength=72 e ausência de texto fixo de faixa numérica conferidos. Axe passou no formulário de recuperação a 390px. Capturas do menu e Configurações atualizadas e inspecionadas.
- TypeScript, lint, formatação dos arquivos afetados e build de todos os pacotes passaram após os ajustes.

## Controle de visibilidade de senha (FR-018)

- Botão Eye/EyeOff nos oito campos de login, Configurações, confirmação MFA e recuperação.
- Verificação direta no navegador a 390px: todos iniciam ocultos, Espaço/Enter alternam a visibilidade, preservam o valor e não enviam formulários (zero POSTs de formulário).
- Os seletores de login passaram a exigir o nome exato Senha para distinguir o campo do novo botão Mostrar senha.
- Seis jornadas Chromium passaram juntas (51,3s), incluindo axe nos fluxos cobertos. Typecheck, lint dos componentes afetados e formatação passaram.
- Capturas com o ícone inspecionadas e atualizadas. Este incremento não resolve as pendências R01–R06 da revisão.
- Build de produção do web aprovado após FR-018.

## Correções, remoção do autenticador e botão Conta

- 120 testes unitários e de contrato passaram em 28 arquivos; testes que exigiam MFA foram substituídos ou retirados junto da funcionalidade.
- 27 testes de integração passaram juntos em quatro arquivos com PostgreSQL isolado: Configurações, autenticação, permissões e regressões de recuperação/sessão. Incluem falha injetada de auditoria, concorrência, limites reais de recuperação, dados legados de MFA e proteção do último administrador.
- Sete testes Chromium passaram juntos: edição de perfil/senha/e-mail, recuperação, login comum/administrativo sem autenticador, sessão revogada, erro de recuperação com nova tentativa e concessão administrativa com recusas traduzidas. Axe passou nas telas cobertas.
- A posição inferior de Conta ao recolher a navegação é verificada por sua distância à borda inferior da janela. O contêiner da conta passou a manter sua própria margem superior automática.
- Autenticador removido de Configurações, login, endpoints e regras administrativas. Migração 0012 aplicada no localhost para limpar dados legados com auditoria; decisão em [authenticator-removal.md](authenticator-removal.md).
- Build de produção de todos os pacotes passou após as correções e a remoção; a listagem de rotas não contém `/mfa`.
- Alterações permanecem somente na branch `feature/account-settings`, sem push ou PR. Preview em `http://localhost:3105/settings`; Associados permanece separado.
- Jornadas de edição de nome/senha/e-mail e solicitação/redefinição de senha repetidas com interação por teclado em 390px: dois testes passaram (31,3s). Preparação de contas e leitura de mensagens usam API de teste; os formulários, confirmações e navegação são operados por teclado.
- Typecheck final e lint dos testes de teclado passaram. `git diff --check` não apontou erros de whitespace. Captura desktop conferida após a animação: Conta fica a 17,6px da borda inferior (janela de 900px de altura).

## Preparação do PR para dev — 10/09/2026

O usuário autorizou explicitamente abrir o PR após os testes. A branch continua baseada no HEAD atual de origin/dev e sem implementação de Associados. A revisão humana de autenticação/permissões e os gates de CI permanecem obrigatórios antes do merge.

- Suíte completa local: 196 testes em 39 arquivos (120 unitários/contratuais e 76 de integração). A primeira execução teve 195 aprovações e uma falha na lista esperada de migrations; o teste ainda listava somente 0001–0009. Após acrescentar 0011 e 0012 à expectativa, os três testes desse arquivo passaram em PostgreSQL descartável. Nenhuma lógica da aplicação mudou nessa correção.
- Formatação global, lint global e typecheck de todos os pacotes passaram. Formatação e lint do teste de migrations também passaram após o ajuste.
- Build de todos os pacotes e sete testes Chromium afetados aprovados conforme os registros anteriores; repetição adicional das duas jornadas por teclado em 390px aprovada.
- Auditoria de dependências passou o gate high: zero high/critical; três low e cinco moderate conhecidos permanecem.
- Gitleaks no diff preparado para publicação: nenhum segredo encontrado. A varredura da árvore completa apontou três falsos positivos em arquivos inalterados, todos referências à variável `env.S3_SECRET_KEY`, sem credenciais literais.
- Capturas atuais com dados sintéticos: [Configurações em 390px](evidence/configuracoes-mobile.png), [menu móvel](evidence/menu-conta-mobile.png), [Conta recolhida](evidence/conta-menu-recolhido.png).

## Correção dos jobs browser do PR #13

- As execuções iniciais por push e pull_request reprovaram o teste geral de acessibilidade que ainda esperava `/mfa`; quality e security passaram. Esse arquivo não estava na seleção local anterior de sete jornadas. Agora verifica acesso direto e acessibilidade de Configurações administrativas sem autenticador, preservando o gate axe.
- A execução por PR também registrou contraste transitório insuficiente em Nova notícia ao mudar para tema escuro (4,17:1 numa tentativa). Reprodução local quadro a quadro encontrou mínimo de 1,03:1 durante a interpolação. Ao trocar texto e fundo simultaneamente, o mínimo medido foi 5,17:1, com zero amostras abaixo de 4,5:1.
- Treze testes Chromium de acessibilidade, autenticação e Notícias passaram juntos contra o build de produção local (48,1s), incluindo os temas claro/escuro. Build, TypeScript incorporado ao build, lint e formatação dos arquivos afetados passaram.
- Um ensaio anterior contra o servidor de desenvolvimento teve dez aprovações e três timeouts de navegação/ação em Notícias. Os mesmos treze cenários passaram em produção local, modo utilizado pela CI, sem alteração da lógica editorial nem aumento de limites dos testes.
