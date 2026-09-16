import { DraftResetLink, DraftSearchForm, DraftSelect } from "@/components/ui/draft-controls";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { partnerUnitListSchema } from "@caab/contracts";
import { resolveRequestActor } from "@/modules/auth/request-actor";
import { getDatabase } from "@/modules/shared/database";
import { Table, TableContainer } from "@/components/ui/table";
import { Button, buttonVariants } from "@/components/ui/button";
import { SearchField } from "@/components/ui/search-controls";
import { FormField } from "@/components/ui/form-field";
import {
  listPartnerCategories,
  getPartnerAppSettings,
  listPartnerUnits,
} from "../directory-service";
import { PartnerNavigation } from "./partner-navigation";
import { CategoryManager } from "./category-manager";
import { AppSettingsForm } from "./app-settings-form";
import styles from "./partners.module.css";
export async function DirectoryPage({
  area,
  searchParams = Promise.resolve({}),
}: {
  area: "units" | "categories" | "settings";
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const actor = await resolveRequestActor(
    new Request("http://caab.internal/partners", { headers: await headers() }),
  );
  if (!actor) redirect("/login");
  if (!actor.permissions.has("partners:read"))
    return <p role="alert">Você não tem permissão para acessar parceiros.</p>;
  const title = {
    units: "Unidades",
    categories: "Categorias",
    settings: "Configurações de parceiros",
  }[area];
  const description = {
    units: "Encontre os locais de atendimento e as regiões atendidas pelos parceiros.",
    categories: "Organize as categorias dos estabelecimentos parceiros.",
    settings: "Escolha as categorias que aparecem na página de parceiros do aplicativo.",
  }[area];
  let content;
  if (area === "categories")
    content = (
      <CategoryManager
        initial={(await listPartnerCategories(getDatabase().pool, actor)).items}
        canWrite={actor.permissions.has("partners:write")}
      />
    );
  else if (area === "settings")
    content = (
      <AppSettingsForm
        initial={await getPartnerAppSettings(getDatabase().pool, actor)}
        canPublish={actor.permissions.has("partners:publish")}
      />
    );
  else {
    const parsed = partnerUnitListSchema.safeParse(await searchParams);
    const query = parsed.success ? parsed.data : partnerUnitListSchema.parse({});
    const result = await listPartnerUnits(getDatabase().pool, actor, query);
    const href = (page: number) =>
      `/partners/units?${new URLSearchParams({ ...query, page: String(page) })}`;
    content = (
      <section className="panel">
        <h2>Encontrar unidade</h2>
        {!parsed.success && <p role="alert">Filtros inválidos. Exibindo a primeira página.</p>}
        <DraftSearchForm
          draftKey="unit-directory"
          role="search"
          aria-label="Filtros de unidades"
          action="/partners/units"
        >
          <div className="filter-toolbar">
            <SearchField
              id="unit-directory-search"
              name="q"
              label="Unidade, parceiro ou localidade"
              defaultValue={query.q}
              maxLength={160}
            />
            <FormField id="unit-directory-status" label="Situação da unidade">
              <DraftSelect name="status" defaultValue={query.status}>
                <option value="all">Todas</option>
                <option value="active">Ativas</option>
                <option value="inactive">Inativas</option>
              </DraftSelect>
            </FormField>
            <Button type="submit">Aplicar filtros</Button>
            <DraftResetLink href="/partners/units" className={buttonVariants({ size: "compact" })}>
              Limpar
            </DraftResetLink>
          </div>
        </DraftSearchForm>
        {!result.items.length ? (
          <p>Nenhuma unidade encontrada. Adicione unidades no cadastro do parceiro.</p>
        ) : (
          <TableContainer aria-label="Lista de unidades">
            <Table className={styles.table} caption="Unidades dos parceiros">
              <thead>
                <tr>
                  <th scope="col">Unidade</th>
                  <th scope="col">Parceiro</th>
                  <th scope="col">Localidade</th>
                  <th scope="col">Situação</th>
                </tr>
              </thead>
              <tbody>
                {result.items.map((unit) => (
                  <tr key={unit.id} className="linked-table-row">
                    <td>
                      <Link
                        className="linked-table-row__link"
                        href={`/partners/${unit.partnerId}?tab=units#unit-${unit.id}`}
                      >
                        {unit.profile.name}
                      </Link>
                    </td>
                    <td>
                      {unit.partnerName}
                      {unit.partnerArchived
                        ? " (arquivado)"
                        : unit.partnerStatus === "suspended"
                          ? " (suspenso)"
                          : ""}
                    </td>
                    <td>
                      {[unit.profile.city, unit.profile.state, unit.profile.region]
                        .filter(Boolean)
                        .join(" · ") ||
                        (unit.profile.mode === "remote" ? "Atendimento remoto" : "Não informada")}
                    </td>
                    <td>{unit.active ? "Ativa" : "Inativa"}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </TableContainer>
        )}
        <nav className={styles.actions} aria-label="Paginação de unidades">
          {result.page > 1 && (
            <Link className={buttonVariants()} href={href(result.page - 1)}>
              Página anterior
            </Link>
          )}
          <span>Página {result.page}</span>
          {result.hasNextPage && (
            <Link className={buttonVariants()} href={href(result.page + 1)}>
              Próxima página
            </Link>
          )}
        </nav>
      </section>
    );
  }
  return (
    <div className={`page-stack ${styles.root}`}>
      <header className="page-header">
        <p className="eyebrow">Rede conveniada</p>
        <h1>{title}</h1>
        <p>{description}</p>
      </header>
      <PartnerNavigation active={area} />
      {content}
    </div>
  );
}
