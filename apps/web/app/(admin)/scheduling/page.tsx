import { Suspense } from "react";
import { SchedulingAgenda } from "@/modules/scheduling/ui/agenda";
export default function Page() {
  return (
    <Suspense fallback={<p role="status">Carregando agendamentos…</p>}>
      <SchedulingAgenda />
    </Suspense>
  );
}
