import "server-only";

export interface AdministrativeMfaState {
  hasAdministrativeRole: boolean;
  twoFactorEnabled: boolean;
  challengeVerified: boolean;
}

export class AdminMfaRequiredError extends Error {
  readonly status = 403;

  constructor() {
    super("Verified MFA required for administrative access");
    this.name = "AdminMfaRequiredError";
  }
}

export function administrativeAccessAllowed(state: AdministrativeMfaState): boolean {
  return !state.hasAdministrativeRole || (state.twoFactorEnabled && state.challengeVerified);
}

export function assertAdministrativeMfa<T extends AdministrativeMfaState>(state: T): T {
  if (!administrativeAccessAllowed(state)) throw new AdminMfaRequiredError();
  return state;
}
