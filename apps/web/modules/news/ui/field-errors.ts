export type NewsFieldErrors = Partial<
  Record<
    | "title"
    | "summary"
    | "slug"
    | "category"
    | "tags"
    | "highlight"
    | "channels"
    | "body"
    | "cover"
    | "coverAlt"
    | "runAt",
    string
  >
>;
type Issue = { path?: readonly PropertyKey[] | string; field?: string; code?: string };

/** Translate contract paths into actionable Portuguese messages, never server exception text. */
export function newsFieldErrors(issues: readonly Issue[]): NewsFieldErrors {
  const errors: NewsFieldErrors = {};
  for (const issue of issues) {
    const path = (
      Array.isArray(issue.path) ? issue.path.join(".") : String(issue.path ?? issue.field ?? "")
    ).replace(/^metadata\./, "");
    const field = path.split(".")[0];
    if (field === "title")
      errors.title =
        issue.code === "TITLE_REQUIRED"
          ? "Informe um título antes de publicar."
          : "Use um título de até 200 caracteres.";
    else if (field === "summary") errors.summary = "Reduza o resumo para até 500 caracteres.";
    else if (field === "slug")
      errors.slug =
        issue.code === "NEWS_SLUG_CONFLICT"
          ? "Este endereço já está publicado em outra notícia. Escolha outro."
          : issue.code === "SLUG_REQUIRED"
            ? "Informe um endereço legível antes de publicar."
            : "Use até 180 caracteres: letras minúsculas, números e hífens entre palavras, sem espaços ou acentos.";
    else if (field === "category") errors.category = "Use uma categoria de até 80 caracteres.";
    else if (field === "tags")
      errors.tags =
        "Informe até 20 tags, com 1 a 80 caracteres cada. Remova vírgulas seguidas ou no final.";
    else if (field === "highlight")
      errors.highlight = "Informe um número inteiro de 1 a 100 para a ordem do destaque.";
    else if (field === "channels")
      errors.channels = "Selecione ao menos um destino, sem repetir canais.";
    else if (field === "runAt")
      errors.runAt = "Escolha um horário futuro de Brasília, dentro dos próximos 365 dias.";
    else if (field === "cover") {
      if (path === "cover.alt")
        errors.coverAlt =
          issue.code === "COVER_ALT_REQUIRED"
            ? "Descreva a capa antes de publicar."
            : "Use uma descrição da capa de até 500 caracteres.";
      else
        errors.cover =
          "Escolha uma imagem PNG ou JPEG desta notícia e aguarde a liberação do arquivo.";
    } else if (field === "body" || field === "content")
      errors.body =
        issue.code === "CONTENT_REQUIRED"
          ? "Escreva o conteúdo da notícia antes de publicar."
          : issue.code === "FILE_UNAVAILABLE"
            ? "Há uma imagem indisponível no conteúdo. Aguarde a liberação ou substitua a imagem."
            : "Use a formatação disponível no editor, até 100.000 caracteres e descrições de até 500 caracteres nas imagens. Para publicar, descreva todas as imagens.";
  }
  return errors;
}

export function focusNewsError() {
  requestAnimationFrame(() => {
    const field = document.querySelector<HTMLElement>('.news-workspace [aria-invalid="true"]');
    let parent = field?.parentElement;
    while (parent) {
      if (parent instanceof HTMLDetailsElement) parent.open = true;
      parent = parent.parentElement;
    }
    field?.focus();
  });
}
