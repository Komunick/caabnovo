import { newsRoutes } from "@/modules/news/http/runtime";

type Context = { params: Promise<{ newsId: string }> };
export async function GET(request: Request, context: Context) {
  return newsRoutes.get(request, (await context.params).newsId);
}
export async function PUT(request: Request, context: Context) {
  return newsRoutes.PUT(request, (await context.params).newsId);
}
