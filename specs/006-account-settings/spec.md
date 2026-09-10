# Feature Specification: Configurações da conta

**Feature Branch**: `feature/account-settings`

**Created**: 2026-09-10

**Status**: Implementação e correções da revisão concluídas e verificadas automaticamente; resoluções em [review.md](review.md). Autenticador removido por decisão explícita posterior. Em 10/09/2026, o usuário autorizou PR para dev após aprovação dos testes (T009). CI e revisão humana continuam exigidos antes de merge.

**Input**: Usuário solicitou explicar a recusa ao conceder funções e permitir ativar MFA. Ampliou o escopo para uma área de configurações com alteração de nome, e-mail e senha, exigindo spec e branch próprias.

**Decisões posteriores**: remover integralmente o autenticador, inclusive de Configurações, e manter o botão Conta no rodapé com a navegação recolhida. A remoção substitui a ativação inicial de MFA e o pedido intermediário de remoção por administrador (FR-019).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Editar meu perfil (Priority: P1)

Como usuário autenticado, quero encontrar minhas configurações e alterar meu nome, sem depender de um administrador.

**Why this priority**: O acesso às configurações pessoais precisa existir inclusive para quem não administra usuários.

**Independent Test**: Uma conta sem funções administrativas acessa Configurações, altera o nome e vê o novo nome após recarregar a página.

**Acceptance Scenarios**:

1. **Given** uma conta ativa autenticada, **When** abre Configurações, **Then** encontra Perfil e Segurança, com nome, e-mail e manutenção da senha.
2. **Given** um nome válido, **When** salva o perfil, **Then** a alteração persiste e aparece na identificação da sessão.
3. **Given** nome vazio ou maior que 160 caracteres, **When** tenta salvar, **Then** recebe orientação de correção sem perder os outros dados.
4. **Given** uma tentativa de editar outra identidade, **When** envia a alteração, **Then** o sistema recusa; as configurações pessoais não concedem gestão de usuários.

### User Story 2 - Alterar minha senha e meu e-mail (Priority: P1)

Como titular da conta, quero manter minhas credenciais atualizadas e receber confirmação clara de cada alteração.

**Why this priority**: Nome, e-mail e senha são capacidades básicas de manutenção da conta explicitamente solicitadas.

**Independent Test**: Alterar a senha, verificar que a antiga deixa de funcionar e que outras sessões são encerradas; alterar o e-mail e autenticar com o novo endereço após concluir o processo definido.

**Acceptance Scenarios**:

1. **Given** a senha atual correta e uma nova senha de 12 a 72 caracteres confirmada, **When** salva, **Then** a nova senha passa a valer e as outras sessões são encerradas.
2. **Given** senha atual incorreta, nova senha inválida ou confirmação divergente, **When** envia, **Then** nenhuma credencial muda e a mensagem explica o problema.
3. **Given** novo e-mail válido e disponível, **When** solicita a mudança com confirmação de identidade, **Then** o sistema segue o fluxo de confirmação descrito em FR-006 antes de efetivar o novo login.
4. **Given** e-mail inválido, indisponível ou confirmação expirada, **When** tenta concluir a mudança, **Then** o acesso anterior permanece válido e a tela explica como corrigir.
5. **Given** uma alteração concluída, **When** retorna à conta, **Then** identidade, vínculos e funções permanecem associados ao mesmo usuário.

### User Story 3 - Entender recusas de permissão (Priority: P1)

Como administrador autorizado, quero conceder funções e entender as recusas sem depender de autenticador.

**Independent Test**: Uma conta com autoridade suficiente concede a função administrativa a outra conta ativa; conta sem permissão não consegue realizar a ação. Nenhuma etapa solicita MFA.

**Acceptance Scenarios**:

1. Conta autorizada concede função com justificativa, preservando a auditoria.
2. Recusas distinguem falta de permissão, concessão acima da autoridade, autoatribuição, duplicidade, conta inativa e sessão expirada.
3. O sistema continua impedindo a remoção/desativação do último administrador ativo, independentemente do estado legado de MFA.

### Edge Cases

- Duas abas alterando o perfil: impedir que uma versão antiga sobrescreva uma alteração recente sem aviso.
- Conta desativada ou sessão revogada durante a edição: recusar a alteração.
- Falha de conexão: restaurar os controles e permitir nova tentativa, sem mostrar sucesso indevido.
- Senha e e-mail não devem aparecer em logs; códigos e chaves não devem permanecer no armazenamento do navegador.
- A aplicação usa credenciais locais; uma futura integração com provedor externo deverá definir sua própria recuperação antes de ser habilitada.
- Confirmação de e-mail vencida ou reutilizada: não alterar a identidade; permitir iniciar novo pedido.

### User Story 4 - Recuperar senha esquecida (Priority: P1)

Como titular, quero solicitar um link no meu e-mail para recuperar o acesso sem conhecer a senha atual.

**Independent Test**: Solicitar pelo login, abrir o e-mail local, definir uma senha válida e entrar novamente; verificar rejeição do link vencido ou reutilizado.

**Acceptance Scenarios**:

1. Endereços cadastrados e desconhecidos recebem a mesma mensagem de solicitação na tela.
2. O link permite escolher e confirmar a nova senha por 30 minutos e uma única vez; senhas inválidas não consomem o link.
3. Ao concluir, todas as sessões são encerradas e a senha antiga deixa de funcionar. Identidade e funções são preservadas.
4. Link inválido, vencido ou utilizado orienta a solicitar outro; solicitações repetidas recebem limitação no servidor.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Disponibilizar Configurações da conta pelo menu aberto ao clicar no próprio nome no canto inferior esquerdo, para toda conta ativa autenticada. Reunir nesse menu Configurações da conta, Sessões e Sair; retirar configurações pessoais e saída da lista principal de módulos. Manter acesso no menu recolhido e no celular, navegação por teclado e fechamento por Escape. Ao recolher a navegação, o botão Conta permanece no rodapé, sem subir junto aos links dos módulos.
- **FR-002**: Organizar a área em Perfil e Segurança, com nome, e-mail de acesso, alteração de senha; apresentar retornos de sucesso, erro e processamento próximos à ação.
- **FR-003**: Permitir alterar somente o próprio nome, entre 1 e 160 caracteres após remover espaços externos, com controle de versão.
- **FR-004**: Exigir senha atual para alterar senha ou solicitar troca de e-mail. Nova senha deve ter 12 a 72 caracteres, ser diferente da atual e ter confirmação idêntica.
- **FR-005**: Após trocar senha ou efetivar troca de e-mail, encerrar outras sessões e preservar a sessão atual, a identidade e as funções.
- **FR-006**: Trocar e-mail somente após senha atual correta e confirmação por link no novo endereço, conforme escolha do usuário em 10/09/2026. Validar formato e disponibilidade; manter o login anterior até a confirmação. O link expira em 30 minutos, aceita um único uso e exige uma sessão autenticada do titular para confirmar. Novo pedido invalida o anterior.
- **FR-007**: Retirado por decisão explícita do usuário em 10/09/2026; não oferecer ativação de autenticador (FR-019).
- **FR-008**: Retirado; não oferecer códigos de recuperação de MFA. A recuperação de senha por e-mail permanece (FR-016/019).
- **FR-009**: Exibir as causas conhecidas de recusa ao conceder funções em português, com próximo passo aplicável; mostrar erro genérico seguro para falhas desconhecidas.
- **FR-010**: Revalidar autenticação, estado da conta e titularidade no servidor; rejeitar mudanças de funções, permissões, situação da conta ou identificador por meio das configurações pessoais.
- **FR-011**: Registrar alterações de perfil e credenciais na auditoria, com ator, ação, data e correlação; excluir senhas, segredos, tokens e códigos de recuperação.
- **FR-012**: As jornadas devem funcionar por teclado e em largura de 390 pixels, com rótulos, foco e mensagens acessíveis segundo o padrão de acessibilidade do projeto.
- **FR-013**: A caixa de e-mails local é exclusiva de testes, claramente identificada e restrita ao computador local. Antes de qualquer implantação fora do localhost, substituir a configuração por envio real, remetente autorizado e endereço público HTTPS; testar entrega, expiração e uso único dos links. Impedir a utilização do modo de e-mail local com endereço público. Não considerar a validação local como evidência de entrega real.
- **FR-014**: Substituir a marca provisória pelo arquivo oficial `caab-logo.png` enviado pelo usuário, preservando cores e proporções e garantindo leitura no menu lateral, no menu recolhido e nas telas de autenticação. Inclusão nesta branch autorizada explicitamente em 10/09/2026.

- **FR-015**: Novas senhas devem ter de 12 a 72 caracteres, com pelo menos uma letra maiúscula, uma minúscula e um número; símbolos são opcionais. Aplicar a política no servidor e nos formulários de alteração e redefinição. Não exibir texto fixo com a faixa numérica ou contador. Senhas existentes continuam aceitas no login e na confirmação de identidade.
- **FR-016**: Disponibilizar “Esqueci minha senha” no login e “Redefinir senha por e-mail” em Segurança, conforme US4. Enviar somente ao e-mail da conta, manter o token apenas na memória da página e exigir novo login após redefinir. Registrar a redefinição na auditoria sem segredos e invalidar trocas de e-mail pendentes. O procedimento de envio real de FR-013 também se aplica à recuperação.
- **FR-017**: Não mostrar foto, avatar ou inicial decorativa no painel administrativo. O menu continua acessível pelo nome e, quando recolhido, pelo texto “Conta”. Manter o logo institucional oficial.

- **FR-018**: Disponibilizar botão com ícone de olho em todos os campos de senha do login e das configurações, incluindo troca de e-mail, confirmação de nova senha, recuperação. Iniciar com senha oculta; alternar para texto visível sem modificar o valor nem enviar o formulário. Usar olho riscado para ocultar novamente, nome acessível “Mostrar senha”/“Ocultar senha”, foco visível e operação por teclado.

- **FR-019**: Remover integralmente o autenticador do painel, inclusive Configurações, login, rotas, avisos e exigências para administradores. Eliminar segredos/códigos/desafios legados com registro de auditoria, preservando credenciais e funções. Decisão documentada em [authenticator-removal.md](authenticator-removal.md).

### Key Entities

- **Conta**: identidade existente, nome, e-mail de acesso, situação e versão; não cria cadastro paralelo de colaborador ou associado.
- **Credencial**: senha da conta, sem acesso público aos segredos.
- **Sessão**: acesso autenticado atual ou de outro dispositivo, com validade e revogação.
- **Pedido de troca de e-mail**: titular, endereço pretendido, confirmação, validade e estado de consumo.
- **Evento de auditoria**: registro imutável da alteração, sem conteúdo secreto.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Uma conta comum alcança Configurações em duas ações no desktop (nome → Configurações da conta) ou três no menu móvel (abrir navegação → nome → Configurações da conta).
- **SC-002**: Nome, senha e e-mail alterados persistem após recarregar a página e novo login; as credenciais substituídas deixam de funcionar.
- **SC-003**: Todas as recusas de concessão enumeradas em US3 apresentam uma explicação específica.
- **SC-004**: Nenhuma tentativa testada de editar outra conta, reutilizar confirmação ou usar sessão revogada altera dados.
- **SC-005**: As jornadas críticas são concluídas com teclado em 390 pixels, sem rolagem horizontal e sem violações detectadas na verificação automatizada de acessibilidade.

## Assumptions

- Referências de mercado e opções candidatas estão em [research.md](research.md). Preferências, notificações, dispositivos, integrações e privacidade são oportunidades registradas, não funcionalidades já entregues nem escopo automaticamente aprovado.

- Escopo é a conta pessoal. Configurações institucionais, gestão de colaboradores, notificações e exclusão de conta não foram solicitados e não integram este incremento. Foto/avatar foram explicitamente dispensados pelo usuário.
- Aplicar a nova regra de senha aos cadastros e alterações; preservar a autenticação de senhas antigas. As funções existentes permanecem.
- O usuário aprovou senha atual + link no novo endereço e caixa local para testes. A configuração deve ser substituída e validada ao sair do ambiente local; credenciais de envio reais serão fornecidas no processo de implantação, sem incluí-las no repositório.
- Implementação e documentação ficam na branch própria, baseada em dev. O preview local pode reunir módulos, mas não determina o conteúdo de PRs. Associados continua em validação e não está autorizado para PR.
