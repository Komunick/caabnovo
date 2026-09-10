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

## Limites e rollback

Emissão verificável de credencial, autenticação mobile e definições institucionais de documentos,
vínculos e elegibilidade dependem de decisão posterior. OAB é exclusivamente conferência manual.
Leitura para Caassh é contrato interno mínimo, sem homologação externa.

Reversão da aplicação pode ocultar o módulo mantendo suas cinco tabelas, arquivos e histórico.
Não apagar dados nem reverter destrutivamente a migration. Revisão humana específica de acesso,
dados pessoais, uploads e migration exigida antes do merge. Associados não foi integrado a dev
nem implantado.
