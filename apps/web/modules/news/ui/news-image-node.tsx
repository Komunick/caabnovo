"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import {
  $getNodeByKey,
  $getRoot,
  $createParagraphNode,
  DecoratorNode,
  HISTORY_PUSH_TAG,
  type NodeKey,
  type SerializedLexicalNode,
} from "lexical";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useLexicalEditable } from "@lexical/react/useLexicalEditable";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";

export const NewsImageContext = createContext({ newsId: "", canRead: false });
type ImageData = { fileId: string; alt: string; caption: string };
type SerializedNewsImage = SerializedLexicalNode & ImageData;

function ImageBlock({ nodeKey, fileId, alt, caption }: ImageData & { nodeKey: NodeKey }) {
  const [editor] = useLexicalComposerContext();
  const editable = useLexicalEditable();
  const { newsId, canRead } = useContext(NewsImageContext);
  const [failed, setFailed] = useState(false);
  function change(field: "alt" | "caption", value: string) {
    editor.update(() => {
      const node = $getNodeByKey(nodeKey);
      if (node instanceof NewsImageNode) node.setImage({ fileId, alt, caption, [field]: value });
    });
  }
  function move(direction: "up" | "down" | "remove") {
    editor.update(
      () => {
        const node = $getNodeByKey(nodeKey);
        if (!node) return;
        if (direction === "up") node.getPreviousSibling()?.insertBefore(node);
        else if (direction === "down") node.getNextSibling()?.insertAfter(node);
        else {
          node.remove();
          const root = $getRoot();
          if (!root.getChildrenSize()) root.append($createParagraphNode());
          root.selectEnd();
        }
      },
      { tag: HISTORY_PUSH_TAG },
    );
    if (direction === "remove") editor.focus();
  }
  return (
    <section className="news-image-block" aria-label="Imagem no corpo" contentEditable={false}>
      {canRead && newsId && !failed ? (
        <img
          className="news-cover-image"
          src={`/api/v1/news/${newsId}/media/${fileId}`}
          alt={alt || "Imagem sem descrição"}
          onError={() => setFailed(true)}
        />
      ) : (
        <p>Imagem indisponível para prévia. Confira a verificação do arquivo.</p>
      )}
      {failed && canRead ? (
        <Button size="compact" onClick={() => setFailed(false)}>
          Atualizar prévia da imagem
        </Button>
      ) : null}
      <FormField
        id={`image-alt-${nodeKey}`}
        label="Descrição da imagem no corpo"
        hint="Obrigatória antes de publicar."
      >
        <textarea
          rows={2}
          maxLength={500}
          disabled={!editable}
          value={alt}
          onChange={(event) => change("alt", event.target.value)}
        />
      </FormField>
      <FormField id={`image-caption-${nodeKey}`} label="Legenda da imagem">
        <input
          maxLength={500}
          disabled={!editable}
          value={caption}
          onChange={(event) => change("caption", event.target.value)}
        />
      </FormField>
      <div className="news-actions">
        <Button size="compact" disabled={!editable} onClick={() => move("up")}>
          Mover imagem para cima
        </Button>
        <Button size="compact" disabled={!editable} onClick={() => move("down")}>
          Mover imagem para baixo
        </Button>
        <Button size="compact" disabled={!editable} onClick={() => move("remove")}>
          Remover imagem do corpo
        </Button>
      </div>
    </section>
  );
}

export class NewsImageNode extends DecoratorNode<ReactNode> {
  __fileId: string;
  __alt: string;
  __caption: string;
  constructor(fileId = "", alt = "", caption = "", key?: NodeKey) {
    super(key);
    this.__fileId = fileId;
    this.__alt = alt;
    this.__caption = caption;
  }
  static getType() {
    return "news-image";
  }
  static clone(node: NewsImageNode) {
    return new NewsImageNode(node.__fileId, node.__alt, node.__caption, node.__key);
  }
  static importJSON(data: SerializedNewsImage) {
    return new NewsImageNode(data.fileId, data.alt, data.caption);
  }
  exportJSON(): SerializedNewsImage {
    const node = this.getLatest();
    return {
      type: "news-image",
      version: 1,
      fileId: node.__fileId,
      alt: node.__alt,
      caption: node.__caption,
    };
  }
  setImage(data: ImageData) {
    const node = this.getWritable();
    node.__fileId = data.fileId;
    node.__alt = data.alt;
    node.__caption = data.caption;
  }
  createDOM() {
    const element = document.createElement("div");
    element.className = "news-image-container";
    return element;
  }
  updateDOM() {
    return false;
  }
  isInline() {
    return false;
  }
  decorate() {
    return (
      <ImageBlock
        nodeKey={this.__key}
        fileId={this.__fileId}
        alt={this.__alt}
        caption={this.__caption}
      />
    );
  }
}
