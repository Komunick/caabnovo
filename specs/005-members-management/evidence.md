# Evidências — Associados

**Situação**: retomado sobre `origin/dev` be46efa, com Configurações e PR #14 integrados.
Módulo ainda em implementação e validação funcional, conforme orientação do usuário.
Este documento não declara Associados pronto para PR. Os resultados atuais estão na seção
“Retomada após Configurações e PR #14”; as verificações anteriores são preservadas como histórico.

10/09/2026. Branch `feature/members-management`, baseada em `origin/dev` `74d7bd0`.
Somente dados sintéticos; nenhum consumidor externo, política institucional ou ambiente de produção
foi alterado. Código parcial preservado e atualizado para a base com Notícias integrada.

## Especificação e escopo

Checklist de requisitos: 16/16. Permissões `members:read`, `members:write`, `members:review`
confirmadas pelo usuário em 10/09; concessão inicial ao administrador existente. Revisão documental
append-only, situações independentes e fronteiras com Usuários/Caassh mantidas. Credencial é situação
e validade, sem emissão de cartão verificável.

## Verificação anterior à pausa (histórico)

| Gate | Resultado |
| --- | --- |
| Unitários e contratos | 30 arquivos, 131 testes aprovados. |
| Integração completa | 10 arquivos, 71 testes aprovados com `--maxWorkers=2`. |
| Banco | Migrations desde PostgreSQL 18 vazio e uso de `caab_runtime`; sem UPDATE/DELETE de avaliações/revisões. |
| Navegador Chromium | Três jornadas aprovadas: cadastro/vínculos/avaliação/arquivo/restauração; documentos reais; negação a usuário comum. |
| Acessibilidade | Axe WCAG 2.2 AA nas telas de cadastro, situações, documentos e histórico; teclado e 390px, sem rolagem horizontal. |
| Typecheck | Todos os pacotes aprovados. |
| Lint e formatação | Aprovados. |
| Build de produção | Todos os pacotes aprovados; rotas `/members`, `/members/new`, `/members/[id]` e API v1 geradas. |
| Dependências | Gate high aprovado: nenhuma alta/crítica; 3 baixas e 5 moderadas no lockfile existente. |

As primeiras execuções encontraram problemas que foram corrigidos: tipagem dos casos parametrizados,
permissões ausentes no código parcial, histórico documental incompleto, mensagens com codificação
incorreta e geração de MFA no teste sintético. Uma execução completa com muitos bancos simultâneos
ao build atingiu timeout de conexão em Auditoria; a repetição completa com dois workers passou.
O primeiro acesso no servidor de desenvolvimento também excedeu o timeout de navegação de 5s durante
a compilação inicial; a jornada passou com as rotas compiladas. Não foram relaxadas asserções de acesso.
Uma falha transitória de conexão emitida pelo PgBoss encerrou o worker por ausência de listener de
erro; foi adicionado tratamento com log sem payload sensível e teste de regressão. A fila mantém seu
retry existente e o worker não encerra por esse evento. O upload foi repetido com o worker corrigido.

## Cenários negativos da execução anterior (histórico)

- CPF duplicado e edições simultâneas produzem um único vencedor; retries não duplicam registros.
- A→B/B→A concorrentes não formam ciclo; encerramento/arquivamento/restauração preservam referências.
- Conta desativada/sessão revogada e concessões removidas/expiradas são recusadas no banco, mesmo com
  ator antigo em memória. A exigência de MFA dessa execução foi removida na retomada abaixo.
- Somente consulta não permite escrever ou analisar; arquivos genéricos não contornam o acesso a Pessoas.
- Arquivo de outra pessoa, em quarentena ou com resultado de scan alterado não recebe download.
- Substituição mantém documento e revisões anteriores; cada nova evidência começa pendente.
- Falha na auditoria reverte a alteração. Histórico de vínculos é consultável pelas duas pessoas.
- Alteração de identidade sinaliza avaliação anterior; aprovação cadastral não modifica finanças ou elegibilidade.

## Ambiente de revisão

Localhost atual em `http://localhost:3106/members`, com recarga automática e worker ativo.
Login e rotas `/readyz`, `/members`, `/settings` e `/api/v1/members` verificados com conta sintética.
Contas pessoais existentes preservadas, sem reset/seed no banco compartilhado. A pedido do usuário,
os previews das portas 3105 e 3107 foram encerrados; somente 3106 permanece ativo.
O diretório principal conserva seu trabalho anterior;
o código executado está no worktree `.cache/pr-members`.

## Retomada após Configurações e PR #14 — 10/09/2026

Base integrada: `origin/dev` be46efa; merge local b15d6c7. Nenhum push, PR ou deploy de Associados.
O usuário confirmou que ainda não testou e solicitou localhost atualizado antes de continuar.

- Autorizador de Associados alinhado à remoção do autenticador: administrador autorizado lê/cria
  sem MFA; sessão ativa, validade e revogação das concessões continuam revalidadas no banco.
- Filtro por seccional OAB (ASS-002), combinado com busca, análise e arquivamento; preservado na
  paginação. Contrato recusa UF inválida e teste de integração cobre duas páginas sem vazamento
  de resultados de outra UF.
- Jornada de teclado agora percorre os controles com Tab/Enter e seleciona opções por teclas,
  desde o login em 390px. O teste antigo usava cliques e só alterava o viewport perto do fim.
- Handoff Caassh corrigido: spec 006 e migrations 0011/0012 já pertencem a Configurações.

| Gate da retomada | Resultado |
| --- | --- |
| Unitários e contratos | 38 arquivos, 208 testes aprovados. |
| Integração completa | 12 arquivos, 90 testes aprovados com `--maxWorkers=1`, PostgreSQL descartável. |
| Chromium no preview | Quatro jornadas aprovadas, incluindo filtro/paginação e upload real com antivírus. |
| Execução final de navegador | 16/16 aprovadas no localhost:3106: quatro jornadas em Chromium, Firefox, WebKit e tablet (iPad Pro 11). SC-004 por teclado em 390px; axe WCAG 2.2 AA e ausência de rolagem horizontal verificadas. Limite da paginação no WebKit/Windows descrito abaixo. |
| Typecheck | Todos os pacotes aprovados após regeneração dos tipos de rotas pelo build. |
| Lint, formatação e diff | Aprovados. |
| Build de produção | Todos os pacotes aprovados; Associados e Configurações presentes, `/mfa` ausente. |

Ocorrências locais: cache antigo do Turbopack abortou na primeira abertura de Configurações;
limpeza limitada a `.next/dev` e reinício corrigiram. Duas jornadas excederam 5s durante compilação
inicial de rotas no modo dev; passaram com as rotas carregadas, sem alterar as asserções.
O primeiro typecheck encontrou referência antiga a `/mfa` em `.next/types`; build regenerou os
arquivos e a repetição passou. Formatação automática do AGENTS.md foi restaurada, sem alteração
de instruções. Nenhuma dessas correções apagou dados. Posteriormente, os previews redundantes
foram encerrados conforme solicitação explícita do usuário.

Na ampliação para outros motores, a navegação sequencial do Firefox sem interface não retornou
ao início depois do último controle (também reproduzido em HTML mínimo); o helper passou a
percorrer Tab/Shift+Tab, começando na direção do destino. A verificação continua exigindo foco
real obtido pelo teclado, sem `locator.focus()` para atingir os controles da jornada.
O helper reativa a aba de teste após ferramentas como axe, cujo código instalado cria uma aba
temporária para finalizar a análise.

Limite da validação: WebKit no Windows pula links com Tab e Alt+Tab, reproduzido também em HTML
mínimo com um input, link e botão. Nesse motor/plataforma, o cenário do filtro usa clique apenas
no link da próxima página; Chromium/Firefox verificam esse link por teclado. Não declarar
cobertura de paginação por teclado no WebKit do Windows. A jornada essencial SC-004 continua
exigindo teclado nos controles de cadastro, vínculo, análise e consulta de situações. A
[documentação do Safari](https://support.apple.com/en-ae/guide/safari/cpsh003/mac) distingue
Tab e Option-Tab no macOS; esse comportamento não foi presumido como disponível no Windows.

## Revisão dos filtros e pesquisa OAB — 10/09/2026

T023 concluída: interface usa “Estado da OAB” e “Todos os estados”; os filtros de seleção
aplicam imediatamente. Pesquisa com lupa dentro do campo à direita e Enter; combinações,
reinício de paginação, histórico do navegador, Limpar filtros e preservação de foco cobertos.
O cenário versionado em `apps/web/tests/e2e/members.spec.ts` foi atualizado para essa jornada.

Validação desta revisão: Chromium, Firefox e WebKit aprovados em 390 × 844, usando somente
consultas ao banco local existente e uma sessão administrativa já ativa. Foram verificados
seleções automáticas, combinação de campos, paginação, retorno pelo histórico, limpeza,
busca por botão e Enter, seleção por teclado e seleções rápidas; axe sem violações nos critérios
WCAG 2/2.1/2.2 A/AA configurados, sem rolagem horizontal nem erros de página. A lupa também
foi inspecionada na captura Chromium. Artefatos locais ignorados em
`.cache/member-filter-validation/`; executor em `.cache/verify-member-filters.mjs`.
Lint dos arquivos TypeScript alterados e typecheck de `@caab/web` aprovados.
Não foi repetido o setup completo de E2E, que cria fixtures, nem reiniciado ou semeado o banco.
Os gates amplos da retomada acima antecedem este ajuste; esta seção não declara nova
execução integral deles.

T024 concluída: guia e implementação da consulta OAB-BA/Implanta encontrados no projeto
anterior; detalhes em [contracts/oab-legacy.md](contracts/oab-legacy.md). A tela avulsa existia
no legado. Na etapa inicial de pesquisa, credenciais históricas não foram copiadas e o provedor não foi chamado. A ativação posterior está registrada abaixo.
Na conclusão de T024, T025 permanecia pendente: integrar e validar a consulta com configuração vigente. Até lá,
a situação OAB no novo painel continua sendo registrada por conferência manual.
Regularidade no serviço não equivale automaticamente a associado ativo, elegibilidade ou crédito.

Associados permanece em `feature/members-management`, sem PR, push ou deploy.

## Botões e ordem do menu — 10/09/2026

T026/T027 concluídas: Associados aparece imediatamente após Notícias no menu; as permissões
continuam sendo verificadas pela mesma função de áreas do workspace. Botões seguem o padrão
compartilhado de Notícias, inclusive links de retorno e paginação. A lupa continua dentro do
campo, com dimensão compacta, borda visível e foco por teclado.

O padrão compartilhado está separado em `feature/button-style-standardization`; seus arquivos
foram integrados ao preview de Associados. Foram aprovadas 28 conferências Chromium em sete
telas (Notícias, lista/novo/detalhe de Associados, Usuários, Configurações e Auditoria), nos
temas claro/escuro e larguras de 1366/390 px. Verificadas medidas, cores, axe nos botões,
ausência de rolagem horizontal, ordem do menu e posição/foco da lupa. Capturas de Associados
em desktop e celular inspecionadas. Artefatos ignorados em `.cache/button-style-validation/`.
Lint dos arquivos TypeScript alterados, typecheck web, formatação e diff aprovados. Nenhum
dado foi criado ou modificado; nenhum PR, push ou deploy foi realizado.

## Limites e rollback

Emissão verificável de credencial, autenticação mobile e definições institucionais de documentos,
vínculos e elegibilidade dependem de decisão posterior. Consulta OAB integrada disponível no localhost; avaliações continuam manuais e independentes.
Leitura para Caassh é contrato interno mínimo, sem homologação externa.

Reversão da aplicação pode ocultar o módulo mantendo suas cinco tabelas, arquivos e histórico.
Não apagar dados nem reverter destrutivamente a migration. Revisão humana específica de acesso,
dados pessoais, uploads e migration exigida antes do merge. Associados não foi integrado a dev
nem implantado.

## Consulta OAB integrada e limite de entrada — 10/09/2026

T025 concluída localmente; T028 reaberta porque o teste real descartado não pode comprovar homologação autorizada. Consulta avulsa e pelo cadastro com members:read,
configuração privada, validação do retorno, auditoria e erros distintos de regularidade.
Permissão/sessão são revalidadas depois do HTTP; mudança da identificação impede entrega
como resultado atual. Nenhuma avaliação ou situação financeira é alterada automaticamente.

- 54 testes unitários aprovados (provedor, rota OAB e rotas de Associados).
- 14 testes de integração aprovados em PostgreSQL descartável: permissões, revogação,
  alteração concorrente, auditoria e limite de consultas; banco local não foi semeado.
- Chromium, Firefox e WebKit aprovados em 390 × 844: estados simulados, consulta pelo
  cadastro, inscrição incompatível, teclado, axe e ausência de rolagem horizontal/erros.
  Corrigida submissão antes da hidratação: controles aguardam os handlers React.
- Depois do limite solicitado de seis dígitos, Chromium verificou maxLength=6, digitação
  truncada no campo e rejeição HTTP 422 de sete dígitos pelo servidor.

Credenciais do STATUS CAAB configuradas somente no ambiente local ignorado. O exemplo
versionado permanece desativado e sem segredos. Origem e adaptações: [LEG-001](../../docs/LEGACY-REUSE.md).
O usuário esclareceu posteriormente que não tinha autorização para usar a inscrição real
indicada. Foram removidos os dois eventos locais dessa consulta, resultados em JSON,
captura e executores específicos; número e situação não são conservados na documentação.
A proteção de auditoria foi mantida após a remoção pontual. Não repetir essa consulta;
futuras regressões devem usar respostas simuladas e dados sintéticos, sem chamar a instituição.

Evidências simuladas locais ignoradas: .cache/verify-oab-ui.mjs e .cache/oab-ui-validation/.
Os três motores antecedem o ajuste para seis dígitos; Chromium e testes unitários/integração
incluem o limite. Não houve configuração de DEV hospedado, PR, push ou deploy.
Associados permanece em feature/members-management.

## Ativação e bloqueio administrativo — 10/09/2026

T029–T031 concluídas. Estado próprio Não ativado/Ativo/Bloqueado; transições explícitas com
permissão de análise, confirmação, justificativa, versão e idempotência. Lista/filtro e resumo
compartilhado expõem o estado; cadastro mostra última decisão e histórico anterior/posterior.
Desbloqueio manual confirmado; efeitos futuros em Agenda registrados no contrato de colaboração.
Comparação com o legado em LEG-002; nenhum prazo, notificação ou regra financeira copiado.

- 23 testes unitários/contratos de comandos e HTTP aprovados; 18 testes de integração de
  Associados aprovados e 14 da consulta OAB aprovados em PostgreSQL descartável.
- Testes cobrem transições inválidas, permissão de análise revogada, concorrência,
  idempotência, rollback de auditoria, constraints e independência de perfil/avaliações/vínculos.
  Bloqueado permite correção/documentos e mantém bloqueio após arquivar/restaurar.
- Chromium, Firefox e WebKit em 390 × 844: confirmação/cancelamento, motivo obrigatório,
  erro de versão, ativar/bloquear/desbloquear por teclado, histórico, filtro imediato,
  axe WCAG A/AA e ausência de rolagem horizontal/erros de página. Alterações interceptadas
  apenas no navegador; nenhuma chamada à instituição ou escrita de cadastro local.
- Corrigida seleção de filtro anterior à hidratação: controles aguardam os handlers React.
  A tentativa inicial Firefox precisou aguardar navegação antes de abrir o detalhe;
  WebKit exigiu prazo de espera maior no executor para a hidratação. Não houve relaxamento
  das verificações de teclado ou alteração de regras para passar os testes.
- Migration 0013 aplicada localmente após validação descartável, mantendo contagens de
  associados, contas e auditoria. Sem seed/reset. Registros existentes sem decisão começam
  Não ativado; nenhuma aprovação foi inferida. Lint e typecheck web/db aprovados.

Executores/capturas ignorados em .cache/verify-member-status-ui.mjs e
.cache/member-status-validation/. Captura Chromium inspecionada. As três execuções de situação
antecedem a compactação posterior dos filtros, registrada separadamente. O cenário versionado
de E2E foi ampliado; o setup completo não foi executado no banco compartilhado. Build/gates
globais para entrega continuam sujeitos à revisão final do módulo. Nenhum PR/push/deploy.

## Compactação dos filtros — 10/09/2026

T032 concluída. Busca sempre visível; filtros adicionais recolhidos por padrão, botão com
contagem ativa, grade de duas colunas no celular e quatro no desktop. Recolher preserva
critérios. Margens reduzidas e botões alinhados à busca. Tabela preserva legibilidade com
largura mínima e rolagem no contêiner existente, sem ampliar a largura da página.

Chromium, Firefox e WebKit aprovados em 390 × 844: abrir/recolher por teclado, contador,
seleção imediata, combinação, paginação, volta pelo histórico, limpeza, lupa/Enter, seleção
rápida, axe e ausência de rolagem horizontal da página ou erros. Chromium também verificou
1366 px e grade de quatro colunas. Formulário recolhido abaixo de 180 px no celular e 110 px
no desktop. Capturas Chromium de desktop/celular inspecionadas; executor e resultados em
.cache/verify-member-filters.mjs e .cache/member-filter-validation/ (ignorados).

Corrigida a interpretação de filtros opcionais vazios na rota HTTP ao reutilizar a URL da
interface. Agora são tratados como não selecionados; valores desconhecidos seguem recusados.
Regressão adicionada: 24 testes unitários/contratos aprovados, lint e typecheck web aprovados.
Sem alteração de cadastros, seed/reset ou consulta externa nesta validação. Nenhum PR/deploy.

## Calendário e campos de contato — 10/09/2026

T033: o ícone de nascimento abre calendário do painel com mês/ano/dia, mantendo entrada
manual. CPF/telefone descartam caracteres não numéricos, limitam onze dígitos e aplicam
máscaras; telefone fixo conserva formato com dez dígitos. E-mail usa a regra do contrato,
exibe erro associado ao campo e impede envio inválido, mantendo preenchimento opcional.

Chromium, Firefox e WebKit aprovados em 390 × 844: abertura pelo ícone e por Enter,
seleção de 29/02 em ano bissexto, ausência do dia em ano comum, seleção refletida no
formulário, Escape sem alteração, foco devolvido, limpeza, digitação manual, máscaras
durante digitação/colagem, limite, descarte de letras e Backspace junto à pontuação.
E-mail inválido marcado e recusado por checkValidity; correção/limpeza removem erro.
Calendário sem violações axe WCAG A/AA; nenhuma rolagem horizontal ou erro de página.
Captura Chromium inspecionada; typecheck web e lint dos arquivos alterados aprovados.

Executor/capturas em .cache/verify-member-profile.mjs e .cache/member-profile-validation/
(ignorados). Cenário de regressão acrescentado ao E2E versionado; setup global não
executado no banco compartilhado. Primeiro acesso aguardou compilação local; seletor
de mês ganhou rótulo explícito e teste de erro foi delimitado ao campo para excluir
o anunciador interno de rotas. Execução final passou nos três navegadores.
Nenhum cadastro salvo, seed/reset, consulta externa, PR ou deploy. Localhost3106 atualizado
na branch feature/members-management; Colaboradores permanece separado, sem implementação.

## Retomada local e nomenclatura — 11/09/2026

Preview reiniciado em http://localhost:3106/members a pedido do usuário, com worker e serviços
existentes de PostgreSQL, storage, ClamAV e Mailpit. Login respondeu HTTP 200; contêineres saudáveis.
A gestão de Usuários passou a se chamar Colaboradores no menu, busca, cabeçalho, páginas e ações.
Rotas /users e permissões preservadas. Alteração também está no worktree .cache/pr-employees.
Não haverá módulo separado de equipe interna/RH; Parceiros continua representando externos.
Doze testes existentes de navegação/Usuários aprovados; formatação dos arquivos de interface
conferida. Seletores E2E atualizados; suíte completa de navegador não executada nesta revisão.

## Verificação final e autorização de entrega — 11/09/2026

O usuário confirmou Associados como pronto e autorizou preparar todos os PRs concluídos
ainda ausentes de dev. A consulta externa OAB continua fora desta rodada de testes;
homologação de credenciais deve ocorrer separadamente. A integração permanece desabilitada
por padrão e a evidência automatizada usa respostas simuladas.

Validação local desta revisão:

- 259 testes unitários/de contrato passaram em 40 arquivos.
- 58 testes de integração de Associados, consulta OAB simulada e Notícias passaram em
  três arquivos, usando bancos PostgreSQL descartáveis.
- Lint completo, typecheck de todos os pacotes e formatação completa passaram.
- Inspeção visual de buscas/filtros nos temas claro e escuro, botões de adicionar com `+`,
  acentuação de Notícias e layout de 390 px. Busca por `Ctrl + K` abriu com foco único visível.
- Campos de busca e ações de lupa/calendário compartilham alinhamento e fundo transparente;
  filtros reutilizam o padrão recolhível de Associados. Corrigidos textos que haviam sido
  salvos com `?` no lugar de letras acentuadas.

Nenhum seed/reset do banco compartilhado, consulta externa OAB ou envio de formulário real
foi usado nesta verificação. Build e E2E completos serão verificados no ambiente isolado do
CI dos PRs; resultados serão registrados após sua execução.
