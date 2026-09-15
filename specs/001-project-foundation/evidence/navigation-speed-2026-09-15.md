# Navegação e abertura progressiva — 15/09/2026

## Resultado

No código 45e22b3, o painel não tinha loading.tsx e a inicial só aparecia depois de
concluir todas as consultas de publicações, rascunhos e associados. Uma consulta
lenta segurava inclusive o cabeçalho e os atalhos.

A implementação final 7c07626 adiciona limites de carregamento por área e feedback
nativo useLinkStatus nos links do menu, abas e atalhos. Na inicial, três componentes
assíncronos independentes usam Suspense e preservam os tratamentos de erro/permissões.
O menu permanece interativo durante a espera e a navegação pode ser interrompida.
As seções de Configurações restauram a posição do hash quando o formulário é montado.

## Validação final

[CI 34990339186](https://github.com/Komunick/caabnovo/actions/runs/34990339186), código 7c07626:

- Formatação, lint, tipos e build aprovados.
- 276 testes unitários, 94 contratos e 152 integrações aprovados.
- 66 E2E Chromium e 6 testes de acessibilidade aprovados.
- Auditoria de dependências e detecção de segredos aprovadas.
- Capturas sintéticas baixadas e inspecionadas em desktop claro e celular escuro, 390 px.

Quatro E2E novos aprovados:

1. Leitura de member bloqueada com lock transacional: carregamento aparece e permite
   navegar para Colaboradores antes de liberar a consulta. Inclui a11y claro/escuro e mobile.
2. A inicial mostra cabeçalho, atalhos, publicações e rascunhos enquanto member permanece
   bloqueado. Após rollback, cadastros são exibidos. Comprova independência real dos blocos.
3. Resposta RSC retida: link acionado por teclado informa abertura e o estado recolhido
   do menu persiste após concluir, comprovando transição sem recarregar o shell.
4. Entrada direta nas âncoras de perfil, e-mail e senha: seção visível no celular após streaming.

Os testes existentes também confirmaram foco preso/restaurado no diálogo de exportação,
atalho de senha pela busca, sessão revogada e navegação por permissões. O seletor do
campo Início foi limitado ao diálogo, evitando ambiguidade com o link Início do menu.

## Evidências visuais

- [Carregamento em desktop](navigation-loading-desktop.png).
- [Carregamento em celular escuro](navigation-loading-mobile-dark.png).
- [Inicial utilizável durante consulta bloqueada](navigation-home-independent.png).

## Limites e ambiente local

Não há alegação de ganho percentual nem redução do tempo de uma consulta SQL. A mudança
antecipa conteúdo útil e permite navegar antes da consulta lenta terminar. Não altera
autenticação, sessões, permissões, schema ou contratos; não adiciona cache compartilhado
para conteúdo privado, dependências ou migrations.

Locks executam somente no CI com dados sintéticos, timeout e rollback em finally.
Nenhum seed ou lock foi aplicado ao banco do preview.

O preview anterior apresentou um timeout transitório de conexão na primeira abertura;
a repetição abriu normalmente. Esse episódio não foi usado como baseline. O usuário
pediu desligar o localhost e depois autorizou parar seu PostgreSQL exclusivo: ambos
permanecem desligados, com dados/volumes preservados. A revisão final foi realizada por
capturas remotas; o novo preview local não foi homologado e não deve ser reativado sem pedido.

Agendamentos permanece no brainstorming conduzido separadamente. Processamentos não
foi alterado neste incremento. Reverter componentes/limites restaura o comportamento
anterior sem modificação de dados.
