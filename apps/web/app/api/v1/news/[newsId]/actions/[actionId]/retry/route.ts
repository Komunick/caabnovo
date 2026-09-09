import { newsRoutes } from "@/modules/news/http/runtime";
export async function POST(
  request: Request,
  { params }: { params: Promise<{ newsId: string; actionId: string }> },
) {
  const { newsId, actionId } = await params;
  return newsRoutes.cancel(request, newsId, actionId, "retry");
}
