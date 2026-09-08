import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function Pagination({
  previousHref,
  nextHref,
}: Readonly<{ previousHref?: string; nextHref?: string }>) {
  if (!previousHref && !nextHref) return null;
  return (
    <nav aria-label="Paginação" className="pagination">
      {previousHref ? (
        <Link href={previousHref} rel="prev">
          <ChevronLeft aria-hidden="true" size={18} /> Anterior
        </Link>
      ) : null}
      {nextHref ? (
        <Link href={nextHref} rel="next">
          Próxima <ChevronRight aria-hidden="true" size={18} />
        </Link>
      ) : null}
    </nav>
  );
}
