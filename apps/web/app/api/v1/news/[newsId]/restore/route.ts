import { newsRoutes } from "@/modules/news/http/runtime";

export async function POST(request: Request, context: { params: Promise<{ newsId: string }> }) {
  return newsRoutes.command(request, (await context.params).newsId, "restore");
}
