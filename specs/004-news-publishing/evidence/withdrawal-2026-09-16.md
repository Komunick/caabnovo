# Retirar publicação e salvar rascunho — 16/09/2026

Em notícia publicada, o editor mostra **Retirar publicação e salvar rascunho**. A ação
alternativa de salvar/prévia também explicita a retirada. Notícias sem publicação mantêm
**Salvar rascunho**. O aviso informa retirada de todos os destinos e cancelamento das agendas.

A operação compara a revisão editorial e a vigente sob lock, valida mídia, cancela ações
pendentes, grava os dados como rascunho e audita retirada/edição na mesma transação.
Publicadas usa o documento vigente para título, conteúdo, capa, filtros e ordenação. Ao retirar,
a notícia fica em Rascunhos e no atalho administrativo Para continuar; sai dos cards publicados
da inicial e das APIs de app/site. Arquivadas conservam sua localização no filtro Exibir.

## Validação

[CI35096870019](https://github.com/Komunick/caabnovo/actions/runs/35096870019), código03fc20f:
quality, security e browser aprovados;302unitários,105contratos,182integrações,69E2E,6a11y,
total664. Build remoto aprovado. Contrato OpenAPI atualizado também validado localmente.

Integração cobre revisão pública/editorial obsoleta, retirada dos dois canais, falha de
inserção de auditoria com rollback de dados/agendas, worker cancelado sem efeito, histórico,
classificação e ausência de título privado nos filtros Publicadas. Browser cobre rótulos,
falha500 preservando texto e publicação, tentativa bem-sucedida, lista de rascunhos,
inicial, republicação, agenda/cancelamento, retirada parcial e viewport390px sem overflow.
A preparação interna ao publicar/agendar conserva a revisão pública até a ação explícita.

[Editor publicado no desktop](withdrawal-2026-09-16/desktop.png), dados sintéticos do artefato
news-withdrawal-synthetic-screenshots desse CI. Capturas desktop/mobile também são preservadas
nos CIs do PR; captura desativa animações para não registrar a transição da barra lateral
quando o teste muda de desktop para celular. Revisão visual concluiu rótulos e hierarquia.

Sem migration, integração ou permissão nova. A transação de publicação revalida sessão e
concessões existentes. Preview e banco locais permaneceram parados, sem seeds ou build local.
Reverter código não desfaz retiradas nem reagenda ações: texto e histórico continuam disponíveis,
e uma nova publicação precisa ser explícita.
