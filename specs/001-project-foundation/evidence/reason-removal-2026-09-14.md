# Remoção dos motivos escritos em todas as áreas

**Retomado em 14/09/2026, 17:46 de Brasília.** Quality e security do CI final
`34894257595` aprovados; navegador e acessibilidade ainda em acompanhamento.
Nenhum PR/implantação. Checkpoint local atualizado a cada etapa.

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

## Validação

- 260 testes unitários e 89 de contratos aprovados no commit `ba76628`, incluindo
  os três casos adicionais de leitura pública da capa.
- Tipos e lint aprovados localmente. Formatação e integridade do diff conferidas.
- 148 testes de integração aprovados no CI de `ba76628`, com a migration em banco descartável.
- Qualidade, integração, build e segurança do commit `ba76628` aprovados no
  [CI final 34894257595](https://github.com/Komunick/caabnovo/actions/runs/34894257595).
  Navegador ainda não aprovado: documentos de associados falhou e três testes de
  parceiros conservavam o segundo salvamento que antes seguia a exigência de motivo.
  Essas sequências de parceiros foram corrigidas em 14/09/2026; aguardam nova execução.
  Criação/publicação direta de notícias com capa sem descrição, corpo e sem imagem
  passaram no log ao vivo. Um caso OAB sintético passou somente após repetição.
  Atualizar com resultado final de navegador, acessibilidade e captura antes do PR.

As jornadas existentes foram atualizadas para verificar ausência dos campos e concluir
as mesmas operações. Os testes de banco verificam ausência de motivo com auditoria,
substituição/remoção de foto, documentos, avaliações, categorias, contratos e benefícios.
Testes de compatibilidade preservam texto enviado por clientes antigos. Testes negativos
de campos inválidos, permissões, concorrência e falha de auditoria continuam executados.

Servidores e Docker locais permaneceram desligados. Banco/navegador/build executados
em ambientes descartáveis de CI, com dados sintéticos. Nenhuma alteração aplicada à VM.

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
