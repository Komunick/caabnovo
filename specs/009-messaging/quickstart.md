# Validação do incremento — Mensagens: revisão de aderência e exportação condicionada

## Estado e pré-requisitos

Pré-requisitos de execução futura: Node 24/pnpm do package.json, dependências fixadas,
PostgreSQL 18 descartável/Testcontainers e Chromium no CI. Nunca usar banco do preview
ou contas reais como seed. Localhost continua desligado; os comandos abaixo são roteiro,
não foram executados neste planejamento. Variáveis/segredos seguem `.github/workflows/ci.yml`.

```powershell
corepack pnpm install --frozen-lockfile
corepack pnpm test:unit
corepack pnpm test:contract
corepack pnpm test:integration apps/web/tests/integration/messaging.test.ts
corepack pnpm test:e2e messaging.spec.ts --project=chromium
corepack pnpm test:a11y --project=chromium
```

O job browser existente prepara ambiente/contas sintéticos; não copiar seus seeds
para o preview principal. Testes de migração/conflito usam banco descartável. Antes
de entrega de código, completar format/lint/typecheck/build/security e evidências
visuais pelo workflow de CI, sem iniciar builds/serviços pesados no computador.

## Jornada independente

Após M016, conferir preparo/segmentação/programação sem envio real; exports respeitam a projeção mínima e formatos/colunas; nenhum botão/tela de chat ou ticket; alterações no protótipo dependem do gate registrado.

Para cada dataset do contrato, abrir Exportar [módulo], variar filtros, selecionar/reordenar colunas por teclado e baixar Excel/CSV/PDF. Ler arquivos com parsers independentes, confrontar IDs/contagem/conteúdo/ordem com a massa conhecida. Vazio mantém cabeçalho; mais de uma página não corta resultados.

Matriz negativa: anônimo, sessão revogada, sem acesso, leitura sem geral, geral sem
leitura, leitura+geral sem escrita, campo proibido, operação de outro usuário e
revogação entre lotes. Preservar filtros após falha; interrupção não retorna sucesso.
Testar teclado,390 px, desktop e temas. Módulos negados têm zero entradas no menu,
busca e Início; controles pessoais da conta continuam disponíveis.

## Evidência esperada

Registrar comandos, versões/commit, fixtures sintéticas, resultados, arquivos
validados e capturas em `specs/009-messaging/evidence/plan-2026-09-21-validation.md`
(arquivo futuro). Nunca marcar tarefas como concluídas por este roteiro.
Requisitos e representações: [modelo](data-model.md), [contrato](contracts/exports.md).

## Roteiro anterior — histórico

Não executar serviços/seeds indicados abaixo no preview principal. O roteiro atual
usa CI/banco descartável; passos substituídos não autorizam reativação local.

<details>
<summary>Roteiro anterior preservado</summary>

# Mensagens — uso e validação

## Preparar uma campanha

1. Acesse **Mensagens → Campanhas → Nova campanha**.
2. Informe o nome interno, assunto e mensagem. Modelos copiam assunto/texto para a edição atual; não mantêm vínculo que altere campanhas antigas.
3. Na etapa **Público**, selecione um público salvo ou configure filtros. A definição do público salvo é copiada; editar seu cadastro depois não muda a campanha. As pessoas que atendem à definição são recalculadas na execução.
4. Sem seleção individual, entram associados não arquivados que atendem aos filtros. Use seleção individual para restringir e exclusões para retirar pessoas. Bloqueios gerais sempre prevalecem.
5. Salve o rascunho e atualize a **Prévia**. Confira texto personalizado, contagens e amostra de nomes. As variáveis disponíveis são `{{nome}}` e `{{primeiro_nome}}`.
6. Solicite envio imediato ou programe um horário de Brasília (UTC−3), confirmando a revisão. Sem meio de envio configurado, a execução termina **Bloqueada**; não existe transmissão real nesta etapa.

Programações podem ser canceladas. Enquanto programada, a campanha não aceita edições;
cancele para editar e programe novamente. Remoção do acesso do solicitante cancela a execução
pendente. Conta desativada também não mantém autorização.

## Organização e preferências

Modelos e públicos têm inclusão, edição, arquivo e restauração. Duplicar campanha cria
um rascunho independente e sem histórico herdado. Arquivar preserva as solicitações anteriores.
O histórico mostra versão, conteúdo, critérios, contagens e motivo de cada execução, sem
confundir solicitação com envio ou entrega.

Em **Preferências**, selecione um associado e registre o motivo do bloqueio geral ou de sua
remoção. Remover bloqueio não cria consentimento para um canal futuro. Preferências específicas
e meios/provedores serão definidos na próxima etapa.

## Edição e acesso

A única permissão é `messages:access`, na gestão de acessos de **Colaboradores**. Toda pessoa
que a possui pode preparar, programar e solicitar; não existe papel editorial adicional.
Seleções explícitas de acesso anteriores são preservadas pela migration.

Edições ficam em memória durante a navegação autenticada, separadas por registro e formulário.
Não são salvamento automático nem recuperação após fechar/recarregar a página. Salve antes de
encerrar a sessão. Conflitos preservam a edição e informam a mudança de versão. **Descartar
edições** é explícito e carrega a versão atual do servidor.

## Verificação técnica

CI aplica migrations 0021/0022 em PostgreSQL descartável, com testes usando caab_runtime.
Há testes de contrato, autorização, concorrência, preferências, programação, auditoria e
navegador; a jornada registra capturas em 390px e desktop, nos dois temas, com Axe e contraste.
Não usar dados pessoais reais em automação. Localhost e banco local permanecem pausados por
preferência vigente. A disponibilização no DEV ocorre após merge humano do PR.

## Públicos e agendamentos

Preencha os dados de segmentação em Associados quando disponíveis. Em Mensagens, Público permite combinar categoria, gênero, titular/dependente, cidade, estado de residência, estado OAB, idade e situação Ativa/Inativa. Todos os cadastros remove filtros e seleções. Confira a contagem integral na Prévia. A aba Agendamentos permite criar, buscar por campanha/status/período, reagendar e cancelar. Novo agendamento abre campanha com data disponível antes de salvar; salvar mantém o horário digitado para confirmação. Meios de envio continuam pendentes.

</details>
