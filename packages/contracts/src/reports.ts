import { z } from "zod";

export const reportCatalog = {
  members: {
    label: "Associados",
    permission: "members:read",
    dateLabel: "Data do cadastro",
    columns: {
      name: "Nome",
      city: "Cidade",
      state: "UF",
      category: "Categoria",
      status: "Situação atual",
      gender: "Gênero",
      age: "Idade atual",
      date: "Cadastro",
    },
  },
  dependents: {
    label: "Dependentes",
    permission: "members:read",
    dateLabel: "Data do vínculo",
    columns: {
      name: "Dependente",
      holder: "Titular",
      category: "Vínculo",
      status: "Situação atual",
      date: "Cadastro do vínculo",
    },
  },
  bookings: {
    label: "Agendamentos",
    permission: "scheduling:read",
    dateLabel: "Data da reserva",
    columns: {
      name: "Procedimento",
      category: "Serviço",
      unit: "Unidade",
      professional: "Profissional",
      status: "Situação atual",
      date: "Data da reserva",
    },
  },
  partners: {
    label: "Parceiros",
    permission: "partners:read",
    dateLabel: "Data do cadastro",
    columns: {
      name: "Parceiro",
      category: "Categoria",
      status: "Situação atual",
      date: "Cadastro",
    },
  },
  benefits: {
    label: "Benefícios",
    permission: "partners:read",
    dateLabel: "Data do cadastro",
    columns: {
      name: "Benefício",
      partner: "Parceiro",
      status: "Publicação atual",
      date: "Cadastro",
    },
  },
  contracts: {
    label: "Contratos",
    permission: "partners:read",
    dateLabel: "Data do vencimento",
    columns: {
      name: "Referência",
      partner: "Parceiro",
      status: "Situação atual",
      date: "Vencimento",
    },
  },
  news: {
    label: "Notícias",
    permission: "news:read",
    dateLabel: "Data do cadastro",
    columns: { name: "Título", category: "Categoria", status: "Situação atual", date: "Cadastro" },
  },
  users: {
    label: "Colaboradores",
    permission: "users:read",
    dateLabel: "Data do cadastro",
    columns: { name: "Nome", status: "Situação atual", date: "Cadastro" },
  },
  access: {
    label: "Acessos e uso",
    permission: "reports:read",
    dateLabel: "Data do acesso",
    columns: {
      date: "Dia",
      name: "Tela",
      channel: "Canal",
      source: "Fonte",
      device: "Dispositivo",
      origin: "Origem",
      version: "Versão",
      views: "Visualizações",
      sessions: "Sessões",
      visitors: "Visitantes reconhecidos",
    },
  },
} as const;
export const reportDatasetSchema = z.enum([
  "members",
  "dependents",
  "bookings",
  "partners",
  "benefits",
  "contracts",
  "news",
  "users",
  "access",
]);
export type ReportDataset = z.infer<typeof reportDatasetSchema>;
export const reportDaySchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((day) => {
    const value = new Date(`${day}T12:00:00Z`);
    return Number.isFinite(value.valueOf()) && value.toISOString().slice(0, 10) === day;
  }, "Data inválida");
export const reportQuerySchema = z
  .object({
    view: z.enum(["summary", "details", "executive"]).default("summary"),
    dataset: reportDatasetSchema.default("members"),
    from: reportDaySchema,
    to: reportDaySchema,
    dateScope: z.enum(["period", "all"]).default("period"),
    search: z.string().trim().max(120).default(""),
    status: z.string().trim().max(80).default(""),
    category: z.string().trim().max(120).default(""),
    city: z.string().trim().max(120).default(""),
    channel: z.enum(["all", "admin", "site", "app"]).default("all"),
    environment: z.enum(["production", "development", "test"]).default("production"),
    source: z
      .string()
      .regex(/^[a-z0-9.-]{0,80}$/)
      .default(""),
    groupBy: z.string().max(30).default(""),
    columns: z.array(z.string().max(30)).max(20).default([]),
    sort: z.string().max(30).default("date"),
    direction: z.enum(["asc", "desc"]).default("desc"),
    page: z.coerce.number().int().min(1).max(100000).default(1),
  })
  .strict()
  .superRefine((query, ctx) => {
    const days = (Date.parse(query.to) - Date.parse(query.from)) / 86400000;
    if (days < 0 || days > 365)
      ctx.addIssue({
        code: "custom",
        path: ["to"],
        message: "Selecione até 366 dias, em ordem cronológica.",
      });
    const fields = Object.keys(reportCatalog[query.dataset].columns);
    if (
      query.columns.some((key) => !fields.includes(key)) ||
      new Set(query.columns).size !== query.columns.length
    )
      ctx.addIssue({ code: "custom", path: ["columns"], message: "Colunas inválidas" });
    if (!fields.includes(query.sort) && !(query.groupBy && query.sort === "count"))
      ctx.addIssue({ code: "custom", path: ["sort"], message: "Ordenação inválida" });
    if (query.groupBy && (!fields.includes(query.groupBy) || query.dataset === "access"))
      ctx.addIssue({ code: "custom", path: ["groupBy"], message: "Agrupamento inválido" });
  });
export type ReportQuery = z.infer<typeof reportQuerySchema>;
/** JSONB changes object key order; pagination does not change the exported filters. */
export function sameReportFilters(candidate: ReportQuery, applied: ReportQuery): boolean {
  const left = reportQuerySchema.safeParse({ ...candidate, page: 1 });
  const right = reportQuerySchema.safeParse({ ...applied, page: 1 });
  return left.success && right.success && JSON.stringify(left.data) === JSON.stringify(right.data);
}
export const reportFormatSchema = z.enum(["csv", "xlsx", "pdf"]);
export const reportExportSchema = z
  .object({
    query: reportQuerySchema,
    format: reportFormatSchema,
    notes: z.string().trim().max(2000).default(""),
  })
  .strict()
  .refine(
    (data) => data.query.view === "details" || data.format !== "xlsx",
    "Excel disponível na análise detalhada",
  );
export type ReportExportInput = z.infer<typeof reportExportSchema>;
export const savedReportSchema = z
  .object({
    name: z.string().trim().min(2).max(100),
    query: reportQuerySchema,
    notes: z.string().trim().max(2000).default(""),
    version: z.number().int().min(1).optional(),
  })
  .strict();
export type ReportRow = Record<string, string | number | null>;
export interface ReportTable {
  columns: Record<string, string>;
  rows: ReportRow[];
  total: number;
  page: number;
  hasNextPage: boolean;
  definition: string;
}
export interface ReportMetric {
  id: string;
  label: string;
  value: number;
  previous: number | null;
  change: number | null;
  definition: string;
}
export interface ReportSummary {
  inventory: { label: string; value: number; definition: string }[];
  metrics: ReportMetric[];
  series: { date: string; dataset: string; value: number }[];
  notices: string[];
  updatedAt: string;
}
export interface ReportUsage {
  previous: { views: number; sessions: number; visitors: number; accounts: number };
  series: { date: string; views: number }[];
  views: number;
  sessions: number;
  visitors: number;
  accounts: number;
  returning: number;
  recent: number;
  firstEvent: string | null;
  lastEvent: string | null;
  daily: number;
  weekly: number;
  monthly: number;
  funnel: { step: string; sessions: number }[];
  sources: {
    source: string;
    channel: string;
    firstEvent: string;
    lastEvent: string;
    events: number;
  }[];
}
export const analyticsEventSchema = z
  .object({
    id: z.uuid(),
    visitorId: z.uuid(),
    sessionId: z.uuid(),
    accountId: z.uuid().optional(),
    occurredAt: z.iso.datetime({ offset: true }).optional(),
    event: z.enum([
      "page_view",
      "schedule_open",
      "service_selected",
      "slot_selected",
      "booking_confirmed",
      "report_exported",
    ]),
    screen: z.enum([
      "home",
      "news",
      "members",
      "partners",
      "users",
      "scheduling",
      "messages",
      "audit",
      "reports",
      "sessions",
      "settings",
      "other",
    ]),
    device: z.enum(["desktop", "mobile", "tablet", "unknown"]).default("unknown"),
    origin: z
      .enum(["direct", "search", "social", "referral", "internal", "unknown"])
      .default("unknown"),
    version: z
      .string()
      .regex(/^[a-zA-Z0-9._+-]{0,40}$/)
      .default(""),
  })
  .strict();
export type AnalyticsEvent = z.infer<typeof analyticsEventSchema>;
export const reportJobSchema = z
  .object({ jobId: z.uuid(), requestId: z.uuid(), correlationId: z.uuid() })
  .strict();
export type ReportJob = z.infer<typeof reportJobSchema>;

export function reportDate(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Bahia",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}
export function reportPreset(kind: "week" | "month", now = new Date()) {
  const to = reportDate(now),
    date = new Date(`${to}T12:00:00Z`);
  if (kind === "month") date.setUTCDate(1);
  else date.setUTCDate(date.getUTCDate() - ((date.getUTCDay() + 6) % 7));
  return { from: date.toISOString().slice(0, 10), to };
}
export function reportBounds(query: Pick<ReportQuery, "from" | "to">) {
  const from = new Date(`${query.from}T00:00:00-03:00`);
  const until = new Date(Date.parse(`${query.to}T00:00:00-03:00`) + 86400000);
  return {
    from,
    until,
    previousFrom: new Date(from.valueOf() - (until.valueOf() - from.valueOf())),
  };
}
export function reportChange(value: number, previous: number) {
  return previous === 0
    ? value === 0
      ? 0
      : null
    : Math.round(((value - previous) / previous) * 1000) / 10;
}
