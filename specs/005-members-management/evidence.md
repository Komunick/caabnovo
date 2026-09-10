# Evidências — Associados

**Situação**: testes do incremento atual aprovados; módulo ainda em implementação e validação
funcional, conforme orientação do usuário. Este documento não declara Associados pronto para PR.

10/09/2026. Branch `feature/members-management`, baseada em `origin/dev` `74d7bd0`.
Somente dados sintéticos; nenhum consumidor externo, política institucional ou ambiente de produção
foi alterado. Código parcial preservado e atualizado para a base com Notícias integrada.

## Especificação e escopo

Checklist de requisitos: 16/16. Permissões `members:read`, `members:write`, `members:review`
confirmadas pelo usuário em 10/09; concessão inicial ao administrador existente. Revisão documental
append-only, situações independentes e fronteiras com Usuários/Caassh mantidas. Credencial é situação
e validade, sem emissão de cartão verificável.

## Verificação executada

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

## Cenários negativos

- CPF duplicado e edições simultâneas produzem um único vencedor; retries não duplicam registros.
- A→B/B→A concorrentes não formam ciclo; encerramento/arquivamento/restauração preservam referências.
- Conta desativada/sessão revogada e concessões removidas/expiradas são recusadas no banco, mesmo com
  ator antigo em memória; administrador sem MFA é recusado.
- Somente consulta não permite escrever ou analisar; arquivos genéricos não contornam o acesso a Pessoas.
- Arquivo de outra pessoa, em quarentena ou com resultado de scan alterado não recebe download.
- Substituição mantém documento e revisões anteriores; cada nova evidência começa pendente.
- Falha na auditoria reverte a alteração. Histórico de vínculos é consultável pelas duas pessoas.
- Alteração de identidade sinaliza avaliação anterior; aprovação cadastral não modifica finanças ou elegibilidade.

## Ambiente de revisão

Localhost em `http://localhost:3105/members`, com recarga automática e worker ativo. Serviços Docker
no projeto separado `caab-members-validation`; credenciais são as fixtures sintéticas locais.
Aba de Chrome aberta com administrador autenticado mediante MFA. O diretório principal conserva seu
trabalho anterior; o código executado está no worktree `.cache/pr-members`.

## Limites e rollback

Emissão verificável de credencial, autenticação mobile e definições institucionais de documentos,
vínculos e elegibilidade dependem de decisão posterior. OAB é exclusivamente conferência manual.
Leitura para Caassh é contrato interno mínimo, sem homologação externa.

Reversão da aplicação pode ocultar o módulo mantendo suas cinco tabelas, arquivos e histórico.
Não apagar dados nem reverter destrutivamente a migration. Revisão humana específica de acesso,
dados pessoais, uploads e migration exigida antes do merge. Não foi realizado merge ou deploy.
