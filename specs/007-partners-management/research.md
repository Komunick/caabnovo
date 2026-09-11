# Pesquisa — Parceiros (11/09/2026)

## CNPJ atual

Fonte: [Receita Federal: primeiro CNPJ alfanumérico, 31/07/2026](https://www.gov.br/receitafederal/pt-br/assuntos/noticias/2026/julho/receita-federal-gera-o-primeiro-cnpj-em-formato-alfanumerico) e [documento técnico oficial](https://www.gov.br/receitafederal/pt-br/centrais-de-conteudo/publicacoes/perguntas-e-respostas/cnpj/cnpj-alfanumerico.pdf).
Decisão: aceitar 12 posições alfanuméricas e dois dígitos verificadores; preservar zeros,
normalizar maiúsculas e pontuação. DV usa ASCII menos 48 e módulo 11. Vetor oficial
12.ABC.345/01DE-35. Formato antigo continua aceito. Não usar apenas dígitos/type=number;
validação sintática não é consulta cadastral oficial. Alternativa apenas numérica descartada.

## Fronteiras e vigência

[Termos públicos do CAApp](https://caab.org.br/termos-de-uso-caapp/) descrevem rede credenciada
com descontos, sem fornecer condições particulares de cada contrato. Decisão: condições,
público, prazo e aprovação são registros explícitos, sem percentual ou renovação padrão.
Estado editorial separado de vigência; oferta vencida/contrato encerrado não aparece em
consulta externa. Datas civis inclusivas em America/Bahia são escolha operacional desta spec,
não uma regra institucional atribuída à fonte. [MDN input date](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/input/date)
confirma transporte normalizado yyyy-mm-dd. Sem converter data civil em meia-noite UTC.

## Documentos

[OWASP File Upload](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html)
recomenda autorização, allowlist, conteúdo real, limites, armazenamento isolado e antivírus.
Reutilizar stored_file/S3/ClamAV e limite existente 25 MB (escolha do projeto). Contratos
permanecem privados; arquivo alheio/em quarentena não vincula nem é baixado. Não criar outro
storage nem publicar documentos administrativos junto da oferta.

## Interface

[WAI labels](https://www.w3.org/WAI/tutorials/forms/labels/), [notificações](https://www.w3.org/WAI/tutorials/forms/notifications/)
e [validação](https://www.w3.org/WAI/tutorials/forms/validation/): rótulos visíveis, associação
de erros, mensagens claras e validação também no servidor. Usar componentes reais de
Associados e Notícias; navegação por links quando mudar a rota e botões com estado pressionado
para seções no padrão existente. Verificação de teclado, dois temas e 390 px; não introduzir
outra paleta, biblioteca de ícones ou estilo de filtros.

## Limites institucionais

Reconsulta em 11/09/2026: [WAI, notificações](https://www.w3.org/WAI/tutorials/forms/notifications/)
orienta mensagens claras e instruções para resolver erros. Aplicação nesta retomada:
falhas do histórico ficam na própria seção, com nova tentativa e fim do carregamento;
nenhuma recarga do formulário é necessária. A distinção entre versão publicada e
rascunho segue o contrato editorial já definido nesta spec, sem nova regra institucional.

B01: aprovação explícita por contrato e publicação por operador autorizado; não existe
habilitação automática ou garantia de direito ao benefício. B02: coleta/moderação de
avaliações e política de autoria/escala pertencem à integração futura do app. Portal,
resgates, QR e efeitos em Caassh não pertencem a esta entrega. Nenhuma consulta ao legado
ou transmissão de dados reais foi realizada nesta pesquisa.
