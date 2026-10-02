import { Suspense } from "react";
import { SchedulingAbsenceList } from "@/modules/scheduling/ui/absence-list";
export default function Page() {
  return (
    <Suspense fallback={<p role="status">Carregando faltas…</p>}>
      <SchedulingAbsenceList />
    </Suspense>
  );
}
