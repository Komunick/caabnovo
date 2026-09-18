# Implementation Plan: Relatórios e Análises

**Branch**: `feature/reports-analytics-20260918` | **Date**: 2026-09-18
**Spec**: [spec.md](spec.md)

## Summary

Três abas com consultas autorizadas sobre os mesmos dados, consultas salvas pessoais,
exportação assíncrona e métricas próprias minimizadas. Sem conta externa obrigatória.

## Technical Context

TypeScript/React/Next/PostgreSQL/pg-boss/Zod existentes. XLSX com write-excel-file,
PDF com PDFKit no worker, CSV UTF-8 BOM protegido contra fórmulas. Intervalo máximo
366 dias, paginação 50; exportação completa até 50 mil linhas, com erro explícito
acima desse orçamento, nunca truncamento. Snapshot consistente na geração.

## Constitution Check

Monólito e fonte de verdade preservados; reports:read/export combinadas com
permissões dos domínios; reautorização na geração/download, propriedade de
consultas/arquivos; migração aditiva, jobs idempotentes e auditoria. UI padrão,
WCAG AA, dados sintéticos e CI, localhost desligado. Retenção institucional T089
continua pendente; sem política destrutiva inventada. Hooks ausentes. Gates de
desenho compatíveis; pesquisa independente revisou bibliotecas e bypass de arquivos.

## Project Structure

- packages/contracts/src/reports.ts: filtros, eventos e formatos.
- packages/db/migrations/0024_reports.sql: eventos, consultas e exportações.
- packages/db/src/repositories/reports*.ts: catálogo, métricas e persistência.
- apps/web/modules/reports/: HTTP, UI e coletor.
- apps/web/app/(admin)/reports/: três abas.
- apps/web/app/api/v1/reports/: endpoints versionados.
- apps/worker/src/jobs/report-export.ts: fila, geração e arquivos.

## Exportação em todos os módulos — decisão transversal

Todos os módulos existentes e futuros deverão oferecer ação visível de baixar/exportar
os dados consultados. Preservar filtros, período, ordenação e campos autorizados,
exportando além da página visual. Cada função definirá os formatos adequados.
Associados, Notícias, Parceiros/Benefícios, Colaboradores, Agendamentos, Mensagens,
Auditoria/Processamentos e futuros módulos entram na revisão de cobertura.
Não reativar módulos suspensos. Botões nos demais módulos permanecem no backlog
002; atualizar specs próprios ao implementar. Esta entrega implementa Relatórios.

## Validation

Contratos/unitários, autorização e banco descartável; E2E das três abas,
exportações reais, consultas e coleta SPA; screenshots mobile/desktop/temas e
acessibilidade. Formato/lint/tipos/build/segurança antes de PR para dev, sem merge.

## Ajustes da revisão do PR34 — 18/09/2026

Histórico projeta `retrying` quando job_execution registra falha e ainda possui
tentativas dentro do limite de cinco (execução inicial + quatro retries). A interface
continua polling nesse estado e reserva a ação de nova solicitação à falha definitiva.
Gerar incrementa a revisão da consulta mesmo com filtros iguais. Coleta de confirmação
usa o agendador `after` do Next na fronteira HTTP, injetado na rota para testes;
falhas de agendamento da coleta também não alteram a resposta de negócio.
Testes de componente com relógio controlado, transições reais no PostgreSQL e rota
com coleta pendente/rejeitada cobrem os três casos. CI push e PR devem concluir.
