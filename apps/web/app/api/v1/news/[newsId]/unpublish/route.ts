import { newsRoutes } from "@/modules/news/http/runtime";
export async function POST(request: Request, context: { params: Promise<{ newsId: string }> }) {
  return newsRoutes.publish(request, (await context.params).newsId, "unpublish");
}
