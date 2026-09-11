import { memberRoute } from "@/modules/members/http/runtime";
export const runtime = "nodejs";
export async function GET(request: Request, context: { params: Promise<{ path?: string[] }> }) {
  return memberRoute(request, (await context.params).path);
}
export const POST = GET;
