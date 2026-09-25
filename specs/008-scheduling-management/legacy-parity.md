# Equivalência e transição do legado — Agendamentos 2C

## Inspeção do legado-CODEX-mafaltti

Data: 25/09/2026. Solicitante: mafaltti, login Danilo-Komunick, fonte perfil autenticado GitHub
consultado nesta sessão em 25/09/2026. Continuação autorizada da pesquisa/spec/plan.
Branch documental: `codex/scheduling-market-research-20260923`.

**Estado:** inventário de código e diferenças; inventário de registros reais ainda pendente.
Fonte: repositório `Komunick/caab-caapp`, ref `main`, blobs abaixo. A documentação identifica
o monorepo como aplicação atual, mas nenhuma revisão publicada, banco ou conta real foi validada.
Não houve execução do legado, chamada a API hospedada, leitura de credenciais ou migração.
A [inspeção de horários de 15/09](../002-integrated-modules/horarios-legado-2026-09-15.md)
continua como referência; esta leitura acrescenta identidade, estados e autoria.

## 1. Identidade e acesso: evidência disponível

- `User` possui ID individual e `userType`: TITULAR, FILHO, ENTEADO, CONJUGE, COMPANHEIRO.
  Isso dá suporte estrutural à informação do usuário de que dependentes têm acesso próprio.
- `findByOab` procura titular; `findByCpf` procura não titular. Os fluxos geram código
  de verificação e token intermediário. `verifyCode` troca código válido por token de sessão.
  O envio de código possui caminhos SMS; isso descreve login legado e não adiciona SMS aos
  canais de avisos de Agendamentos.
- `authLogin` verifica o token intermediário com configuração distinta de `auth`, que
  verifica o Bearer de sessão e define `req.userId` pelo ID do token. Não ler/copiar chaves.
  A nova fronteira deve distinguir inequivocamente os dois contextos.
- `validateSession`, no trecho inspecionado, devolve `req.userId`; não comprova reconsulta
  de pessoa/vínculo, revogação ou elegibilidade. A existência dessa rota não fecha T041.
- Há dois critérios familiares no controlador: `getUsersDependents` consulta
  `responsavel = req.userId`; `getUserAndDependents` procura não titulares pela mesma OAB.
  Não foi comprovada equivalência entre esses caminhos nem a vigência do vínculo no banco.
  Mesma OAB é indício legado, não autorização familiar suficiente no sistema novo.
- O arquivo de rotas de agenda aplica `auth` explicitamente ao cancelamento, mas não
  uniformemente às demais rotas inspecionadas. Middleware global/deployment não foi auditado;
  não afirmar exposição real nem transportar essa distribuição de guardas para o contrato novo.
- Em criação/cancelamento e decisões, o controlador usa campos de ator, beneficiário ou
  plataforma recebidos no corpo/header. A fronteira nova deve resolver o ator confiável no
  servidor e autorizar cada beneficiário, como já determina 2C-FR-02.

**Implicação de arquitetura:** preservar a identidade individual, com correspondência explícita
`sistema de origem + User.id → member.id`, sujeita a reconciliação. Não ligar por nome/OAB,
não importar todo payload do token para a agenda e não usar credenciais administrativas.
Verificação de sessão real e revogação precisam de contrato; decodificar JWT sem validar não
autentica. O mecanismo concreto (adaptação/federação/transição de sessão) permanece dependente
da versão em uso e da fronteira de acesso de 005/UI01, sem escolher fornecedor ou login paralelo.

## 2. Matriz de diferenças e tratamento planejado

| Assunto | Evidência no código legado | Regra/destino em 2C | Tratamento necessário |
| --- | --- | --- | --- |
| Pessoa e autoria | Schedule.idUser; logs separam atendido, autor associado e autor administrativo. | Beneficiário individual e ator/origem separados. | Preservar IDs de origem, autoria conhecida e lacunas; não atribuir autor pela conta conectada hoje. |
| Confirmação | Create usa automaticConfirmation/autoConfirmation da entrada para await/confirmed. | Política publicada por serviço, servidor decide; padrão imediato. | Revalidar política no domínio novo; clientes não impõem aprovação. |
| Espera | await ocupa consultas de vagas junto de confirmed. | pending_approval ocupa até decisão/cancelamento explícito. | Candidato de equivalência, sujeito à inspeção dos registros e referência de horário. |
| Confirmada | confirmed e profissional/intervalo referenciados. | scheduled com ocupação e conflitos globais. | Validar vínculos, fuso e conflitos antes de importar; não corrigir sobreposição automaticamente. |
| Recusa/cancelamento | Ambos gravam reject; rejectSchedule e cancelSchedule registram CANCELED. | rejected e cancelled distinguem ações e efeitos. | Não converter reject só pelo status. Examinar autor/origem/eventos; se inconclusivo, preservar valor original e marcar correspondência pendente. |
| Atendimento concluído/falta | finished e not_appear existem no enum. | Novos estados operacionais desse tipo estão fora de 2C; relógio não os gera. | Preservar informação histórica de origem; não transformar em reserva confirmada/cancelada para caber no enum novo. Fechar representação histórica antes de migration. |
| Cancelamento e penalidade | cancelSchedule pode aplicar bloqueio quando recebe punish. | Cancelamento externo antes do início sem antecedência mínima; nenhuma penalidade criada por inferência. | Não transportar flag/punição automática; tratar bloqueios preexistentes como dados a reconciliar com Associados, sem apagá-los. |
| Exceções de conflito | exception/uniqueControl alteram validações; cálculo de vagas filtra exception=false. | Ocupação protegida por transação/constraints, ambos os modos e beneficiário global. | Inventariar exceções e colisões; não habilitar bypass no novo domínio. |
| Trocas e contagem | Logs têm EDITED; não foi identificado ciclo voluntário/contador no modelo Schedule inspecionado. | Processo/proposta e duas utilizações voluntárias, recuperação isenta. | EDITED não prova troca confirmada; não calcular por número de logs nem inicializar desconhecido como zero sem decisão de transição. |
| Data/hora | data DATEONLY; horaInicio/horaFim strings; availableHour usa America/Sao_Paulo. | UTC persistido, apresentação America/Bahia, intervalos [início,fim). | Confirmar semântica e fuso reais; validar datas históricas/offset antes de converter, sem deslocar horário silenciosamente. |
| Profissional/capacidade | Modelo de reserva referencia profissional/procedimento; disponibilidade parte do profissional. | Modo profissional ou capacidade do serviço sem profissional fictício. | Preservar modo antigo; não converter reservas existentes ao cadastrar/remover profissionais. |
| Avisos | Confirmação/recusa usam Mensagem e chamada de push Firebase no controlador. | Aviso interno app/site, e-mail e WhatsApp; intenção durável e preferências por pessoa. | Aviso interno não é push; não reutilizar token de push como preferência ou contato dos outros canais. |
| Limites de procedimento | Código consulta regras de quantidade/intervalos por procedimento. | Prazos/horizonte definidos em 2C; outras políticas não foram ativadas por esta pesquisa. | Registrar diferenças sem importar limites, avaliações ou novas penalidades por equivalência aparente. |
| Exclusão | Controller chama destroy; configuração efetiva não foi verificada. | Preservar histórico, autoria e exclusão lógica. | Inventariar tombstones/ausências; não concluir que todos os excluídos sejam recuperáveis. |

Esta matriz não afirma que cada comportamento está publicado ou foi exercido por usuários.
As decisões aprovadas da spec têm precedência sobre comportamento antigo.

## 3. Inventário de dados necessário — ainda não executado

Obter uma evidência autorizada e preferencialmente agregada/anonimizada, com:

1. Ambiente, revisão publicada, data/hora da extração, fuso, responsável e origem.
2. Contagens por status, futuras/passadas e excluídas; critério de futuro baseado na data/hora
   combinadas e instante de referência registrado. Não tratar ausência de resultado como zero.
3. Mapeamento de IDs de pessoas, titulares/dependentes, profissionais, procedimentos, serviços
   e unidades; duplicatas, registros órfãos e divergências entre OAB/responsavel identificados.
4. Casos reject ambíguos, exception, conflitos por profissional/beneficiário e horários inválidos.
5. Disponibilidade de logs/autoria e evidência de remarcações confirmadas; contagens desconhecidas
   sinalizadas separadamente de zero. Preservar fonte original e não fabricar eventos.
6. Canais realmente configurados, preferências/supressões e validade dos contatos, sem incluir
   números, códigos, tokens, documentos ou credenciais em relatórios versionados.
7. Reconciliação de totais e correspondências antes/depois de ensaio sintético; diferenças têm
   tratamento explícito e rastreável. Plano de escritor único/corte/retorno depende desse resultado.

Não exportar dados pessoais para este repositório. Esta lista prepara T042; não autoriza acesso
ao banco real, importação ou corte. Existência de reservas futuras permanece **desconhecida**.

## 4. Provas de integração a acrescentar aos testes planejados

- Token intermediário recusado como sessão de agenda; token adulterado/expirado e sessão revogada.
- Identidade autenticada difere de ID do corpo: negar atuação fora de representação vigente.
- Vínculo atualizado durante lock/replay: revalidar antes da resposta e da mutação.
- Mesma OAB sem vínculo reconciliado não concede representação; ID sem correspondência não cria conta.
- Legado reject com origem inconclusiva não recebe causa inventada; finished/not_appear preservados.
- EDITED sem prova de troca não aumenta nem zera contador por inferência.
- Horários de origem são convertidos por semântica verificada, com casos históricos de fuso.
- Exceções/conflitos legados produzem relatório e bloqueiam conversão afetada sem apagar reservas.

São critérios para T041/T042/T046/T049/T074/T077 e testes futuros, não testes executados.

## 5. Fontes e limites de verificação

Blobs consultados em 25/09/2026; os links apontam para main e podem avançar, por isso guardar SHA:

| Arquivo em Komunick/caab-caapp | Blob SHA |
| --- | --- |
| [README.md](https://github.com/Komunick/caab-caapp/blob/main/README.md) | `bfaacf99fd079b4966cb1bb2e52b74eb4f464819` |
| [mono-caapp-main/packages/api/src/routes/user.js](https://github.com/Komunick/caab-caapp/blob/main/mono-caapp-main/packages/api/src/routes/user.js) | `1a959c028e804498ab1550c9d80e168331b77bab` |
| [mono-caapp-main/packages/api/src/middlewares/auth.js](https://github.com/Komunick/caab-caapp/blob/main/mono-caapp-main/packages/api/src/middlewares/auth.js) | `c0f452ac06ad7ec8302c4924b9d42349822f5aef` |
| [mono-caapp-main/packages/api/src/middlewares/authLogin.js](https://github.com/Komunick/caab-caapp/blob/main/mono-caapp-main/packages/api/src/middlewares/authLogin.js) | `4543f56a390b077bb30ff4b7b0cfb34b02644761` |
| [mono-caapp-main/packages/api/src/controllers/UserController.js](https://github.com/Komunick/caab-caapp/blob/main/mono-caapp-main/packages/api/src/controllers/UserController.js) | `e0bcb264de80dcfeaf225849b06dc304f5bb28ef` |
| [mono-caapp-main/packages/api/src/models/User.js](https://github.com/Komunick/caab-caapp/blob/main/mono-caapp-main/packages/api/src/models/User.js) | `90e38b5148da4d9fadf87cd4a258994fdce9c090` |
| [mono-caapp-main/packages/api/src/routes/schedule.js](https://github.com/Komunick/caab-caapp/blob/main/mono-caapp-main/packages/api/src/routes/schedule.js) | `0b0a5b0aa0b053b7b7494cd5de9c69cad5dcd77e` |
| [mono-caapp-main/packages/api/src/controllers/ScheduleController.js](https://github.com/Komunick/caab-caapp/blob/main/mono-caapp-main/packages/api/src/controllers/ScheduleController.js) | `497e940d0a5c90a06b7022bffe9e6642035ad280` |
| [mono-caapp-main/packages/api/src/models/Schedule.js](https://github.com/Komunick/caab-caapp/blob/main/mono-caapp-main/packages/api/src/models/Schedule.js) | `421de71e9a0d07b262c3c0c3c28e50c183aa594a` |
| [mono-caapp-main/packages/api/src/models/ScheduleLog.js](https://github.com/Komunick/caab-caapp/blob/main/mono-caapp-main/packages/api/src/models/ScheduleLog.js) | `c33a7b2c983f703dafa8364ce15743b1c4ef1aac` |
| [mono-caapp-main/packages/app/package.json](https://github.com/Komunick/caab-caapp/blob/main/mono-caapp-main/packages/app/package.json) | `ed46e84bc36844e0305c2b09bd661daa4c06c1b8` |

T041/T042/T024 permanecem abertos: código localizado não prova contas mapeadas, revogação,
versão publicada ou inventário. Pesquisa de código local anterior e inspeção remota atual são
evidências distintas. Não houve implantação, envio, migração ou teste de aplicação.

O executor local falhou antes de ler AGENTS/agentcache/Git; a consulta remota de agentcache e guia
visual retornou 404. A autoria foi verificada pelo conector GitHub. Agentcache local/sincronização
não puderam ser atualizados; este arquivo é evidência permanente da função, não um caderno paralelo.
Formatação local e automação do Spec Kit não foram executadas. Nenhum hook remoto foi localizado
em .specify/extensions.yml (404).
