import "server-only";
import { ExportError, type ExportAdapter } from "../exports/catalog";
const expressions: Record<string, string> = {
  id: "u.id::text",
  name: "u.name",
  email: "u.email::text",
  cpf: "u.cpf",
  phone: "u.phone",
  address:
    "concat_ws(', ', u.address->>'street', u.address->>'number', NULLIF(u.address->>'complement',''), u.address->>'neighborhood', u.address->>'city', u.address->>'state', u.address->>'postalCode')",
  status:
    "CASE WHEN u.deletion_effective_at<=transaction_timestamp() THEN 'Excluído' WHEN u.deletion_effective_at IS NOT NULL THEN 'Exclusão pendente — bloqueado' WHEN u.status='active' THEN 'Ativo' ELSE 'Desativado' END",
  createdAt: "to_char(u.created_at AT TIME ZONE 'America/Bahia','DD/MM/YYYY HH24:MI:SS')",
  roles: `(SELECT string_agg(r.name, ', ' ORDER BY r.name,r.id) FROM user_role ur JOIN role r ON r.id=ur.role_id WHERE ur.user_id=u.id AND ur.revoked_at IS NULL AND ur.valid_from<=transaction_timestamp() AND (ur.valid_until IS NULL OR ur.valid_until>transaction_timestamp()) AND r.status='active' AND r.deleted_at IS NULL)`,
  access: `(SELECT string_agg(p.permission, ', ' ORDER BY p.permission) FROM effective_user_permission p WHERE p.user_id=u.id)`,
};
const sorts: Record<string, string> = {
  id: "u.id",
  name: "u.name",
  email: "u.email",
  status: "u.status",
  createdAt: "u.created_at",
};
export const usersExport: ExportAdapter = {
  module: "users",
  dataset: "accounts",
  label: "Colaboradores",
  permission: "users:read",
  scope: "module",
  columns: [
    { key: "cpf", label: "CPF", scalarType: "text", defaultSelected: false, sortable: false },
    {
      key: "phone",
      label: "Telefone",
      scalarType: "text",
      defaultSelected: false,
      sortable: false,
    },
    {
      key: "address",
      label: "Endereço",
      scalarType: "text",
      defaultSelected: false,
      sortable: false,
    },
    { key: "name", label: "Nome", scalarType: "text", defaultSelected: true, sortable: true },
    { key: "email", label: "E-mail", scalarType: "text", defaultSelected: true, sortable: true },
    { key: "status", label: "Estado", scalarType: "text", defaultSelected: true, sortable: true },
    {
      key: "roles",
      label: "Funções",
      scalarType: "text",
      defaultSelected: true,
      sortable: false,
      permission: "roles:read",
    },
    {
      key: "access",
      label: "Acessos",
      scalarType: "text",
      defaultSelected: false,
      sortable: false,
      permission: "roles:read",
    },
    {
      key: "id",
      label: "Identificador",
      scalarType: "text",
      defaultSelected: false,
      sortable: true,
    },
    {
      key: "createdAt",
      label: "Cadastro (horário da Bahia)",
      scalarType: "date",
      defaultSelected: false,
      sortable: true,
    },
  ],
  filters: [
    { key: "name", label: "Nome", type: "text" },
    { key: "email", label: "E-mail", type: "text" },
    { key: "from", label: "Cadastro a partir de", type: "date" },
    { key: "to", label: "Cadastro até", type: "date" },
    {
      key: "status",
      label: "Estado da conta",
      type: "choice",
      options: [
        { value: "active", label: "Ativo" },
        { value: "disabled", label: "Desativado" },
      ],
    },
    {
      key: "deleted",
      label: "Cadastros",
      type: "choice",
      options: [
        { value: "excluded", label: "Atuais" },
        { value: "only", label: "Excluídos" },
        { value: "all", label: "Todos" },
      ],
    },
  ],
  query(input) {
    const values: unknown[] = [];
    const where: string[] = [];
    const param = (value: unknown) => {
      values.push(value);
      return `$${values.length}`;
    };
    for (const key of ["name", "email"]) {
      const value = input.filters[key];
      if (value)
        where.push(
          `u.${key}::text ILIKE ${param(`%${String(value).replace(/[\\%_]/g, "\\$&")}%`)} ESCAPE '\\'`,
        );
    }
    if (input.filters.status) where.push(`u.status=${param(input.filters.status)}::user_status`);
    if (input.filters.from)
      where.push(
        `u.created_at>=(${param(input.filters.from)}::date::timestamp AT TIME ZONE 'America/Bahia')`,
      );
    if (input.filters.to)
      where.push(
        `u.created_at<((${param(input.filters.to)}::date+1)::timestamp AT TIME ZONE 'America/Bahia')`,
      );
    const deleted = input.filters.deleted || "excluded";
    if (deleted === "only") where.push("u.deletion_effective_at<=transaction_timestamp()");
    else if (deleted !== "all")
      where.push(
        "(u.deletion_effective_at IS NULL OR u.deletion_effective_at>transaction_timestamp())",
      );
    if (input.context?.recordId) where.push(`u.id=${param(input.context.recordId)}::uuid`);
    const selection = input.columns.map((key) => {
      if (!expressions[key]) throw new ExportError("EXPORT_CONFIGURATION_INVALID", 422);
      return `${expressions[key]} AS "${key}"`;
    });
    const order = input.sort.map((s) => {
      if (!sorts[s.field]) throw new ExportError("EXPORT_CONFIGURATION_INVALID", 422);
      return `${sorts[s.field]} ${s.direction === "desc" ? "DESC" : "ASC"}`;
    });
    order.push("u.id ASC");
    return {
      text: `SELECT u.id AS "_recordId", ${selection.join(", ")} FROM "user" u ${where.length ? `WHERE ${where.join(" AND ")}` : ""} ORDER BY ${order.join(", ")}`,
      values,
    };
  },
  map(row) {
    return {
      id: String(row._recordId),
      values: Object.fromEntries(
        Object.entries(row)
          .filter(([key]) => key !== "_recordId")
          .map(([key, value]) => [key, value == null ? null : String(value)]),
      ),
    };
  },
};
