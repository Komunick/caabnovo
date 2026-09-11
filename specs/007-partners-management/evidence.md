# Evidências — Parceiros e benefícios

Validação em 11/09/2026, branch `feature/partners-management`, base `ab0ad89`.
Quatro páginas e cinco abas implementadas conforme spec/interface. Nesta retomada,
histórico ganhou recuperação de falha sem recarregar o formulário; ofertas mostram
vigência e prévia da publicação independentemente das alterações privadas do rascunho.

## Gates locais

| Verificação | Resultado |
| --- | --- |
| Formatação, lint, typecheck | Passaram |
| Unitários | 220 testes, 32 arquivos passaram |
| Contratos | 66 testes, 12 arquivos passaram |
| Integração de Parceiros e migrations | 10 testes, 2 arquivos passaram em PostgreSQL descartável |
| Build de produção web e worker | Passaram |
| Chromium — jornada e acesso negado | 2 testes passaram; 1 minuto |
| Axe WCAG 2.2 AA e overflow | Quatro rotas, claro/escuro, 1440 e 390 px passaram |
| Auditoria de dependências | Sem altas/críticas; 3 baixas e 5 moderadas reportadas |
| Padrões conhecidos de segredos no diff | Nenhuma ocorrência; análise completa Gitleaks permanece no CI |

A jornada verifica teclado, cadastro, unidade, envio real de PNG sintético e sua
liberação pelo worker/antivírus, registro/aprovação/download do contrato, publicação,
edição privada sem mudar conteúdo externo, prévia publicada, histórico, linha clicável
e retirada. Uma falha 503 controlada no histórico confirma nova tentativa e preservação
do campo de contato em edição. Conta sem acesso recebe 403 e não vê o menu.

A primeira execução da retomada identificou ambiguidade no seletor de alerta, por
incluir o anunciador de rotas do Next. O teste foi limitado ao conteúdo principal;
a repetição completa passou. Nenhum gate foi desativado.

Banco de teste: `caab_partners_check`, PostgreSQL local na porta 5447; servidor de
teste na porta 3108. O preview principal e seu banco não foram alterados, a pedido
do usuário. Sem consultas ou publicações externas com dados reais.

## Revisão visual

16 capturas da matriz foram geradas no relatório Playwright local. Inspeção visual
de oito capturas cobre as quatro páginas, ambos os temas e ambas as larguras:
sem sobreposição; campos e ações legíveis; tabelas usam rolagem interna em celular.
Quatro amostras versionadas para revisão:

- [Lista de parceiros, desktop claro](evidence/cadastros-light-1440.png)
- [Novo parceiro, celular claro](evidence/novo-light-390.png)
- [Detalhe, celular escuro](evidence/detalhe-dark-390.png)
- [Catálogo de benefícios, desktop escuro](evidence/beneficios-dark-1440.png)

## Revisão e limites

Revisão humana de permissões, arquivos e dados administrativos no PR; sem merge
automático. Migration 0016 é aditiva e não reescreve migrations anteriores. Rollback
da aplicação preserva tabelas, documentos e auditoria. Não houve alteração de dependências.

A revisão automática rejeitou o scanner local em imagem Docker por considerar a
imagem externa não confiável para receber o diff. A alternativa executada é uma
checagem local limitada de padrões de credenciais; o Gitleaks completo do workflow
continua obrigatório antes da integração.

## Pull Request

[PR #18 — gestão de parceiros, contratos e benefícios](https://github.com/Komunick/caabnovo/pull/18),
destino `dev`, sem merge. Resultados atuais de `quality`, `browser` e `security` estão
na [aba de verificações do PR](https://github.com/Komunick/caabnovo/pull/18/checks).
O job remoto de segurança passou para a implementação `8544e33`, incluindo Gitleaks.

CI completo da implementação `8544e33`: [execução 34625463387](https://github.com/Komunick/caabnovo/actions/runs/34625463387)
concluída com sucesso em `quality`, `browser` e `security`. Inclui a suíte completa
de integração, builds, E2E Chromium e acessibilidade do projeto. Commits posteriores
apenas registram links/resultados nesta documentação e a conclusão das tarefas.
As verificações automáticas desses registros documentais podem repetir no PR;
nenhuma proteção foi dispensada e nenhum merge foi realizado.
