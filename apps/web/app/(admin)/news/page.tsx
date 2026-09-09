import { NewsIndex } from "@/modules/news/ui/news-index";
export const metadata = { title: "Notícias", robots: { index: false, follow: false } };
export default function NewsPage(
  props: Readonly<{ searchParams: Promise<Record<string, string | string[] | undefined>> }>,
) {
  return <NewsIndex {...props} />;
}
