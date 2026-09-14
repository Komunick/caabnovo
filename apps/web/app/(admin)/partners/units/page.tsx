import { DirectoryPage } from "@/modules/partners/ui/directory-page";
export const metadata = { title: "Unidades dos parceiros" };
export default function Page(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return <DirectoryPage area="units" {...props} />;
}
