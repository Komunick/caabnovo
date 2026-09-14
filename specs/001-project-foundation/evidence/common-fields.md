# Campos comuns — validação de 14/09/2026

Branch `fix/common-field-validation`, base `dev` 9b5bfd3. Máscaras de CPF/CNPJ,
telefone e CEP, validação de e-mail/site/UF e mensagens acessíveis extraídas para
componentes e contratos compartilhados. Aplicação em Associados, Colaboradores,
login, recuperação e Configurações; Parceiros consome os mesmos componentes no PR 18.

## Verificações

- Na branch própria: formatação, lint, typecheck e 279 testes unitários/contratos passaram.
- Na composição com Parceiros: build web/worker, typecheck, 308 unitários/contratos e
  135 integrações passaram. Integração usou Testcontainers com `--maxWorkers=1`, após
  timeouts de inicialização de bancos simultâneos na primeira rodada local.
- Duas regressões Chromium passaram para login/recuperação/Colaboradores/Configurações
  e CPF/telefone de Associados, com Axe. CEP, falhas e correções manuais foram exercitados
  em duas jornadas adicionais de Parceiros, também aprovadas.
- A primeira regressão de login excedeu 5 s sob carga; o trace confirmou resposta 200.
  A espera pela navegação agora usa os mesmos 30 s das jornadas existentes de Parceiros.
  A repetição dos dois testes passou, sem mudar comportamento da autenticação.
- Auditoria das dependências da composição: 3 baixas e 5 moderadas, nenhuma alta/crítica;
  nenhuma dependência alterada. Checagem local de padrões de segredos sem ocorrências;
  Gitleaks completo permanece no CI.

Ambiente E2E: localhost:3108, banco sintético caab_partners_check na porta 5447.
Nenhum seed ou E2E foi executado no preview 3107. Registros existentes não foram
reescritos; autorização, políticas de senha e auditoria permanecem nos respectivos serviços.
Sem migrations. Valores antigos fora do novo formato exigem correção ao editar.

## Escopo e entrega

CF01–CF03, CF-M, CF-A e CF-CI concluídas com validação local e CI aprovado no
PR #19, ainda aberto para revisão humana. A regressão Chromium completa passou na composição: 55 testes
em 6,4 minutos, incluindo recuperação, contas, Associados/fotos e Notícias.
A regra futura de número OAB e a revisão geral de motivos de cadastro/edição ficam
na lista local, fora deste PR. O PR de Parceiros depende desta extração; manter ambos
separados e nenhuma integração automática em dev/main.

## CI e registro oficial de storage

[PR #19](https://github.com/Komunick/caabnovo/pull/19) aberto para dev. Quality e security
passaram no commit b84dc86; browser parou no pull de minio/minio antes dos testes.
Correção: Compose usa quay.io/minio/minio e quay.io/minio/mc, com as mesmas tags.
Pull oficial e `docker compose config --quiet` passaram. Os IDs das imagens amd64
coincidem com as cópias Docker Hub existentes: MinIO
`sha256:14cea493d9a34af32f524e538b8346cf79f3321eff8e708c1e2960462bd8936e`
e mc `sha256:a7fe349ef4bd8521fb8497f55c6042871b2ae640607cf99d9bede5e9bdf11727`.
Não houve atualização de versão, recriação de serviço ou mudança de volume/bucket.
Quality, browser e security passaram para a implementação 94ec9b9 na
[execução 34843665347](https://github.com/Komunick/caabnovo/actions/runs/34843665347)
e na execução de push 34843661174. O job browser completou E2E e acessibilidade
usando as imagens oficiais de Quay. Este registro final altera somente documentação;
os checks automáticos podem repetir, sem dispensa de gates ou merge.

## Ampliação em validação — 14/09/2026

Inventário de controles revisado em todo o sistema:

| Área | Campos e comportamento |
| --- | --- |
| Login/recuperação | E-mail pelo contrato comum; senhas com limites próprios, exibição preservada e erro associado |
| Configurações | Nome, e-mail, senhas e confirmação; ações de conta mantêm contratos específicos |
| Colaboradores | Nome/e-mail/justificativa, funções, matriz de acessos e diálogos sensíveis |
| Associados | Identificação/contato/OAB, calendário, filtros, análise, vínculos, documentos, foto e situação administrativa |
| Notícias | Metadados, endereço legível, tags, capa/imagens, destaque, filtros e agendamento; rascunho incompleto continua permitido |
| Auditoria/operações | Filtros tipados, UUID do ator, datas, exportação e justificativa de reprocessamento |
| Parceiros (consumidor no PR #18) | Cadastro, unidades, contratos, benefícios, categorias, avaliações, configuração do app e filtros |

FormField centraliza aviso ao sair, na tentativa de envio e durante correção;
valores e descrições anteriores são preservados. Componentes de senha/calendário
encaminham atributos acessíveis ao input. Busca mista, seletores da barra de edição,
checkboxes, radios e uploads mantêm sua semântica própria; uploads/editor rico já
possuem validação específica e erros acessíveis, que permanecem ativos.

Contratos de OAB compartilhados; novas máscaras não reescrevem números legados ao
abrir o formulário. Endereço separado mantém legado como alternativa explícita;
partes são formatadas pelo servidor para a projeção pública compatível. Sem novas
dependências, migration SQL, backfill ou alteração de permissões.

Resultados parciais: PR #19 passou formatação/lint/typecheck e 283 testes unitários/
contratos. Composição com Parceiros passou 312 testes, lint e build web/worker.
Integração e E2E ampliados em execução; não representam entrega final ainda.
