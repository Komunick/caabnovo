import { z } from "zod";

export interface NewsBodyNode {
  type:
    "root" | "paragraph" | "heading" | "list" | "listitem" | "text" | "linebreak" | "news-image";
  version: 1;
  children?: NewsBodyNode[];
  text?: string;
  format?: number | string;
  direction?: "ltr" | "rtl" | null;
  indent?: number;
  tag?: string;
  listType?: "bullet" | "number";
  start?: number;
  value?: number;
  detail?: number;
  mode?: "normal";
  style?: "";
  textFormat?: number;
  textStyle?: "";
  fileId?: string;
  alt?: string;
  caption?: string;
}
export interface NewsBody {
  root: NewsBodyNode;
}

export const emptyNewsBody: NewsBody = {
  root: { type: "root", version: 1, format: "", indent: 0, direction: null, children: [] },
};

export function newsBodyImages(body: NewsBody): NewsBodyNode[] {
  // Images are canonical, top-level blocks; no arbitrary nested media or URLs.
  return body.root.children?.filter((node) => node.type === "news-image") ?? [];
}

// An allowlist produces canonical Lexical JSON. Arbitrary HTML, styles, embeds and URLs never pass.
export const newsBodySchema = z.unknown().transform((input, context): NewsBody => {
  let count = 0;
  let textLength = 0;
  const fail = (): never => {
    throw new Error("Conteúdo inválido ou acima do limite permitido.");
  };
  function node(input: unknown, parent: string, depth: number): NewsBodyNode {
    if (++count > 2000 || depth > 12 || !input || typeof input !== "object") return fail();
    const raw = input as Record<string, unknown>;
    const type = raw.type;
    const permitted =
      parent === "document"
        ? ["root"]
        : parent === "root"
          ? ["paragraph", "heading", "list", "news-image"]
          : parent === "list"
            ? ["listitem"]
            : parent === "listitem"
              ? ["text", "linebreak", "list"]
              : ["text", "linebreak"];
    if (typeof type !== "string" || !permitted.includes(type) || raw.version !== 1) return fail();
    if (type === "news-image") {
      const fileId = z.uuid().safeParse(raw.fileId);
      const alt = raw.alt ?? "";
      const caption = raw.caption ?? "";
      if (
        !fileId.success ||
        typeof alt !== "string" ||
        alt.length > 500 ||
        typeof caption !== "string" ||
        caption.length > 500
      )
        return fail();
      return { type, version: 1, fileId: fileId.data, alt: alt.trim(), caption: caption.trim() };
    }
    if (type === "text") {
      if (typeof raw.text !== "string" || (textLength += raw.text.length) > 100_000) return fail();
      const format = raw.format ?? 0;
      if (typeof format !== "number" || !Number.isInteger(format) || format < 0 || format > 3)
        return fail();
      return { type, version: 1, text: raw.text, format, detail: 0, mode: "normal", style: "" };
    }
    if (type === "linebreak") return { type, version: 1 };
    if (!Array.isArray(raw.children)) return fail();
    const format = raw.format ?? "";
    const direction = raw.direction ?? null;
    const indent = raw.indent ?? 0;
    if (
      !["", "left", "right", "center", "justify", "start", "end"].includes(String(format)) ||
      (direction !== null && direction !== "ltr" && direction !== "rtl") ||
      typeof indent !== "number" ||
      !Number.isInteger(indent) ||
      indent < 0 ||
      indent > 8
    )
      return fail();
    const result: NewsBodyNode = {
      type: type as NewsBodyNode["type"],
      version: 1,
      format: String(format),
      direction,
      indent,
      children: raw.children.map((child) => node(child, type, depth + 1)),
    };
    if (type === "paragraph") {
      result.textFormat = 0;
      result.textStyle = "";
    }
    if (type === "heading") {
      if (raw.tag !== "h2" && raw.tag !== "h3") return fail();
      result.tag = raw.tag;
    }
    if (type === "list") {
      if (raw.listType !== "bullet" && raw.listType !== "number") return fail();
      result.listType = raw.listType;
      result.tag = raw.listType === "bullet" ? "ul" : "ol";
      result.start =
        typeof raw.start === "number" && Number.isSafeInteger(raw.start) && raw.start > 0
          ? raw.start
          : 1;
    }
    if (type === "listitem") {
      result.value =
        typeof raw.value === "number" && Number.isSafeInteger(raw.value) && raw.value > 0
          ? raw.value
          : 1;
    }
    return result;
  }
  try {
    if (!input || typeof input !== "object" || !("root" in input)) return fail();
    return { root: node(input.root, "document", 0) };
  } catch {
    context.addIssue({
      code: "custom",
      message: "Conteúdo inválido ou acima do limite permitido.",
    });
    return z.NEVER;
  }
});
