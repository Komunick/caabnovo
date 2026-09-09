import { newsRoutes } from "@/modules/news/http/runtime";
export async function GET(request: Request, context: { params: Promise<{ newsId: string }> }) {
  return newsRoutes.publication(request, (await context.params).newsId);
}
