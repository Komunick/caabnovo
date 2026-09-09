"use client";
import { useEffect, useRef, useState } from "react";
import { LexicalExtensionComposer } from "@lexical/react/LexicalExtensionComposer";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin, createEmptyHistoryState } from "@lexical/react/LexicalHistoryPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { RichTextExtension } from "@lexical/rich-text";
import { ListExtension } from "@lexical/list";
import {
  $createParagraphNode,
  $getRoot,
  $applyNodeReplacement,
  $getSelection,
  $setSelection,
  $isRangeSelection,
  $insertNodes,
  defineExtension,
  HISTORY_PUSH_TAG,
  type BaseSelection,
} from "lexical";
import { ImagePlus } from "lucide-react";
import type { NewsBody, NewsDraftMetadata } from "@caab/contracts";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { NewsCover } from "./news-cover";
import { NewsImageContext, NewsImageNode } from "./news-image-node";
import { NewsToolbar } from "./news-toolbar";

function EditorEditable({ disabled }: { disabled: boolean }) {
  const [editor] = useLexicalComposerContext();
  useEffect(() => {
    editor.setEditable(!disabled);
  }, [editor, disabled]);
  return null;
}

function EditorHistory() {
  const [editor] = useLexicalComposerContext();
  const [history] = useState(() => ({
    ...createEmptyHistoryState(),
    current: { editor, editorState: editor.getEditorState() },
  }));
  return <HistoryPlugin externalHistoryState={history} />;
}

function InsertImage({
  newsId,
  onEnsureNewsId,
  canRead,
  canUpload,
  disabled,
  onUploadingChange,
}: Readonly<{
  newsId?: string;
  onEnsureNewsId?(): Promise<string | undefined>;
  canRead: boolean;
  canUpload: boolean;
  disabled: boolean;
  onUploadingChange(uploading: boolean): void;
}>) {
  const [editor] = useLexicalComposerContext();
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [image, setImage] = useState<NewsDraftMetadata["cover"]>(null);
  const selection = useRef<BaseSelection | null>(null);
  const inserted = useRef(false);
  useEffect(
    () =>
      editor.registerUpdateListener(({ editorState }) =>
        editorState.read(() => {
          const current = $getSelection();
          if ($isRangeSelection(current)) selection.current = current.clone();
        }),
      ),
    [editor],
  );
  if (!canRead)
    return (
      <Button disabled size="compact" title="Seu acesso atual não inclui imagens">
        <ImagePlus size={19} aria-hidden="true" />
        Imagem
      </Button>
    );
  function insert() {
    if (!image || disabled || uploading) return;
    editor.update(
      () => {
        const paragraph = $createParagraphNode();
        const imageNode = $applyNodeReplacement(new NewsImageNode(image.fileId, image.alt));
        if (selection.current) $setSelection(selection.current.clone());
        const current = $getSelection();
        const block = $isRangeSelection(current)
          ? current.anchor.getNode().getTopLevelElement()
          : null;
        if (block?.getType() === "list") {
          block.insertAfter(imageNode);
          imageNode.insertAfter(paragraph);
        } else if ($isRangeSelection(current)) $insertNodes([imageNode, paragraph]);
        else $getRoot().append(imageNode, paragraph);
        paragraph.selectEnd();
      },
      { tag: HISTORY_PUSH_TAG },
    );
    setImage(null);
    inserted.current = true;
    setOpen(false);
  }
  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(value) => {
          if (!uploading) {
            setOpen(value);
            if (value) inserted.current = false;
            if (!value) setImage(null);
          }
        }}
      >
        <DialogTrigger asChild>
          <Button
            size="compact"
            disabled={disabled}
            aria-label="Inserir imagem no corpo"
            title="Inserir imagem no corpo"
          >
            <ImagePlus size={19} aria-hidden="true" />
            Imagem
          </Button>
        </DialogTrigger>
        <DialogContent
          title="Inserir imagem no corpo"
          description="Envie ou escolha uma imagem, descreva-a e insira no ponto em que estava escrevendo."
          className="news-module news-media-dialog"
          onCloseAutoFocus={(event) => {
            if (inserted.current) {
              event.preventDefault();
              editor.focus();
            }
          }}
        >
          <NewsCover
            newsId={newsId}
            onEnsureNewsId={onEnsureNewsId}
            cover={image}
            canRead={canRead}
            canUpload={canUpload}
            disabled={disabled}
            purpose="body"
            onChange={setImage}
            onUploadingChange={(value) => {
              setUploading(value);
              onUploadingChange(value);
            }}
          />
          <div className="news-actions">
            <Button
              disabled={uploading}
              onClick={() => {
                setOpen(false);
                setImage(null);
              }}
            >
              Cancelar
            </Button>
            <Button intent="primary" disabled={!image || uploading || disabled} onClick={insert}>
              Adicionar ao conteúdo
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function RichTextEditor({
  error,
  initialBody,
  disabled,
  onChange,
  newsId,
  onEnsureNewsId,
  canReadMedia,
  canUploadMedia,
  onUploadingChange,
}: Readonly<{
  error?: string;
  initialBody: NewsBody;
  disabled: boolean;
  onChange(body: unknown): void;
  newsId?: string;
  onEnsureNewsId?(): Promise<string | undefined>;
  canReadMedia: boolean;
  canUploadMedia: boolean;
  onUploadingChange(uploading: boolean): void;
}>) {
  // The extension must stay stable while typing; parent updates must not recreate the editor.
  const [extension] = useState(() =>
    defineExtension({
      name: "caab/news",
      namespace: "caab-news",
      editable: !disabled,
      dependencies: [RichTextExtension, ListExtension],
      nodes: [NewsImageNode],
      $initialEditorState: initialBody.root.children?.length
        ? JSON.stringify(initialBody)
        : undefined,
      theme: {
        text: {
          bold: "news-bold",
          italic: "news-italic",
          underline: "news-underline",
          strikethrough: "news-strikethrough",
        },
      },
    }),
  );
  return (
    <NewsImageContext.Provider
      value={{ newsId: newsId ?? "", canRead: canReadMedia, showErrors: !!error }}
    >
      <LexicalExtensionComposer extension={extension} contentEditable={null}>
        <NewsToolbar disabled={disabled}>
          <InsertImage
            newsId={newsId}
            onEnsureNewsId={onEnsureNewsId}
            canRead={canReadMedia}
            canUpload={canUploadMedia}
            disabled={disabled}
            onUploadingChange={onUploadingChange}
          />
        </NewsToolbar>
        <ContentEditable
          id="news-body"
          aria-label="Conteúdo da notícia"
          aria-describedby={error ? "news-body-hint news-body-error" : "news-body-hint"}
          aria-invalid={!!error}
          className="news-editor-content news-prose"
        />
        <EditorEditable disabled={disabled} />
        <EditorHistory />
        <OnChangePlugin ignoreSelectionChange onChange={(state) => onChange(state.toJSON())} />
      </LexicalExtensionComposer>
    </NewsImageContext.Provider>
  );
}
