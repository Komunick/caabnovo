import { publicBenefits } from "@/modules/partners/partner-service";
import { getDatabase } from "@/modules/shared/database";
import { requestId, routeErrorResponse } from "@/modules/users/http/responses";

export async function GET(request: Request, { params }: { params: Promise<{ channel: string }> }) {
  let response: Response;
  try {
    const { channel } = await params;
    response = Response.json(
      await publicBenefits(
        getDatabase().pool,
        channel,
        Object.fromEntries(new URL(request.url).searchParams),
      ),
    );
  } catch (error) {
    response = routeErrorResponse(error, requestId(request));
  }
  response.headers.set("cache-control", "no-store");
  return response;
}
