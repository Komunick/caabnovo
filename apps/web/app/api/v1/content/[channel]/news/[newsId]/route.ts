import { publicNewsRoutes } from "@/modules/news/http/public-runtime";
export async function GET(
  request: Request,
  context: { params: Promise<{ channel: string; newsId: string }> },
) {
  const { channel, newsId } = await context.params;
  return publicNewsRoutes.get(request, channel, newsId);
}
