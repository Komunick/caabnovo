import { publicNewsRoutes } from "@/modules/news/http/public-runtime";
export async function GET(request: Request, context: { params: Promise<{ channel: string }> }) {
  return publicNewsRoutes.list(request, (await context.params).channel);
}
