# Tarefas — Mensagens

**Decisão vigente — 17/09/2026:** Mensagens está em **fase de protótipo, pendente de revisão da finalidade de sua construção**. O código e as evidências existentes documentam o protótipo, não uma conclusão ou homologação do módulo. Revisar finalidade e escopo antes de autorizar sua continuidade; meios, provedores e envio real permanecem adiados.

Tarefas marcadas abaixo comprovam trabalho técnico realizado no protótipo; não
representam aprovação de finalidade ou conclusão do produto.

- [x] M001 Pesquisa, escopo, plano, contratos e limites de canais registrados.
- [x] M002 Contratos e migration com permissão única, catálogos, supressões e execuções.
- [x] M003 Serviços transacionais, público, prévia, idempotência, versões e auditoria.
- [x] M004 Rotas autenticadas e scheduler durável sem envio fictício.
- [x] M005 UI completa no padrão do painel, persistência das edições e limpeza isolada de inclusões concluídas.
- [x] M006 Testes de contrato, autorização, concorrência, exclusões e programação.
- [x] M007 Navegador, acessibilidade e evidências responsivas no CI.
- [x] M008 Documentação integrada, PR atualizado, checks finais e principal sincronizada.

## Etapa posterior acordada

- [ ] M009 Definir meios/provedores, finalidade/consentimento, limites, conteúdo por canal, credenciais e homologação real.
- [ ] M010 Implementar entrega por destinatário/canal e callbacks autenticados com deduplicação e métricas comprovadas.

Evidências e execuções de CI: [validation.md](evidence/validation.md). Entrega anterior revisada pelo usuário; segmentação e agendamentos completados e validados; M009/M010 permanecem adiadas e dependem primeiro da revisão M015/M016.

## Correção solicitada — concluída

- [x] M011 Cadastro e filtros por categoria, gênero, vínculo, cidade, idade, UF e situação Ativa/Inativa.
- [x] M012 Remover teto de seleção e provar contagem integral com 100 registros sintéticos, com payload e UI controlados.
- [x] M013 Aba Agendamentos, criação visível, cancelamento e reagendamento auditado.
- [x] M014 Testes de contrato/integração/navegador, evidências e CI completo.

## Revisão de finalidade — decisão de 17/09/2026

- [ ] M015 Revisar com o responsável pelo produto a finalidade de construção de Mensagens, problema atendido, usuários e necessidade do módulo.
- [ ] M016 Registrar decisão de continuidade, reformulação ou cancelamento e, se houver continuidade, atualizar escopo, plano e critérios de aceite antes de nova construção.
