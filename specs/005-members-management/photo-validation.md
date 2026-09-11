# Validação — foto de perfil (11/09/2026)

Branch: `feature/member-profile-photo`, baseada em `dev` (`ab0ad89`).

Entrega: [PR #17](https://github.com/Komunick/caabnovo/pull/17), sem merge automático.

## Gates

[CI aprovado em a344eb2](https://github.com/Komunick/caabnovo/actions/runs/34613216815):

- 213 testes unitários e 62 de contrato.
- 120 testes de integração em bancos descartáveis, incluindo migrations, isolamento de
  arquivos, permissões atuais, idempotência, concorrência e rollback da auditoria.
- Build de produção, typecheck, lint, formatação, dependências e segredos aprovados.
- 47 testes E2E e 6 de acessibilidade aprovados: envio privado, substituição, remoção,
  persistência, claro/escuro a 390 px e criação com foto/retomada sem duplicar cadastro.
- A falha inicial do teste de criação era um seletor ambíguo entre o alerta do formulário e
  o anúncio de rota do Next. O seletor foi limitado ao conteúdo principal e o gate passou.

## Verificação local autenticada

- Migration 0015 aplicada sem reset ou backfill. Nenhum dado existente foi apagado.
- Criado cadastro fictício **Teste Foto Perfil — Cadastro Inicial** com PNG selecionado
  antes de salvar; foto confirmada no cabeçalho após recarregar a página.
- Adicionado PNG ao cadastro fictício existente **Ana Martins Lima**.
- Adicionado JPEG ao cadastro fictício existente **Bruno Carvalho Ribeiro**.
- Conferidos layout, alinhamento, prévia, avatar circular e textos nos temas claro/escuro;
  perfil e novo cadastro sem rolagem horizontal em 390 px.
- Imagens são somente demonstração: PNG de avatar e
  [retrato de teste do Random User](https://randomuser.me/). Não representam a identidade
  das pessoas fictícias cadastradas. Arquivos de teste não integram o repositório.

Os testes na sessão do usuário foram feitos após ele habilitar o acesso da extensão a
arquivos locais. A tentativa anterior de E2E local sem seed parou no login sintético e não
alterou cadastros; a execução completa passou no ambiente isolado do CI.
