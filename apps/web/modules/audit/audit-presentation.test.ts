import { describe, expect, it } from "vitest";
import { presentAuditEvent } from "./audit-presentation";

const event = {
  action: "user.role.revoked",
  entityType: "user",
  actorUserId: "actor",
  origin: "web" as const,
  before: { roleId: "private-role-id", assigned: true },
  after: { roleId: "private-role-id", assigned: false },
};

describe("plain-language audit presentation", () => {
  it.each([
    ["scheduling.absence.recorded", "registrou uma falta"],
    ["scheduling.absence.appeal_submitted", "apresentou pedido de análise de falta"],
    ["scheduling.absence.accepted", "abonou uma falta"],
    ["scheduling.absence.rejected", "recusou um pedido de análise de falta"],
    ["scheduling.absence.finalized", "finalizou o prazo de uma falta"],
    ["scheduling.absence.reviewed", "consultou a justificativa de uma falta"],
    ["scheduling.absence.evidence_granted", "emitiu acesso a um comprovante de falta"],
  ])("explains %s without leaking private evidence", (action, description) => {
    const result = presentAuditEvent(
      {
        ...event,
        action,
        entityType: "scheduling_absence",
        before: null,
        after: {
          explanation: "Private explanation",
          url: "https://private.test/grant",
          fileId: "private-file-id",
        },
      },
      { actorName: "Gabriel" },
    );
    expect(result.description).toBe(`Gabriel ${description}`);
    expect(result.targetLabel).toBe("Falta");
    expect(JSON.stringify(result)).not.toMatch(/Private explanation|private\.test|private-file-id/);
  });

  it.each(["user.role.revoked", "role.revoked"])(
    "explains %s without exposing identifiers",
    (action) => {
      expect(
        presentAuditEvent(
          { ...event, action },
          { actorName: "Gabriel", targetName: "Felipe", roleName: "Administrador" },
        ).description,
      ).toBe("Gabriel removeu o perfil de Administrador de Felipe");
    },
  );
  it("explains grants and unavailable historical names without inventing a role", () => {
    expect(
      presentAuditEvent(
        { ...event, action: "user.role.granted" },
        { actorName: "Gabriel", targetName: "Felipe" },
      ).description,
    ).toBe("Gabriel concedeu um perfil de acesso a Felipe");
    expect(presentAuditEvent(event).description).toBe(
      "Colaborador não identificado removeu um perfil de acesso de colaborador não identificado",
    );
  });
  it.each([
    ["user.created", "criou o cadastro de"],
    ["user.updated", "alterou o cadastro de"],
    ["user.disabled", "desativou o cadastro de"],
  ])("explains %s", (action, verb) => {
    expect(
      presentAuditEvent({ ...event, action }, { actorName: "Gabriel", targetName: "Felipe" })
        .description,
    ).toBe(`Gabriel ${verb} Felipe`);
  });
  it("explains changed fields without copying snapshot values or mutating evidence", () => {
    const original = {
      ...event,
      action: "user.updated",
      before: { name: "Private old name", status: "active", password: "canary" },
      after: { name: "Private new name", status: "disabled" },
    };
    const copy = structuredClone(original);
    const result = presentAuditEvent(original);
    expect(result.changes).toEqual(["Nome alterado", "Situação: Ativo → Desativado"]);
    expect(JSON.stringify(result)).not.toMatch(/Private|canary/);
    expect(original).toEqual(copy);
  });
  it("reports access additions and removals and ignores unknown values", () => {
    const result = presentAuditEvent({
      ...event,
      action: "user.access.updated",
      before: { permissions: ["users:read", "roles:grant"] },
      after: { permissions: ["users:read", "roles:revoke", 7] },
    });
    expect(result.changes).toEqual([
      "Acessos concedidos: Remover acessos",
      "Acessos removidos: Conceder acessos",
    ]);
  });
  it("distinguishes an unidentified web author from automatic events and handles unknown codes", () => {
    expect(
      presentAuditEvent({
        ...event,
        actorUserId: null,
        action: "unknown.private",
        entityType: "secret",
      }).description,
    ).toBe("Autor não identificado registrou uma ação");
    expect(
      presentAuditEvent({
        ...event,
        actorUserId: null,
        origin: "worker",
        action: "audit.export.completed",
        entityType: "audit_export",
      }).description,
    ).toBe("Sistema concluiu a exportação da auditoria");
    expect(
      presentAuditEvent({ ...event, action: "constructor", entityType: "secret" }).description,
    ).toBe("Colaborador não identificado registrou uma ação");
  });
});
