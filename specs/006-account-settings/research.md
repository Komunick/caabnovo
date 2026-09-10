# Referências de mercado: configurações pessoais

**Atualização de escopo — 10/09/2026:** as referências abaixo são históricas. O usuário dispensou foto/avatar e, posteriormente, determinou a remoção integral do autenticador, inclusive de Configurações. Essas opções não fazem parte da entrega atual; ver [spec.md](spec.md) e [authenticator-removal.md](authenticator-removal.md).

Pesquisa em 10/09/2026, na documentação oficial dos produtos. As opções abaixo são referências, não uma aprovação automática para ampliar o escopo do CAAB.

## Acesso pelo perfil

O Slack orienta abrir o avatar no canto inferior esquerdo para acessar Perfil e Preferências. Isso sustenta o ajuste pedido pelo usuário para o nome/avatar do CAAB. [Guia oficial do Slack](https://slack.com/help/articles/218080037-Getting-started-for-new-Slack-users).

Decisão para o CAAB: nome/avatar abre um menu com Configurações da conta, Sessões e Sair. Configurações pessoais e saída deixam a lista principal de módulos. O botão permanece utilizável no menu recolhido e no celular; Escape fecha e devolve o foco ao botão.

## Opções encontradas e adequação ao CAAB

| Grupo | Opções comuns | Situação no CAAB |
| --- | --- | --- |
| Perfil | Nome, foto e e-mail | Nome e e-mail neste incremento; foto como sugestão futura, com fluxo seguro de upload. |
| Segurança | Senha, MFA, recuperação, dispositivos/sessões e passkeys | Senha, MFA e recuperação neste incremento; sessões já possuem página informativa. Listagem e revogação individual de dispositivos e passkeys são sugestões. |
| Preferências | Tema, idioma, fuso horário, acessibilidade e formatos de data | Tema claro/escuro já existe no cabeçalho. Consolidar preferências pessoais exige escopo próprio; fuso não deve mudar a regra institucional de datas. |
| Notificações | Canais, frequência, assinaturas e horários de pausa | Sugestão dependente de eventos e canais de notificação realmente disponíveis. |
| Integrações | Contas conectadas e aplicativos autorizados | Sugestão condicionada às integrações adotadas. |
| Privacidade | Visibilidade de perfil, acesso aos próprios dados, exportação e exclusão | Exige política institucional de retenção e efeitos sobre vínculos e auditoria; não oferecer exclusão imediata sem definição. |
| Saída | Sair da sessão ou encerrar acessos de outros dispositivos | Sair no menu da conta; troca de senha/e-mail encerra as outras sessões neste incremento. |

Notion documenta foto, nome, e-mail, senha, MFA, passkeys, encerramento de dispositivos, aparência, idioma e fuso horário em suas configurações pessoais. [Configurações do Notion](https://www.notion.com/en-gb/help/account-settings). A documentação de MFA também prevê autenticador e códigos de recuperação de uso único. [MFA do Notion](https://www.notion.com/help/two-step-verification).

Slack agrupa perfil, segurança, notificações, idioma, fuso, tema e outras preferências pessoais. [Perfil e preferências do Slack](https://slack.com/help/categories/360000047906-Your-profile-preferences).

Atlassian separa perfil e visibilidade, idioma, e-mails/notificações, contas de terceiros e gestão dos próprios dados. [Conta Atlassian](https://support.atlassian.com/atlassian-account/docs/manage-your-atlassian-account/).

## Envio de e-mail

O teste local usa Mailpit, com interface e SMTP expostos somente em loopback. [Docker do Mailpit](https://mailpit.axllent.org/docs/install/docker/). O transporte SMTP real deve usar TLS e configuração própria de implantação. [SMTP do Nodemailer](https://nodemailer.com/smtp).
