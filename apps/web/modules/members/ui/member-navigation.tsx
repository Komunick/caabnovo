import { ModuleNavigation } from "@/components/ui/module-navigation";

export function MemberNavigation({ active }: { active: "members" | "oab" }) {
  return (
    <ModuleNavigation
      label="Áreas de associados"
      items={[
        { href: "/members", label: "Cadastros", active: active === "members" },
        { href: "/members/oab", label: "Consultar OAB", active: active === "oab" },
      ]}
    />
  );
}
