import { check, group, sleep } from "k6";
import http, { type Params, type RefinedResponse, type ResponseType } from "k6/http";
import { Trend } from "k6/metrics";

const baseUrl = __ENV.K6_BASE_URL ?? "http://localhost:3000";
const origin = __ENV.K6_ORIGIN ?? baseUrl;
const managerEmail = __ENV.K6_USER_EMAIL;
const managerPassword = __ENV.K6_USER_PASSWORD;
const adminEmail = __ENV.K6_ADMIN_EMAIL;
const adminPassword = __ENV.K6_ADMIN_PASSWORD;
const roleCode = __ENV.K6_ROLE_CODE ?? "user-viewer";
const profileVus = Number(__ENV.FOUNDATION_VUS ?? 5);
const profileDuration = __ENV.FOUNDATION_DURATION ?? "1m";

const login = new Trend("foundation_login_ms", true);
const mfa = new Trend("foundation_mfa_ms", true);
const navigation = new Trend("foundation_navigation_ms", true);
const usersRead = new Trend("foundation_users_read_ms", true);
const usersWrite = new Trend("foundation_users_write_ms", true);
const permissionsWrite = new Trend("foundation_permissions_write_ms", true);
const auditSearch = new Trend("foundation_audit_search_ms", true);

export const options = {
  scenarios: {
    foundation: {
      executor: "constant-vus",
      exec: "foundationWorkflow",
      vus: profileVus,
      duration: profileDuration,
      gracefulStop: "10s",
    },
    mfa: {
      executor: "per-vu-iterations",
      exec: "mfaValidation",
      vus: profileVus,
      iterations: 1,
      startTime: profileDuration,
      maxDuration: "30s",
    },
  },
  thresholds: {
    checks: ["rate==1"],
    foundation_login_ms: ["p(95)<2000"],
    foundation_mfa_ms: ["p(95)<2000"],
    foundation_navigation_ms: ["p(95)<2000"],
    foundation_users_read_ms: ["p(95)<2000"],
    foundation_users_write_ms: ["p(95)<2000"],
    foundation_permissions_write_ms: ["p(95)<2000"],
    foundation_audit_search_ms: ["p(95)<2000"],
  },
};

interface Session {
  cookie: string;
  csrf: string;
}

interface Role {
  id: string;
  code: string;
}

interface MfaChallenge {
  twoFactorRedirect?: boolean;
}

let selectedRoleId = "";

function required(value: string | undefined, name: string): string {
  if (!value) throw new Error(`${name} is required`);
  return value;
}

function requestParams(name: string, session?: Session): Params {
  return {
    headers: {
      ...(session ? { cookie: `caab.session=${session.cookie}` } : {}),
    },
    tags: { name },
  };
}

function mutationParams(name: string, session: Session, idempotencyKey?: string): Params {
  return {
    headers: {
      cookie: `caab.session=${session.cookie}`,
      "content-type": "application/json",
      origin,
      "x-csrf-token": session.csrf,
      ...(idempotencyKey ? { "idempotency-key": idempotencyKey } : {}),
    },
    tags: { name },
  };
}

function sessionCookie(response: RefinedResponse<ResponseType>): string {
  return response.cookies["caab.session"]?.[0]?.value ?? "";
}

function authenticateManager(): Session {
  const response = http.post(
    `${baseUrl}/api/auth/sign-in/email`,
    JSON.stringify({
      email: required(managerEmail, "K6_USER_EMAIL"),
      password: required(managerPassword, "K6_USER_PASSWORD"),
    }),
    {
      headers: { "content-type": "application/json", origin },
      redirects: 0,
      tags: { name: "POST /api/auth/sign-in/email (manager)" },
    },
  );
  login.add(response.timings.duration);
  const cookie = sessionCookie(response);
  check(response, {
    "login accepted": (value) => value.status === 200,
    "login issued an opaque session": () => Boolean(cookie),
  });
  return { cookie, csrf: crypto.randomUUID() };
}

export function mfaValidation() {
  const challenge = http.post(
    `${baseUrl}/api/auth/sign-in/email`,
    JSON.stringify({
      email: required(adminEmail, "K6_ADMIN_EMAIL"),
      password: required(adminPassword, "K6_ADMIN_PASSWORD"),
    }),
    {
      headers: { "content-type": "application/json", origin },
      redirects: 0,
      tags: { name: "POST /api/auth/sign-in/email (admin MFA challenge)" },
    },
  );
  const challengePayload = challenge.status === 200 ? (challenge.json() as MfaChallenge) : {};
  check(challenge, {
    "administrative login requests MFA": (value) =>
      value.status === 200 && challengePayload.twoFactorRedirect === true,
  });

  const response = http.post(
    `${baseUrl}/api/auth/two-factor/verify-totp`,
    JSON.stringify({ code: "000000", trustDevice: false }),
    {
      headers: { "content-type": "application/json", origin },
      redirects: 0,
      tags: { name: "POST /api/auth/two-factor/verify-totp (safe rejection)" },
    },
  );
  mfa.add(response.timings.duration);
  check(response, {
    "invalid MFA is rejected safely": (value) => [400, 401, 422].includes(value.status),
  });
}

function measuredGet(url: string, metric: Trend, session: Session): RefinedResponse<ResponseType> {
  const response = http.get(`${baseUrl}${url}`, requestParams(`GET ${url}`, session));
  metric.add(response.timings.duration);
  check(response, { [`GET ${url} is 200`]: (value) => value.status === 200 });
  return response;
}

function resolveRoleId(session: Session): string {
  if (selectedRoleId) return selectedRoleId;
  const response = http.get(`${baseUrl}/api/v1/roles`, requestParams("GET /api/v1/roles", session));
  const roles = response.status === 200 ? (response.json() as Role[]) : [];
  selectedRoleId = roles.find(({ code }) => code === roleCode)?.id ?? "";
  check(response, {
    "synthetic non-administrative role is available": (value) =>
      value.status === 200 && Boolean(selectedRoleId),
  });
  return selectedRoleId;
}

export function foundationWorkflow() {
  const session = authenticateManager();

  group("authenticated reads", () => {
    measuredGet("/", navigation, session);
    measuredGet("/api/v1/users?limit=25", usersRead, session);
    measuredGet("/api/v1/audit-events?limit=25", auditSearch, session);
  });

  group("governed writes", () => {
    const suffix = `${__VU}-${__ITER}-${Date.now()}`;
    const created = http.post(
      `${baseUrl}/api/v1/users`,
      JSON.stringify({
        name: `Usuário sintético k6 ${suffix}`,
        email: `k6-${suffix}@example.test`,
        roleIds: [],
        justification: "Medição sintética SC-006",
      }),
      mutationParams("POST /api/v1/users", session, `k6-user-${suffix}`),
    );
    usersWrite.add(created.timings.duration);
    check(created, { "user write accepted": (value) => value.status === 201 });

    const userId = created.status === 201 ? String(created.json("id") ?? "") : "";
    const roleId = resolveRoleId(session);
    if (!userId || !roleId) return;

    const granted = http.put(
      `${baseUrl}/api/v1/users/${userId}/roles/${roleId}`,
      JSON.stringify({ justification: "Medição sintética SC-006" }),
      mutationParams("PUT /api/v1/users/:userId/roles/:roleId", session),
    );
    permissionsWrite.add(granted.timings.duration);
    check(granted, { "permission write accepted": (value) => value.status === 204 });
  });
  sleep(1);
}
