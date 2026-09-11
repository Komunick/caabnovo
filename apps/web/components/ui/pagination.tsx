import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { buttonVariants } from "./button";

export function Pagination({
  firstHref,
  previousHref,
  nextHref,
}: Readonly<{ firstHref?: string; previousHref?: string; nextHref?: string }>) {
  if (!firstHref && !previousHref && !nextHref) return null;
  return (
    <nav aria-label="Paginação" className="pagination">
      {firstHref ? (
        <Link className={buttonVariants()} href={firstHref}>
          <ChevronLeft aria-hidden="true" size={18} /> Primeira página
        </Link>
      ) : null}
      {previousHref ? (
        <Link className={buttonVariants()} href={previousHref} rel="prev">
          <ChevronLeft aria-hidden="true" size={18} /> Anterior
        </Link>
      ) : null}
      {nextHref ? (
        <Link className={buttonVariants()} href={nextHref} rel="next">
          Próxima <ChevronRight aria-hidden="true" size={18} />
        </Link>
      ) : null}
    </nav>
  );
}
