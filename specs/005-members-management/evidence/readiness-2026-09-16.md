# Homologação e prontidão — 16/09/2026

## Escopo e resultados

| Item | Resultado verificável | Limites |
| --- | --- | --- |
| DEV: rascunho e imagem | Criação, edição, recarga e imagem disponível confirmadas na interface publicada. | Registro sintético privado; sem publicação. Status HTTP específicos não capturados pela ferramenta de UI. |
| Serviços VM/MinIO | Conferência retirada do escopo pelo usuário. | Não se afirma o estado dos contêineres remotos. |
| OAB publicada | Uma consulta autorizada retornou OAB_NOT_CONFIGURED. | Sem retorno pessoal; T028 não homologada. Precisa das duas credenciais no ambiente web. |
| Retenção do legado | Exclusão lógica e expiração de token, sem política completa encontrada. | Não equivale a aprovação institucional. T089 aberta. |
| Main | Ruleset 23551500 aplicado e relido, sem bypass e com quatro checks. | T095 parcial: sem tentativa de push direto ou promoção inválida remota. |
| Promoção | Origem do próprio repo/dev, aprovação estruturada e bloqueio de implementação compartilhado com worker. | Produção permanece bloqueada; não houve merge/aprovação. |
| Programa integrado | Módulos atuais reconciliados nos specs; CI do PR #30 integralmente aprovado. | Módulos futuros e T055–T057 não são declarados concluídos. |

## Evidências e validação

[CI integrado do PR #30](https://github.com/Komunick/caabnovo/actions/runs/35108754282):
314 unitários, 105 contratos, 182 integrações, 73 E2E e 6 verificações de acessibilidade,
além de qualidade/build/segurança. Essa é evidência do código integrado anterior à presente correção.
O PR desta entrega registra o CI do commit final, incluindo 13 testes novos de promoção e
os 12 grupos do tooling de rulesets. Nenhum build ou E2E foi executado no computador.

A conciliação do PR #16 usa o merge confirmado em 11/09 e as verificações posteriores do
painel. Não afirma reexecução dos checks antigos e não restaura trabalho da branch histórica.

## Registro sintético no DEV

Notícia privada `1b981790-f954-4621-9360-6926b7d04d86`, título
“Homologação DEV 2026-09-16 — teste sintético”, revisão 2. Imagem fixture `synthetic.jpg`,
sem dados pessoais, disponível após processamento e carregada novamente após recarga;
rota de imagem no próprio domínio `/api/v1/news/.../media/...`. Tokens não registrados.
Foi deixada privada para conferência; nenhum conteúdo existente foi alterado.

Não foram conservados número OAB, nome, documento ou resultado pessoal nas evidências.
A inscrição foi informada pelo usuário somente para a consulta individual desta sessão.
