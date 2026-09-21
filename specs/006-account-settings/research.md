# Pesquisa vigente — 21/09/2026

**Decisão:** Preservar conta pessoal e recusas de concessão durante a adequação transversal, sem reintroduzir MFA ou justificativa.

**Fundamento:** Usuário comum acessa sua conta, não altera outra nem ganha permissão; gestor concede sem MFA/justificativa, recusas permanecem específicas e último administrador protegido.

**Alternativas:** rejeitar cópia de cadastro, concessão implícita, exportar pela página
visual, gerar Buffer integral e reintroduzir fila/limites funcionais. Quando a função
não implementa exportação nesta fase, preservar seus controles existentes.

**Evidência local:** `apps/web/modules/auth/account-settings-service.ts`, `apps/web/modules/users/role-assignment-service.ts`, `apps/web/modules/users/ui/role-grant-error.ts`.
Desenho concreto em [plan.md](plan.md). Fontes oficiais, data, limitações e alternativas
na [pesquisa transversal](../002-integrated-modules/research-2026-09-21.md).
Essa revisão não homologa dependências, desempenho ou produto; testes estão no quickstart.

## Pesquisa anterior — contexto histórico

Decisões de fluxo/armazenamento/exportação anteriores são substituídas pelo plan de 21/09
onde conflitarem; referências antigas não autorizam funções adiadas.

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

## Pesquisa: justificativas e auditoria — 14/09/2026

- OWASP Logging Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html
  Preservar quando/onde/quem/o quê e minimizar dados sensíveis. Auditoria da criação
  independe de texto de justificativa do operador.
- OWASP Input Validation: https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html
  Validar no servidor antes da mutação, incluindo texto vazio após trim.
- W3C Forms: https://www.w3.org/WAI/tutorials/forms/ — instruções e nomes acessíveis
  associados aos campos necessários à ação atual.

A obrigação de motivo nas alterações é decisão do usuário, não imposição dessas fontes.
Não alterar permissões, inventar motivo humano nem registrar senhas/tokens em auditoria.


## Regra vigente: nenhuma justificativa obrigatória — 14/09/2026

Fonte de negócio: instrução expressa do usuário nesta data para remover motivos de todas as abas. A [OWASP Logging Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html), consultada em 14/09/2026, orienta registrar contexto da ação e identidade. Decisão do projeto: rastreabilidade é automática e não depende de justificativa escrita. O inventário encontrou validações em UI, contratos, serviços e CHECKs SQL; retirar todas as camadas da obrigatoriedade, preservando histórico e permissões. Não presumir que o usuário forneceu um motivo automático.

## Âncoras após carregamento progressivo — 15/09/2026

Fonte: Next.js loading e navegação, pesquisados no spec001/research.md. Evidência CI34988897595: com a tela temporária de carregamento, a navegação para #password-title termina antes da seção existir. Inferência confirmada pelo teste de viewport: é necessário posicionar a âncora quando o formulário estiver montado. Usar efeito local e requestAnimationFrame para os três IDs existentes, sem alterar foco, credenciais, salvamento ou política de acesso.


## Estado ao navegar — 16/09/2026

Os guias locais do Next 16.3.4 (preserving-ui-state e cacheComponents) confirmam que layouts
compartilhados conservam estado; Activity do framework retém somente três rotas e não atende
à preservação geral solicitada. Usar contexto em memória no layout autenticado, separado por
identidade e formulário; manter versões originais para conflito seguro. O padrão do campo UF
usa input/list: [MDN datalist](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/datalist).
Sugestões não validam sozinhas a seleção; conferir identificador válido antes de enviar.

## Senha inicial — pesquisa de 17/09/2026

Fontes oficiais: [Node.js randomInt](https://nodejs.org/docs/latest-v24.x/api/crypto.html#cryptorandomintmin-max-callback), [Better Auth database](https://better-auth.com/docs/concepts/database), [OWASP Password Storage](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html). Consultado guia local Next 16.3.4 de Route Handlers.

Node oferece sorteio criptográfico sem viés de módulo. Reutilizar hashPassword e account/providerId credential assegura compatibilidade com login; armazenar somente hash adaptativo. Decisão do usuário: uma palavra + seis dígitos. Palavra de seis ou mais letras com inicial maiúscula atende à política atual. A entropia é limitada pela lista e um milhão de sufixos; não afirmar que comprimento implica alta entropia. Preservar rate limiting e troca de senha existentes. Sem dependência nova nem envio de e-mail automático.

Diagnóstico: criação anterior só inseria user e recuperação exige account.password existente. Corrigir atomicamente. Reenvio idempotente não pode recuperar senha do hash ou substituí-la. A única conta legada sem senha poderá receber credencial por ação explícita, com autoridade e concorrência verificadas. Respostas com no-store; segredo só em memória transitória, fora de logs/rascunhos/storage. Nenhum dado real na implementação.

Revisão de vocabulário solicitada em 17/09/2026: lista permitida revisada de 252 palavras. Removidos nomes de animais usados como insultos, referências corporais, palavras ambíguas e termos pouco familiares. Não identificados termos ofensivos na lista remanescente; variação regional impede garantia universal. Novas palavras exigem revisão humana. Regressão impede reintroduzir os exemplos removidos. Não gerar palavras livremente nem consultar dicionário remoto em runtime.

## Correção de segurança — 17/09/2026

[Better Auth — opções](https://better-auth.com/docs/reference/options): usar disableSignUp e lista fechada de rotas, sem opção para reabrir inscrição em testes. [Next.js — CSP](https://nextjs.org/docs/app/guides/content-security-policy) e documentação embutida 16.3.4: nonce via proxy exige renderização dinâmica e header CSP no request ao renderer. Passar nonce ao Script de tema. Manter estilos inline para UI; scripts em produção sem unsafe-inline/eval. connect-src limita a self e ViaCEP já usado. [Next.js — headers](https://nextjs.org/docs/app/api-reference/config/next-config-js/headers): cabeçalhos globais/específicos por rota, sem relaxar downloads. Snapshot em user_access congelaria RBAC; função legada preserva baseline somente para usuários anteriores e mantém concessões dinâmicas. Seeds restritos a app/banco loopback. Não se presume acesso ao firewall ou segredos efetivos da hospedagem. GitHub excluído pelo usuário.


## Compatibilidade com a VM — 17/09/2026

Decisão de compatibilidade de 17/09/2026: a configuração efetiva da VM não foi inspecionada. A pesquisa anterior permanece como histórico; suas propostas de CSP, permissões, seeds e ambiente ficam adiadas. Manter somente a opção disableSignUp já pesquisada e atualizações de dependências já testadas. CI aprovado do conjunto anterior não substitui validação do conjunto reduzido nem teste na VM.
