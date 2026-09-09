import { newsRoutes } from "@/modules/news/http/runtime";
export async function GET(
  request: Request,
  context: { params: Promise<{ newsId: string; fileId: string }> },
) {
  const { newsId, fileId } = await context.params;
  return newsRoutes.mediaDownload(request, newsId, fileId);
}
