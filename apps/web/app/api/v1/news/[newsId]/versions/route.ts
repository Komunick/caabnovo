import { newsRoutes } from "@/modules/news/http/runtime";

export async function GET(request: Request, context: { params: Promise<{ newsId: string }> }) {
  return newsRoutes.versions(request, (await context.params).newsId);
}
