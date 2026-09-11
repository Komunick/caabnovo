import { ModuleNavigation } from "@/components/ui/module-navigation";
export function PartnerNavigation({
  active,
}: {
  active: "partners" | "benefits" | "units" | "categories" | "settings";
}) {
  return (
    <ModuleNavigation
      label="Áreas de parceiros"
      items={[
        { href: "/partners", label: "Cadastros", active: active === "partners" },
        { href: "/partners/units", label: "Unidades", active: active === "units" },
        { href: "/partners/categories", label: "Categorias", active: active === "categories" },
        { href: "/partners/benefits", label: "Benefícios", active: active === "benefits" },
        { href: "/partners/settings", label: "Configurações", active: active === "settings" },
      ]}
    />
  );
}
