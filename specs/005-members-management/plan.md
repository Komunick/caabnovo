# Implementation Plan: Associados: preservação manual, agenda e exportação

**Branch da entrega**: `docs/project-clarify-20260921` | **Data**: 2026-09-21
**Spec**: [spec.md](spec.md) | **Estado**: desenho concluído; implementação/validação pendentes.

## Summary

Exportar dados autorizados de Associados e conferir efeitos de bloqueio na agenda sem presumir políticas institucionais.

US1 cadastro/vínculos; US2 documentos; US3 situações; US4 consumidores e US5 exportação. P01/POL01, credencial, OAB hospedada e acesso externo continuam pendentes.

## Technical Context

TypeScript 6.0.3, Node 24, Next 16.3.4, React 19.2.8, Zod 4.5.4 e pg8.23.0 do checkout;
PostgreSQL 18 no CI. Monólito modular; banco também armazena arquivos legados. Sem S3/MinIO
novo. Testes Vitest 4.1.11, Playwright 1.62.1 e Axe existentes. UI desktop/390 px, temas,
teclado e tokens compartilhados. Exportação incremental com pg-cursor/ExcelJS propostos
e PDFKit existente, sujeitos a spike/versão fixada no código; nenhum pacote instalado agora.

**Performance/escala**: preservar p95 de 2s das telas comuns; não aplicar esse alvo a
transferência integral arbitrária. Exportações não têm teto funcional de registros/período.
Aplicar o [perfil C1 de100 registros](../002-integrated-modules/export-validation-100.md):
medir tempo/recursos e validar integridade, resposta do painel e recuperação. Sem prova
de estresse/grande volume nesta rodada; manter produto sem teto funcional de registros.
**Restrições**: banco único, autorização atual por ação; sem localhost, deploy, seed real,
limpeza de dados ou implementação nesta fase. Q10/Q11 e módulos futuros continuam adiados.

## Constitution Check

Pré-pesquisa: escopo decorre de Q1–Q11 e complementos, sem política institucional inferida.
Pós-desenho: monólito/fonte única, negação por padrão, auditoria mínima, integridade no
PostgreSQL e UI compartilhada preservados. Constituição 2.0.0 concilia justificativas já
retiradas; autenticação continua sem MFA. Abstração de exportação cobre oito consumidores
reais, sem CRUD genérico. Não há violação de desenho sem justificativa. Aprovações
institucionais/produção permanecem pendentes; compatibilidade do desenho não é execução de gates.

## Phase 0 — Research

Decisões, alternativas e fontes em [research.md](research.md), com pesquisa transversal
[de 21/09](../002-integrated-modules/research-2026-09-21.md). Leitura estática conclui
as escolhas necessárias para este recorte; limitações operacionais viram validações
de implementação, não requisitos indefinidos. Sem consulta a contas/dados de produção.

## Phase 1 — Design

- Consulta OAB fica fora da exportação: não criar botão nem dataset de seu resultado, avulso ou pelo cadastro. Preservar a exportação dos dados cadastrais autorizados.
- Reutilizar members:read/write/review; exportação precisa read+geral e permissões específicas já aplicáveis aos dados privados. Não incluir documentos binários, criar chamada OAB ou ampliar leitura mínima de Agendamentos.
- Preservar findSchedulingBeneficiary e lockMemberEligibility em bloqueios/desbloqueios/ativação/vínculos/arquivo; spec 008 deriva aviso de bloqueio sem mutar estado da reserva ou status próprio de dependentes.
- Testar vínculo vigente versus futuro/encerrado, cadeias de titulares, reserva mantida e remarcação negada. Nenhum novo critério de parentesco, documento obrigatório ou aprovação automática é criado.
- Adapter por dataset usa consulta parametrizada com paginação interna de memória; filtros e ordem da tela não restringem o arquivo à página. Metadados documentais seguem acesso atual de Arquivos; históricos não ganham dados fora da projeção permitida.

Modelo em [data-model.md](data-model.md), interface em [contracts/exports.md](contracts/exports.md)
e [contrato comum](../002-integrated-modules/contracts/direct-exports.md). UI preserva
rascunhos/filtros e dados em falhas, sem exigir justificativa. Catálogo de colunas é
allowlist por função; servidor não confia no catálogo antigo do navegador.

## Project Structure

- `apps/web/modules/members/member-service.ts` (existente).
- `packages/db/src/repositories/members.ts` (existente).
- `apps/web/modules/members/access.ts` (existente).
- `apps/web/modules/members/ui/member-editor.tsx` (existente).
- `apps/web/modules/members/ui/member-administrative-status.tsx` (existente).
- `apps/web/modules/members/export-adapter.ts` e `export-adapter.test.ts` (novos planejados).
- `apps/web/app/(admin)/members/exportar/page.tsx` (nova planejada).

## Rollout, migração e rollback

Uma entrega/worktree; mudanças SQL aditivas e numeradas coordenadas pela spec001.
Preparar compatibilidade de leitura de chaves/snapshots antes de ativar migrações e
novos botões. Conta sem acesso não ganha concessão para preservar conveniência.
Diagnosticar conflitos antes da restrição008; parar sem corrigir registros automaticamente.
Rollback da UI/API deve preservar grants convertidos, dados e arquivos; não publicar
binário antigo que dependa exclusivamente de audit:export/reports:export após conversão.
Preferir correção compatível para frente; reversão SQL exige plano e evidência próprios.

## Validation e próximo passo

Exportar associados/dependentes sem acesso a Relatórios; negar documento/campo restrito; bloqueio mantém reservas e vaga, sinaliza vínculos vigentes e não afeta situação própria; manter análise manual sem novas exigências.

Executar roteiro [quickstart.md](quickstart.md) na implementação. Evidência anterior
nunca conclui tarefa nova. Pesquisa/plan encerrados; próximo comando desta solicitação:
speckit-tasks, organizado por história, com dependências e critérios independentes.

## Complexity Tracking

Núcleo comum necessário para aplicações repetidas em oito funções; adaptadores mantêm
as regras dos domínios. Sem microserviço, linguagem nova ou nova fonte de verdade.
Estado operacional serve somente à transferência atual; não é fila/histórico obrigatório.

## Histórico anterior — referência, não sequência executável atual

O conteúdo abaixo preserva decisões/evidências anteriores. Em caso de divergência,
valem o desenho de 21/09 acima e a spec vigente; não reabrir branches/PRs já integrados.

<details>
<summary>Plano anterior preservado</summary>

# Implementation Plan: Associados

## Coordenação com Agendamentos — 15/09/2026

Clarificação de 20/09/2026: manter reservas futuras após bloqueio e projetar sua
sinalização para decisão manual conforme spec 008, FR-017. Reutilizar vínculos e
impedimentos vigentes sem alterar a situação própria do dependente. A evolução
da agenda fica em BLQ01/BLQ02 da spec 008; regressão conjunta pendente, sem retomada
de implementação neste /clarify.

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

## Plano: configuração OAB para deploy — proposta inicial substituída, 15/09/2026

Histórico do PR25; seguir o **Ajuste final: remover controle de ativação** abaixo.

1. Comparar APIs oficiais com o contrato STATUS CAAB e registrar fontes/limites.
2. Tornar a flag opcional no adaptador em execução, preservando desativação explícita
   e bloqueio de valores inválidos. Atualizar exemplo e contrato, sem segredos.
3. Cobrir consulta sem flag, precedência de false e configuração incompleta em testes
   do adaptador; validar regressões da rota e contrato. CI executa banco/build/navegador.
4. Registrar evidências e entregar PR da branch isolada; deploy pelo fluxo existente.

### Ajuste final: remover controle de ativação — 15/09/2026

Substituir a condição de ativação por verificação exclusiva das duas credenciais.
Retirar a flag do exemplo e documentar que valores legados são ignorados. Cobrir false,
vazio e valores antigos nos testes; preservar recusa de credenciais incompletas.
Executar regressões/CI e entregar em nova branch/PR que substitui PR25, já congelado.

## Conferência do workflow — 15/09/2026

Publicar a entrega no prefixo fix, retirar a exceção codex do CI, identificar propostas
substituídas e alinhar STACK/LEG-001 ao contrato vigente. Preservar implementação e
referências dos PRs anteriores; novo PR com template/checklist e rollback explícitos.
Conferir igualdade da aplicação e do workflow com as bases validadas. Limites remotos
registrados em evidence/workflow-compliance-2026-09-15.md; não presumir homologação.


## Preservação compartilhada — 16/09/2026

Branch fix/scheduling-select-20260916, baseada em dev após PR29. Usar armazenamento temporário
em memória no layout autenticado, por rota/formulário/cadastro, com controles nativos e estado
React preservados. Integrar sucesso/cancelamento aos descartes e testar navegação entre módulos.
Não usar cache público, localStorage ou salvamento automático no banco.

## Plano da homologação — 16/09/2026

1. Conferir DEV, permissões GitHub, configuração versionada e entradas institucionais.
2. Validar as jornadas autorizadas com registros sintéticos isolados; nunca publicar a notícia de teste.
3. Corrigir lacunas técnicas em uma única branch, com testes dos controles e CI remoto.
4. Registrar resultados por ambiente, pendências externas e limites; abrir PR para dev sem merge ou aprovação.

## Dados para segmentação de Mensagens — 16/09/2026

Adicionar categoria, gênero, cidade e UF de residência opcionais, com validação,
persistência e edição nas permissões/versões/auditoria existentes. Registros atuais
permanecem sem esses dados até preenchimento explícito. Não confundir residência e OAB.
Validar criação/edição/consulta e preservar dados nas demais operações de cadastro.

## Regras institucionais de dependentes e documentos — Q11 de 21/09/2026

Manter cadastro/análise manual existentes enquanto P01 aguarda definição
institucional. Não implementar critérios de parentesco, obrigatoriedade documental,
aprovação ou reprovação automáticas por suposição. Preservar integridade de pessoas
e vínculos, arquivos e acessos. Decisão não muda bloqueios administrativos e regras
de reserva já confirmados. POL01 permanece pendente; nenhuma alteração de código
ou teste foi executada para registrar esse adiamento.

## Checkpoint de revisão de código — 21/09/2026

Cadastro, foto, dependentes, análise manual, situação e adaptador OAB implementados. Bloqueio próprio/por titular já impede novas reservas; falta indicação na agenda/detalhes e regressão AE04. T028 continua homologação/configuração adiada; POL01 e P02/P03/P04/D02 são decisões institucionais/externas pendentes. Exportação própria DX01 ausente.

Revisão estática da base `ed31baf`; nenhum teste de aplicação ou homologação nesta etapa.
Evidências e limites: [revisão transversal](../002-integrated-modules/code-audit-2026-09-21.md).

Executar adequações e seus testes em retomada de implementação. Preservar dados e decisões adiadas; a revisão atual altera somente documentação.

</details>
