import { getDatabase } from "@/modules/shared/database";
import { resolveRequestActor } from "@/modules/auth/request-actor";
import { createReportsRoute } from "@/modules/reports/http";
import { getJobQueue } from "@/modules/jobs/queue";
export const runtime = "nodejs";
async function handler(request: Request, context: { params: Promise<{ path?: string[] }> }) {
  const { path } = await context.params;
  return createReportsRoute({
    pool: getDatabase().pool,
    resolveActor: resolveRequestActor,
    enqueue: async (client, payload) => {
      const queue = await getJobQueue();
      const id = await queue.send("report-export", payload, {
        singletonKey: payload.jobId,
        db: { executeSql: (text, values) => client.query(text, values) },
      });
      if (!id) throw new Error("Report export queue unavailable");
    },
  })(request, path);
}
export { handler as GET, handler as POST, handler as PUT, handler as DELETE };
