import { getDatabase } from "@/modules/shared/database";
import { isWorkerReady } from "@caab/db/repositories/worker-heartbeat";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const database = getDatabase();
    await database.pool.query("SELECT 1");
    const worker = await isWorkerReady(database.pool, 30_000);
    return Response.json(
      { status: worker ? "ready" : "degraded", dependencies: { database: "ready", worker } },
      { status: worker ? 200 : 503 },
    );
  } catch {
    return Response.json(
      { status: "unavailable", dependencies: { database: "unavailable", worker: false } },
      { status: 503 },
    );
  }
}
