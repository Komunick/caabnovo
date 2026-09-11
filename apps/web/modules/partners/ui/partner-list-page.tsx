import Link from "next/link";
import { Plus } from "lucide-react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { partnerListSchema, benefitListSchema } from "@caab/contracts";
import { resolveRequestActor } from "@/modules/auth/request-actor";
import { getDatabase } from "@/modules/shared/database";
import { buttonVariants } from "@/components/ui/button";
import { Table, TableContainer } from "@/components/ui/table";
import { listPartners, listBenefits } from "../partner-service";
import { PartnerNavigation } from "./partner-navigation";
import { PartnerFilters } from "./partner-filters";
import { formatDate, statusLabels } from "./labels";
import styles from "./partners.module.css";
export async function PartnerListPage({
  searchParams,
  benefits = false,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
  benefits?: boolean;
}) {
  const actor = await resolveRequestActor(
    new Request("http://caab.internal/partners", { headers: await headers() }),
  );
  if (!actor) redirect("/login");
  if (!actor.permissions.has("partners:read"))
    return <p role="alert">Você não tem permissão para acessar parceiros.</p>;
  const schema = benefits ? benefitListSchema : partnerListSchema;
  const parsed = schema.safeParse(await searchParams);
  const query = parsed.success ? parsed.data : schema.parse({});
  const result = benefits
    ? await listBenefits(getDatabase().pool, actor, query)
    : await listPartners(getDatabase().pool, actor, query);
  const path = benefits ? "/partners/benefits" : "/partners";
  const pageLink = (page: number) =>
    `${path}?${new URLSearchParams({ ...Object.fromEntries(Object.entries(query).map(([key, value]) => [key, String(value)])), page: String(page) })}`;
  return (
    <div className={`page-stack ${styles.root}`}>
      <header className="page-header">
        <p className="eyebrow">Rede conveniada</p>
        <h1>{benefits ? "Benefícios" : "Parceiros"}</h1>
        <p>
          {benefits
            ? "Ofertas, canais e vigências dos parceiros em um só lugar."
            : "Estabelecimentos, unidades, contratos e benefícios."}
        </p>
        {!benefits && actor.permissions.has("partners:write") && (
          <Link className={buttonVariants({ intent: "primary", size: "add" })} href="/partners/new">
            <Plus aria-hidden="true" />
            Novo parceiro
          </Link>
        )}
      </header>
      <PartnerNavigation active={benefits ? "benefits" : "partners"} />
      <section className="panel">
        <h2>{benefits ? "Encontrar benefício" : "Encontrar parceiro"}</h2>
        {!parsed.success && <p role="alert">Filtros inválidos. Exibindo a primeira página.</p>}
        <PartnerFilters query={query} categories={result.categories} benefits={benefits} />
        {!result.items.length ? (
          <p>
            {benefits
              ? "Nenhum benefício encontrado. Cadastre as ofertas dentro do parceiro."
              : "Nenhum parceiro encontrado. Ajuste os filtros ou cadastre um estabelecimento."}
          </p>
        ) : (
          <TableContainer aria-label={benefits ? "Lista de benefícios" : "Lista de parceiros"}>
            <Table
              className={styles.table}
              caption={
                benefits
                  ? "Benefícios por parceiro e situação"
                  : "Estabelecimentos por categoria e situação"
              }
            >
              <thead>
                <tr>
                  <th scope="col">{benefits ? "Benefício" : "Parceiro"}</th>
                  <th scope="col">{benefits ? "Parceiro" : "Categoria"}</th>
                  <th scope="col">Situação</th>
                  {benefits && <th scope="col">Vigência</th>}
                </tr>
              </thead>
              <tbody>
                {result.items.map((item) => {
                  if ("draft" in item)
                    return (
                      <tr key={item.id} className="linked-table-row">
                        <td>
                          <Link
                            className="linked-table-row__link"
                            href={`/partners/${item.partnerId}?tab=benefits`}
                          >
                            {item.draft.title || "Rascunho sem título"}
                          </Link>
                        </td>
                        <td>{item.partnerName}</td>
                        <td>
                          {item.visible
                            ? "Em exibição"
                            : item.published
                              ? "Publicado, sem exibição"
                              : "Rascunho"}
                        </td>
                        <td>
                          {formatDate(item.draft.startsOn)} a {formatDate(item.draft.endsOn)}
                        </td>
                      </tr>
                    );
                  return (
                    <tr key={item.id} className="linked-table-row">
                      <td>
                        <Link className="linked-table-row__link" href={`/partners/${item.id}`}>
                          {item.name}
                        </Link>
                      </td>
                      <td>{item.category}</td>
                      <td>{item.archivedAt ? "Arquivado" : statusLabels[item.status]}</td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </TableContainer>
        )}
        <nav
          className={styles.actions}
          aria-label={benefits ? "Paginação de benefícios" : "Paginação de parceiros"}
        >
          {result.page > 1 && (
            <Link className={buttonVariants()} href={pageLink(result.page - 1)}>
              Página anterior
            </Link>
          )}
          <span>Página {result.page}</span>
          {result.hasNextPage && (
            <Link className={buttonVariants()} href={pageLink(result.page + 1)}>
              Próxima página
            </Link>
          )}
        </nav>
      </section>
    </div>
  );
}
