import { NewsIndex } from "@/modules/news/ui/news-index";
export const metadata = { title: "Rascunhos de notícias", robots: { index: false, follow: false } };
export default function NewsDraftsPage(
  props: Readonly<{ searchParams: Promise<Record<string, string | string[] | undefined>> }>,
) {
  return <NewsIndex {...props} drafts />;
}
