// Keep generated links short and distinct even when two drafts have the same title.
export function newsSlugFromTitle(title: string, identifier: string) {
  const base = title
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 71)
    .replace(/-+$/g, "");
  if (!title.trim()) return "";
  const suffix = identifier
    .replace(/[^a-z0-9]/gi, "")
    .slice(0, 8)
    .toLowerCase();
  return `${base || "noticia"}-${suffix}`;
}
