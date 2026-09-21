# Contrato do incremento — Fundação, Colaboradores e infraestrutura de exportação

Estado: planejado em 21/09/2026, sem implementação.

Colaboradores: dataset users e contexto de acessos do cadastro; filtros nome, e-mail, estado e concessões quando disponíveis no serviço. Seleção inicial acompanha a tabela. Cadastro/concessão de acessos não é efeito de exportar; sem users:read negar todos os datasets de contas. Guardas legadas audit/report devem resolver exports:generate e manter requisitos de domínio. Métodos de conta pessoal continuam conforme spec 006.

`exports:generate` é concessão independente; `scheduling:write` exige `scheduling:read` no contrato de acessos. user_access substitui herança e mantém version para não administradores; Administrador ativo mantém todo o catálogo, conforme [cargos](roles.md); role_permission mantém ligação com papéis, sem criar user_role. Invariantes de migração Q4 e remoção Q8 testadas separadamente. export_operation e transições seguem contrato transversal; nunca armazenar senha inicial, hashes, tokens ou segredos na exportação de contas. Fonte Colaboradores usa users existentes; campos iniciais nome/e-mail/situação e campos já consultáveis, com seleção autorizada de acessos apenas onde a leitura existente permitir.

Aplicar [contrato transversal](../../002-integrated-modules/contracts/direct-exports.md)
onde houver exportação: filtros, columns ordenadas, formato xlsx/csv/pdf, download nativo,
erros, estado operacional e reautorização. O contrato descreve novos caminhos planejados,
não garante que existam no checkout. Gate de Mensagens permanece quando aplicável.

Aceite independente: Perfis Associados+Colaboradores com geral exportam só essas fontes; conversão preserva herança expirada/revogada e override vazio; sem módulo não há elemento nas três superfícies; writer respeita colunas, grande volume, CSRF, revogação e interrupção.

Administrador e Gestor têm exportação geral por seus cargos. Gestor também consulta todos os módulos e possui acesso completo a Relatórios; pode conceder exportação a terceiros. Colaborador não concede. A interseção com leitura da fonte/campo permanece para exportar. Consulta OAB continua sem exportação.
