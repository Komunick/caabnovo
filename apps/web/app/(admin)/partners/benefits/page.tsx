import { PartnerListPage } from "@/modules/partners/ui/partner-list-page";
export const metadata = { title: "Benefícios", robots: { index: false, follow: false } };
export default function BenefitsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return <PartnerListPage searchParams={searchParams} benefits />;
}
