import { getDatabase } from "@/modules/shared/database";
import { publicPartnerCategories } from "@/modules/partners/directory-service";
export const dynamic = "force-dynamic";
export async function GET() {
  return Response.json(await publicPartnerCategories(getDatabase().pool), {
    headers: { "cache-control": "no-store", "x-robots-tag": "noindex, nofollow" },
  });
}
