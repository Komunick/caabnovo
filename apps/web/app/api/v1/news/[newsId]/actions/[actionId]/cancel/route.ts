import { newsRoutes } from "@/modules/news/http/runtime";
export async function POST(
  request: Request,
  context: { params: Promise<{ newsId: string; actionId: string }> },
) {
  const { newsId, actionId } = await context.params;
  return newsRoutes.cancel(request, newsId, actionId);
}
