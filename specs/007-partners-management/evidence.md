# Evidências — Parceiros e benefícios

## Retomada de 14/09/2026

Sete páginas e seis seções de detalhe implementadas. Diretório de unidades/categorias,
configuração do catálogo do app e moderação preservando a avaliação original.
Campos de parceiro/unidade usam CEP direto no ViaCEP, UF, máscaras e validações
compartilhadas com o [PR #19](https://github.com/Komunick/caabnovo/pull/19), do qual esta
branch depende. Navegação interna “Dados do parceiro” usa texto e linha ativa,
distinta das áreas gerais. Novos parceiros, unidades, categorias, contratos e benefícios
dispensam motivo; edições, publicação, decisões e moderação exigem justificativa no servidor.

| Verificação local | Resultado em 14/09 |
| --- | --- |
| Formatação, lint, typecheck | Passaram |
| Unitários/contratos | 308 testes, 48 arquivos passaram |
| Integração completa e migrations | 135 testes, 16 arquivos passaram em bancos descartáveis |
| Build web e worker | Passaram |
| Chromium completo | 55 testes passaram em 6,4 minutos |
| Acessibilidade | Axe WCAG 2.2 AA, teclado e ausência de overflow nas matrizes das sete páginas e avaliações |
| Dependências | 3 baixas e 5 moderadas; nenhuma alta/crítica, sem atualização de dependências |
| Segredos | Nenhum padrão conhecido no diff local; Gitleaks completo no CI |

A integração completa foi repetida com `--maxWorkers=1` após a inicialização simultânea
de vários bancos exceder o timeout local. A primeira rodada direcionada de navegador
teve sete aprovados e um timeout de login a 5 s; trace confirmou resposta 200. A espera
foi alinhada aos 30 s das demais jornadas, duas regressões passaram e a suíte completa
de 55 testes passou em seguida. Nenhum teste ou gate foi removido.

Os testes verificam criação sem motivo, recusa de edição/decisão sem motivo, auditoria
automática, persistência, revisão de telefone, falhas de CEP e preservação de correção
manual, vínculos de categoria, seleção vazia e canais independentes, conflitos,
moderação imutável, permissões, documentos privados e publicação. A regressão inclui
Associados/fotos, recuperação, configurações, contas, Notícias e Auditoria.

### Capturas atuais

- [Cadastro e abas internas, desktop claro](evidence/detalhe-light-1440.png)
- [Cadastro e abas internas, celular escuro](evidence/detalhe-dark-390.png)
- [Novo parceiro sem motivo, celular](evidence/novo-light-390.png)
- [Categorias, desktop](evidence/categorias-light-1440.png)
- [Unidades, celular](evidence/unidades-light-390.png)
- [Configuração do app, celular escuro](evidence/configuracoes-dark-390.png)
- [Avaliações, desktop escuro](evidence/avaliacoes-dark-1440.png)

Inspeção visual confirma rótulos, campos, foco e controles legíveis, abas internas
distintas e quebra de linha em 390 px. Tabelas preservam rolagem interna no celular.
Capturas e traces completos preservados no arquivo local da primeira rodada e no
relatório Playwright da rodada completa; somente dados sintéticos.

### Entrega e preservação

E2E exclusivamente em localhost:3108, banco caab_partners_check/5447; integrações
usam Testcontainers. Preview principal 3107 restaurado na composição anterior durante
a validação. Composição atualizada `d891f98`, build web/worker concluído. Contagens
antes/depois idênticas: 25 contas, 82 associados, 1 parceiro, 64 arquivos e 4 vínculos
de foto. `/readyz` confirmou banco pronto e worker ativo; login, liveness e APIs
públicas responderam 200; rotas administrativas redirecionaram anônimos para login.
Nenhum seed no preview nem merge de PR. Servidor/worker de testes 3108 encerrados
após a validação; banco descartável e evidências preservados.

CI da implementação 775e761 aprovado em quality, browser e security na
[execução do PR 34843802654](https://github.com/Komunick/caabnovo/actions/runs/34843802654)
e na execução de push 34843796618. A dependência do PR #19 também passou na
[execução 34843665347](https://github.com/Komunick/caabnovo/actions/runs/34843665347).
T001–T036 concluídas; os PRs permanecem abertos para revisão humana. Este fechamento
altera somente registros documentais; checks automáticos podem repetir sem dispensa.

Apenas as migrations aditivas 0016/0017 já previstas; CEP/endereço/motivo não exigem
migration. Coleta externa das avaliações ainda depende do app; não há ingestão pública.
O PR #19 também corrige o pull de storage do CI para o registro oficial Quay,
com as mesmas versões/IDs de imagens. Não altera os volumes locais.

## Histórico — entrega inicial de 11/09/2026

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
