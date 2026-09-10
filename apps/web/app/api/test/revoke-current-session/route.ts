import { getAuth } from "@/modules/auth/auth";
import { getDatabase } from "@/modules/shared/database";
import { isLocalTestMode, loadWorkspaceEnv } from "@caab/config";
import { hasTrustedMutationOrigin } from "@/modules/shared/mutation-origin";

export async function POST(request: Request) {
  loadWorkspaceEnv();
  if (!isLocalTestMode(process.env)) return new Response(null, { status: 404 });
  if (!hasTrustedMutationOrigin(request)) return new Response(null, { status: 403 });
  const session = await getAuth().api.getSession({ headers: request.headers });
  if (!session) return new Response(null, { status: 401 });
  await getDatabase().pool.query(
    "UPDATE session SET revoked_at = now(), updated_at = now() WHERE token = $1",
    [session.session.token],
  );
  return Response.json({ revoked: true });
}
