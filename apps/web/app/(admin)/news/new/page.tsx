import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { resolveRequestActor } from "@/modules/auth/request-actor";
import { PERMISSIONS } from "@/modules/auth/permissions";
import { NewsEditor } from "@/modules/news/ui/news-editor";

export const metadata = { title: "Nova notícia", robots: { index: false, follow: false } };
export default async function NewNewsPage() {
  const actor = await resolveRequestActor(
    new Request("http://caab.internal/news/new", { headers: await headers() }),
  );
  if (!actor) redirect("/login");
  return (
    <div className="page-stack news-module">
      <header className="page-header">
        <Link className={buttonVariants({ size: "compact" })} href="/news">
          Notícias
        </Link>
        <h1>Nova notícia</h1>
        <p>Escreva, adicione imagens e publique quando estiver pronto.</p>
      </header>
      <NewsEditor
        canReadMedia={actor.permissions.has(PERMISSIONS.filesRead)}
        canUploadMedia={actor.permissions.has(PERMISSIONS.filesCreate)}
      />
    </div>
  );
}
