"use client";
import { useEffect, useRef } from "react";
import type { RoleReference } from "@caab/contracts";
import { useDraftState } from "@/components/workspace-drafts";

type DescribedRole = RoleReference & { description?: string };
export function roleDescription(role: Pick<DescribedRole, "code" | "description">) {
  switch (role.code) {
    case "administrator":
      return "Acesso completo ao painel. Administra cargos, permissões e colaboradores.";
    case "manager":
      return "Consulta todos os módulos, exporta dados e usa Relatórios. Gerencia acessos de outros colaboradores e gera novas senhas, exceto para Administradores. Não concede cargos.";
    case "collaborator":
      return "Utiliza apenas os módulos e ações concedidos. Não administra cargos nem acessos de outras pessoas.";
    default:
      return (
        role.description ||
        "Utiliza as permissões vinculadas a este cargo, respeitando os acessos individuais definidos."
      );
  }
}

/** Initial selection: the base role when listed, otherwise nothing (the user must choose). */
export function defaultRoleId(roles: readonly DescribedRole[], code: string | undefined) {
  return roles.find((role) => role.code === code)?.id ?? "";
}

export function RoleOptions({
  roles,
  name,
  defaultCode,
}: Readonly<{ roles: DescribedRole[]; name: string; defaultCode?: string }>) {
  const initial = defaultRoleId(roles, defaultCode);
  const [stored, setSelected] = useDraftState(`single-role:${name}`, initial);
  // A saved draft can point to a role that is no longer offered; fall back to the default.
  const selected = roles.some((role) => role.id === stored) ? stored : initial;
  const fieldset = useRef<HTMLFieldSetElement>(null);
  useEffect(() => {
    const form = fieldset.current?.form;
    const reset = () => setSelected(initial);
    form?.addEventListener("reset", reset);
    return () => form?.removeEventListener("reset", reset);
  }, [setSelected, initial]);
  return (
    <fieldset ref={fieldset} className="user-role-options">
      <legend>{defaultCode ? "Cargo inicial" : "Cargo"}</legend>
      <div className="role-options">
        {roles.map((role) => {
          const id = `${name}-${role.id}`;
          return (
            <label className="role-option" key={role.id}>
              <input
                name={name}
                type="radio"
                value={role.id}
                required
                checked={selected === role.id}
                onChange={() => setSelected(role.id)}
                aria-labelledby={`${id}-name`}
                aria-describedby={`${id}-description`}
              />
              <span>
                <span id={`${id}-name`}>{role.name}</span>
                <small id={`${id}-description`}>{roleDescription(role)}</small>
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
