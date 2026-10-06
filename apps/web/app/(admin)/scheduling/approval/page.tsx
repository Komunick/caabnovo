import { Suspense } from "react";
import { SchedulingApprovalQueue } from "@/modules/scheduling/ui/approval-queue";
export default function Page() {
  return (
    <Suspense fallback={<p role="status">Carregando pendências…</p>}>
      <SchedulingApprovalQueue />
    </Suspense>
  );
}
