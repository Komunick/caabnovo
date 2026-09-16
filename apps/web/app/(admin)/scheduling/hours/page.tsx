import { Suspense } from "react";
import { SchedulingHours } from "@/modules/scheduling/ui/hours";
export default function Page() {
  return (
    <Suspense fallback={<p role="status">Carregando agendamentos…</p>}>
      <SchedulingHours />
    </Suspense>
  );
}
