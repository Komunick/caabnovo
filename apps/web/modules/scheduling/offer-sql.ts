// Aliases are internal SQL identifiers, never request data.
export function publishedProcedureSql(procedure = "p", service = "s") {
  return `(SELECT item FROM jsonb_array_elements(${service}.published_revision->'procedures') item WHERE item->>'id'=${procedure}.id::text)`;
}
export function serviceActiveSql(service = "s") {
  // A revision can only be published while active. Draft deactivation must not unpublish it.
  return `(${service}.published_revision IS NOT NULL OR ${service}.active)`;
}
export function procedureActiveSql(procedure = "p", service = "s") {
  return `(CASE WHEN ${service}.published_revision IS NULL THEN ${procedure}.active ELSE ${publishedProcedureSql(procedure, service)} IS NOT NULL END)`;
}
