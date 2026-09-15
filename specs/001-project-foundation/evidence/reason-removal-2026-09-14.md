# Remoção dos motivos escritos em todas as áreas

**Concluído em 15/09/2026.** Quality, security e browser aprovados no CI de "52fe5f8". Capturas sintéticas revisadas; entrega pronta para revisão por PR.
Nenhuma implantação ou merge executado.

Data: 14/09/2026. Branch única da entrega: `feature/navigation-performance-20260914`.
Decisão vigente do usuário substitui a padronização de justificativas do PR #20.

## Resultado funcional

Os campos e bloqueios de justificativa foram retirados de Colaboradores, Associados,
Parceiros, Notícias, Configurações, exportações de Auditoria e reenvios de Processamentos.
Inclui situações administrativas, vínculos, documentos, avaliações, fotos, acessos,
funções, contratos, benefícios, moderação, publicação, recuperação e arquivamento.

As APIs aceitam omissão/vazio. Texto legado opcional continua limitado para compatibilidade,
mas os formulários não o solicitam nem inventam uma justificativa. A auditoria registra
ator, ação, data, resultado e alterações automaticamente; ausência de motivo vira null
no evento. Colunas históricas não nulas aceitam texto vazio. Motivos antigos não foram apagados.
Autorização, impedimento de autoatribuição, último administrador, concorrência, CSRF,
idempotência e validação dos demais dados permanecem.

A descrição da capa também é opcional no rascunho, na publicação e na leitura pública.
Texto informado é preservado; ausência resulta em `alt=""`. A regra das imagens do
corpo permanece. O contrato público recebeu regressão específica após o teste de
navegador identificar uma segunda exigência de descrição nessa camada.

## Validação final

[CI 34963464044](https://github.com/Komunick/caabnovo/actions/runs/34963464044), commit
`52fe5f8`, concluído com quality, security e browser aprovados:

- 260 testes unitários, 89 contratos e 148 integrações aprovados.
- 60 E2E Chromium e 6 testes de acessibilidade aprovados, sem retries ou flakies.
- Formatação, lint, tipos, build de produção e testes de proteção de branches aprovados.
- Verificação de dependências e segredos aprovada.
- Migration 0019 validada em banco descartável; controles de autorização, CSRF,
  idempotência, concorrência e falha de auditoria preservados pelos testes existentes.

A jornada de documentos conclui upload real, antivírus, análise sem motivo, substituição
e download privado JPG com comparação dos bytes. Também verifica Axe em desktop e
celular escuro, expansão do histórico por teclado e ausência de rolagem horizontal.
As jornadas de Parceiros foram alinhadas ao salvamento único sem motivo e passaram.
Notícias cobre publicação direta com capa sem descrição, corpo e sem imagem, além da
leitura pública e preservação do texto após falha. Contratos cobrem compatibilidade
com motivos legados opcionais.

## Evidências visuais

Capturas sintéticas revisadas em 15/09/2026: descrição opcional da capa visível;
consulta OAB em desktop claro/celular escuro com os sete campos legíveis; documentos
com links que quebram no celular e foco visível no histórico aberto por teclado.

Artefatos do CI final (retenção de sete dias):

- [Documentos](https://github.com/Komunick/caabnovo/actions/runs/34963464044/artifacts/10394392172).
- [Capa opcional](https://github.com/Komunick/caabnovo/actions/runs/34963464044/artifacts/10394392163).
- [Consulta OAB sintética](https://github.com/Komunick/caabnovo/actions/runs/34963464044/artifacts/10394601422).

As capturas de Notícias/OAB também foram revisadas no CI precedente `34962584611`,
com a mesma implementação dessas telas. Cópias locais preservadas em
`.cache/review-20260915` na principal, fora do PR. Servidores e Docker locais
permaneceram desligados; banco/navegador/build rodaram no CI com dados sintéticos.
Nenhuma alteração aplicada à VM ou aos dados reais.

## Migration e rollback

Aplicar `0019_optional_action_reasons.sql` antes de iniciar web/worker desta entrega.
Ela retira apenas restrições de texto obrigatório em funções, análises documentais,
avaliações, decisões administrativas e moderação. Preserva colunas, dados, referências,
responsáveis e datas. A migration intermediária de estado de criação de notícia foi
retirada antes de qualquer PR/implantação; não integra esta entrega.

Rollback pode voltar a aplicação mantendo a migration, sem apagar dados. Não reinstalar
as restrições antigas sem antes avaliar os registros legítimos sem motivo. Reimplantar
texto obrigatório é mudança de regra de produto, não etapa automática de rollback.

## Demais pedidos

- CAASSH aparece como **Desativado — pendente de revisão**.
- Agendamentos tem [pesquisa registrada](../../002-integrated-modules/pesquisa-mercado-agendamentos-2026-09-14.md), sem implementação. Restaurantes são somente possibilidade futura.
- Ativação OAB-BA na hospedagem foi adiada pelo usuário e registrada em `.cache/TASKS.md`
  local. Nenhuma credencial/configuração remota foi alterada.
- Otimização da navegação e migração dos arquivos reais/retirada do MinIO na VM
  continuam pendentes; não estão sendo declaradas concluídas por esta entrega.

## Diagnóstico e correção na retomada — 15/09/2026

CI `34962584611` de `75a3ec3`: quality/security aprovados; 59 E2E passaram.
A única falha foi WCAG 2.2 target-size em documentos: link de 19 px adjacente ao
histórico após retirar o motivo. Upload, análise, substituição e download já passaram.
Correção: link de abertura e resumo do histórico com área mínima de 44 px. A jornada
agora também valida celular escuro, expansão por teclado e gera capturas sintéticas.
Correção aprovada no CI final acima; RM03 concluída nas specs 001–007.
