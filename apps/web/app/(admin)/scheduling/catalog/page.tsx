import { Suspense } from "react";
import { SchedulingCatalog } from "@/modules/scheduling/ui/catalog";
export default function Page() {
  return (
    <Suspense fallback={<p role="status">Carregando agendamentos…</p>}>
      <SchedulingCatalog />
    </Suspense>
  );
}
