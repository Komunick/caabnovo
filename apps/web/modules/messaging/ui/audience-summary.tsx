import { messageAudienceSchema, memberGenderLabels, type MessageAudience } from "@caab/contracts";
export function AudienceSummary({ audience }: { audience: MessageAudience }) {
  const a = { ...messageAudienceSchema.parse({}), ...audience };
  const filters = [
    a.category && `Categoria: ${a.category}`,
    a.gender && `Gênero: ${memberGenderLabels[a.gender]}`,
    a.relationship !== "any" && (a.relationship === "holder" ? "Titulares" : "Dependentes"),
    a.administrativeStatus !== "any" &&
      `Situação: ${{ active: "Ativa", inactive: "Inativa", blocked: "Bloqueada" }[a.administrativeStatus]}`,
    a.city && `Cidade: ${a.city}`,
    a.residenceState && `Estado de residência: ${a.residenceState}`,
    a.state && `Estado OAB: ${a.state}`,
    a.minAge !== null && `Idade mínima: ${a.minAge}`,
    a.maxAge !== null && `Idade máxima: ${a.maxAge}`,
    a.contact !== "any" && (a.contact === "email" ? "Com e-mail" : "Com telefone"),
  ].filter(Boolean);
  return (
    <p>
      <strong>Público: </strong>
      {filters.length ? filters.join(" · ") : "Todos os cadastros não arquivados"} ·{" "}
      {a.memberIds.length
        ? `${a.memberIds.length} na seleção individual`
        : "Sem seleção individual"}{" "}
      · {a.excludedIds.length} exclusões.
    </p>
  );
}
