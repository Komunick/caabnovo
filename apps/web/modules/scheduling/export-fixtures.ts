/** Synthetic fixtures only. Never imported by the runtime or inserted in a user's database. */
export const schedulingExportFixtures = Array.from({ length: 100 }, (_, index) => ({
  id: `00000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`,
  memberName:
    index === 0
      ? '=1+1,"Beneficiário"\nSalvador'
      : `Pessoa sintética ${String(index).padStart(3, "0")}`,
  startsAt: "2030-01-02T12:00:00.000Z",
  status: index % 2 ? "scheduled" : "cancelled",
  description: index === 0 ? "Descrição extensa ".repeat(300) + "FIM_DESCRICAO" : null,
  forbiddenCpf: "RESTRITO_NAO_EXPORTAR",
}));
/** Metadata-only absence export fixture; private sentinels must never appear in any output format. */
export const schedulingAbsenceExportFixtures = schedulingExportFixtures.map((item) => ({
  id: item.id,
  memberName: item.memberName,
  recordedAt: "2030-01-03T12:00:00.000Z",
  privateExplanation: "JUSTIFICATIVA_RESTRITA_NAO_EXPORTAR",
  privateEvidence: "COMPROVANTE_RESTRITO_NAO_EXPORTAR",
}));
