# Padrão de exportação do projeto

Decisão do usuário em 21/09/2026, durante o clarify transversal.

## Formatos obrigatórios

Todas as exportações de todos os módulos existentes e futuros devem oferecer os
três formatos: **Excel (.xlsx), CSV (.csv) e PDF (.pdf)**. Não escolher um subconjunto
por módulo ou aba. A regra vale também para Relatórios e Auditoria/Processamentos.
Módulos suspensos ou futuros só recebem implementação quando seu escopo for autorizado.

## Exceção: Consulta OAB

A Consulta OAB não oferece botão nem exportação própria de seu resultado, tanto na consulta avulsa quanto na consulta pelo cadastro. É uma exceção explícita ao padrão transversal, por decisão do usuário em 21/09/2026. Os dados cadastrais de Associados continuam no escopo de exportação autorizado.

## Jornada

1. Clicar em **Exportar [nome do módulo]**.
2. Abrir tela de filtros pertinentes: data/período, ordenação, ações, áreas, nomes
   e demais critérios do módulo, preservando o contexto da consulta. Nessa mesma tela,
   permitir selecionar e ordenar as colunas autorizadas, a partir de uma seleção
   inicial adequada ao módulo. A ordem das colunas é independente da ordenação dos registros.
3. Clicar em **Exportar em Excel**, **Exportar em CSV** ou **Exportar em PDF**.
4. Iniciar o download diretamente, sem etapa obrigatória de fila ou histórico para
   buscar o arquivo depois e sem prazo de disponibilidade para baixá-lo.

O arquivo deve conter todos os resultados autorizados dos filtros, além da página
visível, sem teto funcional de registros ou duração do período. Preservar filtros,
ordenação dos registros e seleção/ordem das colunas autorizadas em todos os três
formatos; campos desmarcados não aparecem no arquivo. Nunca truncar silenciosamente. Informar andamento
e falhas, mantendo a configuração para repetir a operação.

## Acesso

Exigir a permissão geral de exportação e o acesso ao módulo e aos dados. Quem já
possui alguma permissão antiga de exportação receberá automaticamente a geral na
adequação, preservando as permissões de acesso aos módulos. A permissão geral
sozinha não torna outros módulos visíveis nem acessíveis. O seletor só oferece
campos autorizados; o servidor também verifica a seleção, sem aceitar campos
restritos por requisição direta.

## Estado e validação

Este documento define o padrão alvo. A aplicação integrada ainda precisa de
adequação; não representa implementação ou homologação concluída. Validar os três
formatos, arquivos completos, filtros, seleção/ordem das colunas, autorização, grandes volumes e erros em cada
função. Coordenação em [002 EXP06/EXP07](../specs/002-integrated-modules/tasks.md).
Preservar registros e arquivos legados; esta decisão não autoriza apagá-los nem
altera por extensão o download de anexos/documentos já existentes.

## Validação inicial — decisão C1 de21/09/2026

Testar com100 registros sintéticos, conforme [perfil](../specs/002-integrated-modules/export-validation-100.md). Esse tamanho é da massa de teste, não limite de exportação. Grande volume/estresse não serão testados nesta rodada. Arquivos antigos de Relatórios seguem a [autorização atual U1](../specs/010-reports-analytics/contracts/legacy-downloads.md), sem depender somente de permissões registradas no passado.
