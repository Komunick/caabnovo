# Contrato do incremento — Fundação, Colaboradores e infraestrutura de exportação

Estado em21/09/2026: implementado no recorte Colaboradores/base comum; validação final de navegador
em andamento.

Colaboradores: module `users`, dataset `accounts` e contexto de acessos do cadastro; filtros nome,
e-mail, datas de criação, estado e exclusão. Colunas de cargos/acessos exigem roles:read. Seleção
inicial acompanha a tabela. Cadastro/concessão de acessos não é efeito de exportar; sem users:read
negar todos os datasets de contas. Guardas legadas audit/report devem resolver exports:generate e
manter requisitos de domínio. Métodos de conta pessoal continuam conforme spec 006.

`exports:generate` é concessão independente; `scheduling:write` exige `scheduling:read` no contrato
de acessos. user_access substitui herança e mantém version para não administradores; Administrador
ativo mantém todo o catálogo, conforme [cargos](roles.md); role_permission mantém ligação com
papéis, sem criar user_role. Invariantes de migração Q4 e remoção Q8 testadas separadamente.
export_operation e transições seguem contrato transversal; nunca armazenar senha inicial, hashes,
tokens ou segredos na exportação de contas. Fonte Colaboradores usa users existentes; campos
iniciais nome/e-mail/situação e campos já consultáveis, com seleção autorizada de acessos apenas
onde a leitura existente permitir.

Aplicar [contrato transversal](../../002-integrated-modules/contracts/direct-exports.md) onde houver
exportação: filtros, columns ordenadas, formato xlsx/csv/pdf, download nativo, erros, estado
operacional e reautorização. Rotas de catálogo, download e operação e tela `/users/exportar`
implementadas nesta entrega. Os demais adaptadores permanecem planejados em suas specs. Gate de
Mensagens permanece quando aplicável.

Aceite deste incremento: perfil parcial com Associados+Colaboradores e geral exporta Colaboradores;
o adaptador de Associados continua futuro. Não descobre/exporta outras fontes; conversão preserva
herança expirada/revogada e override vazio; sem módulo não há elemento nas três superfícies; writer
respeita colunas, streaming sem teto funcional, CSRF, revogação e interrupção.

Administrador e Gestor têm exportação geral por seus cargos. Gestor também consulta todos os módulos
e possui acesso completo a Relatórios; pode conceder exportação a terceiros. Colaborador não
concede. A interseção com leitura da fonte/campo permanece para exportar. Consulta OAB continua sem
exportação.
