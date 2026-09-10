import { ZodError } from "zod";
import { apiError, accountSettingsRequestSchema } from "@caab/contracts";
import { resolveRequestActor } from "@/modules/auth/request-actor";
import { getDatabase } from "@/modules/shared/database";
import {
  AccountSettingsError,
  changeAccountSettings,
} from "@/modules/auth/account-settings-service";
import { sendAccountEmail } from "@/modules/auth/account-mail";
import {
  requestId,
  validateMutationRequest,
  RequestValidationError,
} from "@/modules/users/http/responses";

export async function POST(request: Request) {
  const id = requestId(request);
  try {
    const actor = await resolveRequestActor(request);
    if (!actor) throw new AccountSettingsError("AUTHENTICATION_REQUIRED", 401);
    validateMutationRequest(request);
    const input = accountSettingsRequestSchema.parse(await request.json());
    return Response.json(
      await changeAccountSettings(getDatabase().pool, {
        actor,
        input,
        requestId: id,
        sendEmail: sendAccountEmail,
      }),
    );
  } catch (error) {
    const known = error instanceof AccountSettingsError || error instanceof RequestValidationError;
    const status = known
      ? error.status
      : error instanceof ZodError || error instanceof SyntaxError
        ? 422
        : 500;
    const code = known ? error.code : status === 422 ? "VALIDATION_FAILED" : "INTERNAL_ERROR";
    return Response.json(apiError(code, "Não foi possível concluir a alteração", id), { status });
  }
}
