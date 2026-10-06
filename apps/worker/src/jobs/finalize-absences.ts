import type { Pool } from "pg";
import type { PgBoss } from "pg-boss";
import {
  processExpiredSchedulingAbsences,
  SchedulingAbsenceFinalizationError,
} from "@caab/db/repositories/scheduling-absence-finalization";
import { QUEUES } from "../queues.js";
import { logger } from "../logger.js";

function failureDiagnostic(cause: unknown) {
  const code =
    typeof cause === "object" && cause !== null && "code" in cause ? cause.code : undefined;
  const errorCode = typeof code === "string" && /^[0-9A-Z]{5}$/.test(code) ? code : "UNKNOWN_ERROR";
  const message = errorCode.startsWith("235")
    ? "Uma restrição do banco impediu a finalização da falta."
    : errorCode === "57014"
      ? "A finalização da falta foi interrompida por cancelamento ou limite de tempo."
      : errorCode.startsWith("40")
        ? "Um conflito de transação impediu a finalização da falta."
        : errorCode.startsWith("08")
          ? "Uma falha de conexão com o banco impediu a finalização da falta."
          : errorCode === "P0001"
            ? "Uma regra do banco interrompeu a finalização da falta."
            : "Não foi possível finalizar a falta; consulte o código e a correlação da falha.";
  return { errorCode, message };
}

export async function registerSchedulingAbsenceFinalization(
  boss: Pick<PgBoss, "work" | "schedule">,
  pool: Pool,
) {
  await boss.work(QUEUES.schedulingAbsenceFinalization, async () => {
    try {
      await processExpiredSchedulingAbsences(pool);
    } catch (error) {
      if (error instanceof SchedulingAbsenceFinalizationError) {
        for (const failure of error.failures) {
          const diagnostic = failureDiagnostic(failure.cause);
          logger.error(
            {
              event: "scheduling.absence.finalization_failed",
              correlationId: failure.absenceId,
              errorCode: diagnostic.errorCode,
            },
            diagnostic.message,
          );
        }
      }
      throw error;
    }
  });
  await boss.schedule(QUEUES.schedulingAbsenceFinalization, "* * * * *", {});
}
