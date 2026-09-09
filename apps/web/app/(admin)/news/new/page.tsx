import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { resolveRequestActor } from "@/modules/auth/request-actor";
import { NewsEditor } from "@/modules/news/ui/news-editor";

export const metadata = { title: "Nova notícia", robots: { index: false, follow: false } };
export default async function NewNewsPage() {
  const actor = await resolveRequestActor(
    new Request("http://caab.internal/news/new", { headers: await headers() }),
  );
  if (!actor) redirect("/login");
  return (
    <div className="page-stack">
      <header className="page-header">
        <Link href="/news">Notícias</Link>
        <h1>Nova notícia</h1>
        <p>Comece pelo rascunho e desenvolva o conteúdo no seu ritmo.</p>
      </header>
      <NewsEditor />
    </div>
  );
}
