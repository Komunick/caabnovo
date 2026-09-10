# Validação

## Preview da retomada — 10/09/2026

Abrir `http://localhost:3106/members`. O código está em `.cache/pr-members`, branch
`feature/members-management`, com `origin/dev` be46efa integrado (Configurações e PR #14).
O login é o mesmo do painel local, sem autenticador. O administrador existente recebe acesso;
outros perfis precisam de concessão explícita. A pedido do usuário, os previews das portas 3105
e 3107 foram encerrados; manter somente 3106. Associados ainda não foi enviado para DEV nem
está liberado para PR.

Não executar seed/reset no banco compartilhado do preview: preservar contas e testes do usuário.
Para testes automatizados locais, usar somente fixtures sintéticas existentes; integração usa
bancos descartáveis. A caixa de e-mail local de Configurações continua exclusiva para localhost,
e precisa ser substituída pelo SMTP e URL pública configurados ao sair do local, conforme spec 006.

## Roteiro

Usar banco descartável próprio, dependências do lockfile, migrations, web/storage/antivírus existentes.

1. Criar duas pessoas sintéticas em /members, pesquisar por nome/CPF/OAB, filtrar por seccional,
   combinar com análise/arquivamento, paginar, vincular e encerrar dependência.
2. CPF duplicado/ciclo/versão obsoleta são recusados sem efeito parcial.
3. Enviar arquivo, aguardar liberação, pedir correção e substituir preservando evidência anterior.
4. Aprovar cadastro e registrar OAB manual; finanças/elegibilidade permanecem desconhecidas.
5. Avaliar credencial/elegibilidade com fonte/validade; alterar identificação sinaliza revisão.
6. Arquivar/restaurar, consultar histórico, testar sessão revogada e arquivo alheio.
7. Testar teclado/390px/axe, contratos, autorização, integração, lint, typecheck e build.

Este roteiro não declara gates aprovados. Evidências serão preenchidas após execução real.
