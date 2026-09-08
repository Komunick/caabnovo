import { getAuth } from "@/modules/auth/auth";
import { getDatabase } from "@/modules/shared/database";

export async function POST(request: Request) {
  if (process.env.E2E_TEST_MODE !== "1") return new Response(null, { status: 404 });
  const session = await getAuth().api.getSession({ headers: request.headers });
  if (!session) return new Response(null, { status: 401 });
  await getDatabase().pool.query(
    "UPDATE session SET revoked_at = now(), updated_at = now() WHERE token = $1",
    [session.session.token],
  );
  return Response.json({ revoked: true });
}
