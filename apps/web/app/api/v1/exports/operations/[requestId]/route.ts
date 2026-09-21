import { exportRoutes } from "@/modules/exports/routes";
export const runtime = "nodejs";
export async function GET(request: Request, context: { params: Promise<{ requestId: string }> }) {
  return exportRoutes.status(request, (await context.params).requestId);
}
