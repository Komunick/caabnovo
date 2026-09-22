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

export function RoleOptions({
  roles,
  name,
  optional = false,
}: Readonly<{ roles: DescribedRole[]; name: string; optional?: boolean }>) {
  const [selected, setSelected] = useDraftState(`single-role:${name}`, "");
  const fieldset = useRef<HTMLFieldSetElement>(null);
  useEffect(() => {
    const form = fieldset.current?.form;
    const reset = () => setSelected("");
    form?.addEventListener("reset", reset);
    return () => form?.removeEventListener("reset", reset);
  }, [setSelected]);
  const options = [
    ...(optional
      ? [
          {
            id: "",
            code: "none",
            name: "Sem cargo",
            description: "Os acessos podem ser definidos individualmente depois do cadastro.",
          },
        ]
      : []),
    ...roles,
  ];
  return (
    <fieldset ref={fieldset} className="user-role-options">
      <legend>{optional ? "Cargo inicial" : "Cargo"}</legend>
      <div className="role-options">
        {options.map((role) => {
          const id = `${name}-${role.id || "none"}`;
          return (
            <label className="role-option" key={role.id}>
              <input
                name={name}
                type="radio"
                value={role.id}
                required={!optional}
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
