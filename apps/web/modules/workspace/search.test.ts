import { describe, expect, it } from "vitest";
import { getWorkspaceDestinations, searchWorkspaceDestinations } from "./search";
import { PERMISSIONS } from "../auth/permissions";

describe("workspace function search", () => {
  const all = getWorkspaceDestinations(Object.values(PERMISSIONS));
  it.each([
    ["OAB", "/members/oab"],
    ["beneficios", "/partners/benefits"],
    ["  CONVENIOS benefícios ", "/partners/benefits"],
    ["senha alterar", "/settings#password-title"],
    ["rascunhos", "/news/drafts"],
    ["cadastrar associado", "/members/new"],
    ["unidades", "/partners/units"],
  ])("prioritizes the specific function for %s", (query, href) => {
    expect(searchWorkspaceDestinations(all, query)[0]?.href).toBe(href);
  });
  it("omits forbidden functions even when the person knows the exact name", () => {
    for (const permissions of [
      [],
      ["members:write", "partners:write", "audit:export", "jobs:redrive"],
    ]) {
      const restricted = getWorkspaceDestinations(permissions);
      for (const query of [
        "OAB",
        "benefícios",
        "exportar auditoria",
        "processamento",
        "colaborador",
      ]) {
        expect(searchWorkspaceDestinations(restricted, query)).toEqual([]);
      }
    }
    const readOnly = getWorkspaceDestinations(["members:read", "partners:read", "news:read"]);
    expect(readOnly.some((item) => item.id === "member-new")).toBe(false);
    expect(readOnly.some((item) => item.id === "member-documents")).toBe(false);
    expect(readOnly.some((item) => item.id === "partner-contracts")).toBe(false);
    expect(readOnly.some((item) => item.id === "news-publish")).toBe(false);
  });
  it("preserves job-only routing, account functions and a short initial area list", () => {
    const operator = getWorkspaceDestinations(["jobs:read"]);
    expect(searchWorkspaceDestinations(operator, "processamentos")[0]?.href).toBe("/audit/jobs");
    expect(operator.some((item) => item.href === "/audit")).toBe(false);
    expect(searchWorkspaceDestinations(getWorkspaceDestinations([]), "meu email")[0]?.href).toBe(
      "/settings#email-title",
    );
    expect(searchWorkspaceDestinations(all, "").every((item) => item.kind === "area")).toBe(true);
    expect(searchWorkspaceDestinations(all, "termo inexistente")).toEqual([]);
    expect(new Set(all.map((item) => item.id)).size).toBe(all.length);
    expect(all.some((item) => /caassh/i.test(item.label))).toBe(false);
  });
});
