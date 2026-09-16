# Plano — Mensagens

1. Contratos Zod, migrations aditivas 0021/0022 e permissão única com concessão ao papel administrador existente.
2. Repositório transacional compartilhado web/worker: catálogos, campanha versionada, seleção mínima de associados, bloqueios, execuções e auditoria sem corpo da mensagem nem lista de pessoas nos logs gerais.
3. Rotas autenticadas, validação de origem/CSRF, limites de corpo, idempotência por usuário e operação, revalidação de sessão e permissão no banco.
4. Scheduler durável consulta programações vencidas com locks; cancela por acesso revogado e registra bloqueio por ausência de canal. Falhas revertem transação e permitem repetição. Sem dependência de provedor.
5. UI integrada ao painel com modelos, públicos, preferências, editor/prévia/confirmação e histórico. Estado de edição no WorkspaceDrafts por rota/registro.
6. Contratos, integração PostgreSQL descartável, navegador e acessibilidade no CI. Não iniciar serviços nem build/E2E local por preferência do usuário.

Rollback: retirar navegação e handler/worker novos; manter tabelas aditivas e registros. Sem remoção de dados ou mudanças em módulos anteriores.
