import { Suspense } from "react";
import { SchedulingNewBooking } from "@/modules/scheduling/ui/booking-form";
export default function Page() {
  return (
    <Suspense fallback={<p role="status">Carregando agendamentos…</p>}>
      <SchedulingNewBooking />
    </Suspense>
  );
}
