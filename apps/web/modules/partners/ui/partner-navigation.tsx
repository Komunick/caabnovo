import { ModuleNavigation } from "@/components/ui/module-navigation";
export function PartnerNavigation({ active }: { active: "partners" | "benefits" }) {
  return (
    <ModuleNavigation
      label="Áreas de parceiros"
      items={[
        { href: "/partners", label: "Cadastros", active: active === "partners" },
        { href: "/partners/benefits", label: "Benefícios", active: active === "benefits" },
      ]}
    />
  );
}
