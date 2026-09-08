import http from "k6/http";
import { check, sleep } from "k6";
import { Trend } from "k6/metrics";

const baseUrl = __ENV.K6_BASE_URL ?? "http://localhost:3000";
const email = __ENV.K6_USER_EMAIL;
const password = __ENV.K6_USER_PASSWORD;

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
      vus: Number(__ENV.K6_VUS ?? 5),
      duration: __ENV.K6_DURATION ?? "1m",
      gracefulStop: "10s",
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

function authenticate(): Session {
  if (!email || !password) throw new Error("K6_USER_EMAIL and K6_USER_PASSWORD are required");
  const response = http.post(
    `${baseUrl}/api/auth/sign-in/email`,
    JSON.stringify({ email, password }),
    { headers: { "content-type": "application/json", origin: baseUrl }, redirects: 0 },
  );
  login.add(response.timings.duration);
  check(response, { "login accepted": (value) => value.status === 200 });
  return { cookie: response.cookies["caab.session"]?.[0]?.value ?? "", csrf: crypto.randomUUID() };
}

function measuredGet(url: string, metric: Trend, session: Session, expected = 200) {
  const response = http.get(`${baseUrl}${url}`, {
    headers: { cookie: `caab.session=${session.cookie}` },
  });
  metric.add(response.timings.duration);
  check(response, { [`GET ${url} is ${expected}`]: (value) => value.status === expected });
  return response;
}

export default function () {
  const session = authenticate();
  measuredGet("/mfa", mfa, session);
  measuredGet("/", navigation, session);
  measuredGet("/api/v1/users?limit=25", usersRead, session);
  measuredGet("/api/v1/audit-events?limit=25", auditSearch, session);

  const suffix = `${__VU}-${__ITER}-${Date.now()}`;
  const created = http.post(
    `${baseUrl}/api/v1/users`,
    JSON.stringify({
      name: `Usuário sintético k6 ${suffix}`,
      email: `k6-${suffix}@example.test`,
      justification: "Medição sintética SC-006",
    }),
    {
      headers: {
        cookie: `caab.session=${session.cookie}`,
        "content-type": "application/json",
        origin: baseUrl,
        "x-csrf-token": session.csrf,
        "idempotency-key": `k6-user-${suffix}`,
      },
    },
  );
  usersWrite.add(created.timings.duration);
  check(created, { "user write accepted": (value) => value.status === 201 });

  const user = created.status === 201 ? (created.json() as { id?: string }) : {};
  const roleId = __ENV.K6_ROLE_ID;
  if (user.id && roleId) {
    const granted = http.post(
      `${baseUrl}/api/v1/users/${user.id}/roles/${roleId}`,
      JSON.stringify({ justification: "Medição sintética SC-006" }),
      {
        headers: {
          cookie: `caab.session=${session.cookie}`,
          "content-type": "application/json",
          origin: baseUrl,
          "x-csrf-token": session.csrf,
        },
      },
    );
    permissionsWrite.add(granted.timings.duration);
    check(granted, { "permission write accepted": (value) => value.status === 204 });
  } else {
    permissionsWrite.add(0);
    check(roleId, { "K6_ROLE_ID supplied": Boolean });
  }
  sleep(1);
}
