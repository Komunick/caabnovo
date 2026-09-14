import { partnerRoute } from "@/modules/partners/http/runtime";
export const runtime = "nodejs";
export async function GET(request: Request, context: { params: Promise<{ path?: string[] }> }) {
  return partnerRoute(request, (await context.params).path);
}
export const POST = GET;
