# Plano — Mensagens

**Decisão vigente — 17/09/2026:** Mensagens está em **fase de protótipo, pendente de revisão da finalidade de sua construção**. O código e as evidências existentes documentam o protótipo, não uma conclusão ou homologação do módulo. Revisar finalidade e escopo antes de autorizar sua continuidade; meios, provedores e envio real permanecem adiados.

O plano abaixo registra a construção existente do protótipo. A continuidade depende
da revisão de finalidade, escopo e aceite, acompanhada em M015/M016.

1. Contratos Zod, migrations aditivas 0021/0022 e permissão única com concessão ao papel administrador existente.
2. Repositório transacional compartilhado web/worker: catálogos, campanha versionada, seleção mínima de associados, bloqueios, execuções e auditoria sem corpo da mensagem nem lista de pessoas nos logs gerais.
3. Rotas autenticadas, validação de origem/CSRF, limites de corpo, idempotência por usuário e operação, revalidação de sessão e permissão no banco.
4. Scheduler durável consulta programações vencidas com locks; cancela por acesso revogado e registra bloqueio por ausência de canal. Falhas revertem transação e permitem repetição. Sem dependência de provedor.
5. UI integrada ao painel com modelos, públicos, preferências, editor/prévia/confirmação e histórico. Estado de edição no WorkspaceDrafts por rota/registro.
6. Contratos, integração PostgreSQL descartável, navegador e acessibilidade no CI. Não iniciar serviços nem build/E2E local por preferência do usuário.

Rollback: retirar navegação e handler/worker novos; manter tabelas aditivas e registros. Sem remoção de dados ou mudanças em módulos anteriores.

## Conclusão de formulários

Limpar o cache de inclusão depois da atualização de React, pois useDraftState grava no cache de forma síncrona. Salvar conteúdo de registro existente preserva a programação não confirmada. Duplicar não substitui o cache do registro original. Descarte explícito limpa também o horário não confirmado.

## Evolução de públicos e agendamentos

1. Migration aditiva 0023, cadastro mínimo de segmentação e índices parciais.
2. Contratos compatíveis com públicos antigos, consulta agregada e listas sem teto de 500.
3. Seletores combinados, resumo de audiência e paginação de seleções longas.
4. API/lista de agendamentos e reagendamento com histórico anterior cancelado atomicamente.
5. Testes reais em PostgreSQL descartável no CI, incluindo 100 registros sintéticos; navegador/a11y.
