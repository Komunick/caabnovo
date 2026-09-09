import { publicNewsRoutes } from "@/modules/news/http/public-runtime";
export async function GET(
  request: Request,
  context: { params: Promise<{ channel: string; newsId: string; fileId: string }> },
) {
  const { channel, newsId, fileId } = await context.params;
  return publicNewsRoutes.media(request, channel, newsId, fileId);
}
