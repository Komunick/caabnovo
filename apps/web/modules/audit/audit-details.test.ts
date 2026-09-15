import { describe, expect, it } from "vitest";
import { describeAuditDetails } from "./audit-details";

describe("human audit details", () => {
  it("explains access removal and status changes without IDs or raw permissions", () => {
    const event = {
      action: "user.role.revoked",
      entityType: "user",
      before: { assigned: true, status: "active", permissions: ["users:read", "roles:grant"] },
      after: {
        assigned: false,
        status: "disabled",
        permissions: ["users:read"],
        roleId: crypto.randomUUID(),
      },
    };
    const original = structuredClone(event);
    const result = describeAuditDetails(event);
    expect(result).toContainEqual({
      label: "Situação do acesso",
      before: "Concedido",
      after: "Removido",
    });
    expect(result).toContainEqual({ label: "Situação", before: "Ativo", after: "Desativado" });
    expect(JSON.stringify(result)).toContain("Conceder acessos");
    expect(JSON.stringify(result)).not.toMatch(/roleId|users:read|roles:grant|assigned|disabled/);
    expect(event).toEqual(original);
  });
  it("shows historical names only with user read permission and preserves redaction", () => {
    const event = {
      action: "user.updated",
      entityType: "user",
      before: { name: "Nome anterior" },
      after: { name: "Nome novo", password: "secret-canary" },
    };
    expect(describeAuditDetails(event)).toEqual([]);
    expect(describeAuditDetails(event, true)).toEqual([
      { label: "Nome", before: "Nome anterior", after: "Nome novo" },
    ]);
    expect(
      describeAuditDetails({ ...event, before: { name: "[REDACTED]" }, after: null }, true),
    ).toEqual([]);
  });
  it("describes member status, assessment and photo replacement without reconstructing missing history", () => {
    expect(
      describeAuditDetails({
        action: "member.block",
        entityType: "member",
        before: null,
        after: { previousAdministrativeStatus: "active", administrativeStatus: "blocked" },
      }),
    ).toEqual([{ label: "Situação do associado", before: "Ativo", after: "Bloqueado" }]);
    expect(
      describeAuditDetails({
        action: "member.assess",
        entityType: "member",
        before: null,
        after: { dimension: "credential", result: "revoked", validUntil: null },
      }),
    ).toEqual([
      { label: "Validade", after: "Sem prazo definido" },
      { label: "Resultado da análise", after: "Revogado" },
      { label: "Tipo de análise", after: "Credencial" },
    ]);
    expect(
      describeAuditDetails({
        action: "member.photo",
        entityType: "member",
        before: null,
        after: { previousPhotoFileId: crypto.randomUUID(), photoFileId: crypto.randomUUID() },
      }),
    ).toEqual([{ label: "Foto do associado", before: "Foto anterior", after: "Nova foto" }]);
  });
  it("translates publication channels, file format, size and scheduled time", () => {
    const result = describeAuditDetails({
      action: "news.action.scheduled",
      entityType: "news",
      before: null,
      after: {
        channels: ["site", "app"],
        action: "publish",
        runAt: "2026-09-15T15:00:00Z",
        declaredMime: "application/pdf",
        sizeBytes: 2048,
        cancelledActionIds: [crypto.randomUUID()],
      },
    });
    expect(result).toContainEqual({ label: "Onde aparece", after: "Site, Aplicativo" });
    expect(result).toContainEqual({ label: "Data agendada", after: "15/09/2026, 12:00" });
    expect(result).toContainEqual({ label: "Formato do arquivo", after: "Documento PDF" });
    expect(result).toContainEqual({ label: "Tamanho do arquivo", after: "2 KB" });
    expect(result).toContainEqual({ label: "Agendamentos cancelados", after: "1" });
  });
  it("keeps unknown fields and enums out of the readable view", () => {
    const result = describeAuditDetails({
      action: "legacy.unknown",
      entityType: "legacy",
      before: null,
      after: {
        status: "INTERNAL_CANARY",
        privateValue: "PRIVATE_CANARY",
        roleId: crypto.randomUUID(),
        permissions: ["legacy:permission"],
        version: 2,
      },
    });
    expect(JSON.stringify(result)).not.toMatch(/CANARY|legacy:permission|roleId/);
    expect(result).toContainEqual({ label: "Versão do cadastro", after: "2" });
    expect(result).toContainEqual({
      label: "Acessos",
      after: "Acesso antigo sem descrição disponível",
    });
  });
});
