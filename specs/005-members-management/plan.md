# Implementation Plan: Associados

## Coordenação com Agendamentos — 15/09/2026

Extrair o lock de vínculos 5010/1 para lockMemberEligibility no repositório.
Usá-lo antes dos locks de linhas em todos os comandos que alteram a elegibilidade
consumida pela agenda. Adicionar findSchedulingBeneficiary, sem mudar o contrato
findMemberSummary. Testar bloqueio próprio/ancestral, vínculo futuro/encerrado e
comandos concorrentes reais em tests/integration/scheduling.test.ts.

Branch `feature/members-management` · 2026-09-09 · [Spec](spec.md)

## Summary

## Incremento: foto de perfil — 11/09/2026

**Pronto e aceito pelo usuário em 11/09/2026.** Foi confirmado que a foto será enviada pelo
próprio associado no app e exibida no painel a partir da mesma referência. A implementação
do fluxo do app deverá reutilizar a foto de Associados e autorizar somente o titular da
conta vinculada; integra o escopo do app. Este aceite conclui o incremento administrativo,
sem declarar o envio pelo app implementado.

Branch `feature/member-profile-photo`, baseada em dev após #16. Migration aditiva 0015:
`member.photo_file_id` opcional com FK para stored_file. Comando `photo` com fileId/null
reutiliza versão, idempotência, autorização e auditoria transacional. Revalidar proprietário,
privacidade, MIME real, tamanho e liberação. Preservar profile_version e avaliações.

Reutilizar upload-intent, storage, finalize e worker. Consultar estado do arquivo por ID
autorizado; a UI só vincula após liberação. Cabeçalho com avatar circular privado e fallback;
aba Cadastro com seletor, prévia, justificativa e salvar/remover com feedback acessível.
No novo cadastro, selecionar e visualizar a foto antes de salvar. Criar o registro de forma
idempotente e executar o mesmo envio privado usando seu ID e motivo do cadastro. Em falha,
preservar o associado criado e oferecer repetir a foto ou abrir o cadastro sem duplicação.

Validar contrato, negações, concorrência, idempotência e rollback em banco descartável.
E2E com imagem sintética e storage isolado, substituição/remoção, temas e 390 px.
PR único para dev com gates; sem seed compartilhado, consulta OAB ou merge automático.

## Plano original

Cadastro único, dependências históricas, documentos privados e avaliações manuais independentes. Reutilizar fundação, sem login adicional, CMS ou saldo de créditos.

## Technical Context

TypeScript 6, Next/React e Zod nas versões do lockfile; PostgreSQL 18 com pg e migrations SQL. Vitest, Testcontainers, Playwright e axe. Monólito modular Linux/Windows. Listas de 25 e histórico de 50 por página. JSON <=64 KiB; arquivos PDF/JPEG/PNG <=25 MiB na fundação. UTC e exibição America/Bahia. Nenhuma dependência nova.

## Constitution Check

Desenho revisado em 10/09: cinco tabelas, autenticação/arquivos/auditoria reutilizados. Permissões members:read, members:write e members:review, sem novo papel; administrador existente recebe as concessões. Todas são revalidadas no banco em cada operação; arquivos exigem ainda files:read/create. Integridade transacional, avaliações manuais e testes negativos. Credencial é situação/validade, sem emissão institucional. Gates pendentes de execução, sem exceção arquitetural.

## Project Structure

- packages/contracts/src/members.ts: schemas.
- packages/db/migrations/0010_members.sql e src/repositories/members.ts: persistência e resumo para Caassh.
- apps/web/modules/members/: serviço, HTTP e UI.
- apps/web/app/(admin)/members/ e app/api/v1/members/: páginas/API.
- apps/web/tests/integration/members.test.ts e tests/e2e/members.spec.ts: validação.

Revisão funcional de 10/09: `member-filters.tsx` controla os campos e navega com `router.push`
ao selecionar filtros, sem recarregar o documento. A URL continua sendo a fonte da consulta
no servidor e da paginação; voltar/avançar sincroniza os controles sem remontá-los. A busca
textual usa Enter ou a lupa dentro do campo, com nome acessível “Buscar”. Seleções mantêm o
texto e os outros filtros, reiniciam a página e informam a atualização às tecnologias assistivas.

Compactação solicitada em 10/09: busca e botão Filtros ficam na barra inicial; os quatro
selects ficam em painel recolhível, duas colunas no celular e quatro no desktop. Contagem
considera somente filtros de seleção fora do padrão, não o texto de busca. Recolher não
limpa critérios; controles aguardam hidratação. HTTP normaliza filtros opcionais vazios
como não selecionados, mantendo validação de valores desconhecidos. Tabela recebe largura
mínima dentro do contêiner rolável existente para evitar palavras quebradas no celular.

## Sequência e dependências

Ativação/bloqueio: migration aditiva `0013_member_administrative_status.sql` (0010–0012
inalteradas), coluna de estado com CHECK, metadados da última decisão e histórico em
audit_event existente. Comandos activate/block/unblock exigem members:review no HTTP e na
transação, usam o lock/version/idempotency atuais. Estado anterior/posterior ficam no evento;
nenhuma chamada externa ou alteração de avaliações. Lista e resumo recebem campo aditivo
administrativeStatus. UI confirma ação e justificativa; filtro usa a navegação existente.

Consulta OAB: `oab-provider.ts` isola o endpoint OAB-BA/Implanta e suas credenciais;
`oab-service.ts` revalida autorização e identificação antes/depois da chamada. A rota
`POST /api/v1/members/oab-query` recebe JSON limitado, exige origem/CSRF e não é cacheável.
O PostgreSQL registra início e conclusão/falha na auditoria existente; nenhuma migration
ou tabela adicional. Uma transação curta com advisory lock limita seis inícios por minuto
por operador; a chamada HTTP ocorre fora da transação e termina em até 95 segundos,
incluindo leitura do corpo de até 64 KiB. Sem retry automático ou redirecionamento de
credenciais. `/members/oab` reutiliza os componentes e o padrão visual de Associados.
Credenciais vigentes e teste com inscrição autorizada são necessários para homologar a conexão.

US1 cadastro/vínculos → US2 documentos → US3 avaliações → US4 consumidores/navegação → gates/PR. Caassh segue o [handoff](contracts/caassh-handoff.md), sem presumir outra instância ativa. Base atualizada para origin/dev be46efa em 10/09/2026, com Notícias, Configurações, remoção do autenticador e correção de URLs públicas atrás de proxy. PR final contém Associados e os ajustes necessários da fundação para proteger seus arquivos; permanece suspenso até conclusão e revisão funcional solicitada pelo usuário.

Campos comuns (11/09/2026): consumir MaskedContactInput/ValidatedTextField e contratos
compartilhados de telefone/e-mail; preservar o componente de nascimento e o seletor
válido de UF da OAB. Validação/entrega transversal pelas tarefas CF01–CF03 da fundação.
## Campos — 14/09/2026

Reutilizar oabNumberSchema em memberProfileSchema e máscara oab no componente compartilhado; consulta mantém leitura de registro legado e recusa incompatibilidade sem truncar dados persistidos.

## Plano da padronização de justificativas — 14/09/2026

1. Atualizar contratos de criação/alteração e registrar a distinção no serviço e auditoria.
2. Ajustar formulários e mensagens; manter ações sensíveis, permissões e concorrência.
3. Cobrir contratos negativos, criação sem motivo e motivo persistido em integração/E2E.
4. Executar formatação, lint, typecheck e testes sem serviços locais; CI executa banco,
   navegador e build. Abrir PR somente após validar a branch nova. Esta entrega é uma
   regra compartilhada coesa, coordenada pela spec 001, sem criar spec duplicada.

## Plano: resultado OAB selecionado — 14/09/2026

1. Registrar contrato observado sem valores pessoais e seleção autorizada no contrato OAB existente.
2. Ampliar somente a projeção privada do adaptador/contrato com CPF, inadimplência, detalhe, subseção e data de compromisso; mapear SIM/NÃO de forma independente e desconhecido para null.
3. Renderizar os sete campos selecionados com lista de descrições sem repetir inscrição; preservar mensagens de falha e fonte/horário.
4. Validar projeção, descarte de campos não selecionados, dados ausentes/desconhecidos, auditoria sem novos dados pessoais e apresentação acessível em desktop/mobile com fixtures sintéticas. Executar integração/navegador no CI, sem localhost.
5. Entregar na branch ativa do ciclo junto à padronização, sem abrir outra branch antes do PR. Nenhuma migration, dependência ou configuração adicional.


## Regra vigente: nenhuma justificativa obrigatória — 14/09/2026

Atualizar contratos e serviços desta função para aceitar omissão/vazio; manter o campo opcional no contrato para compatibilidade com clientes antigos. Retirar entradas, estados e bloqueios de justificativa das telas. Normalizar ausência para vazio nas colunas históricas não nulas e para null na auditoria; preservar autoria, resultado e datas. Migration aditiva de política retira somente restrições de texto obrigatório, mantendo consistência das decisões. Não são necessários estados especiais de criação de notícia. Cobrir ausência em contratos, autorização, integração e E2E; executar banco/navegador/build no CI com serviços locais desligados.

### Correção de acessibilidade da RM03 — 15/09/2026

Dimensionar os controles de abertura/histórico de documentos independentemente do texto
opcional do motivo. Reexecutar a jornada com download real, Axe em desktop/celular e
abertura do histórico por teclado; preservar capturas sintéticas no CI para revisão.
