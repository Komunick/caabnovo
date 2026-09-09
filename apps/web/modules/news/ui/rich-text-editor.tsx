"use client";

import { useEffect, useState } from "react";
import { LexicalExtensionComposer } from "@lexical/react/LexicalExtensionComposer";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin, createEmptyHistoryState } from "@lexical/react/LexicalHistoryPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $createHeadingNode, RichTextExtension } from "@lexical/rich-text";
import {
  ListExtension,
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
  REMOVE_LIST_COMMAND,
} from "@lexical/list";
import { $setBlocksType } from "@lexical/selection";
import {
  $createParagraphNode,
  $getRoot,
  $applyNodeReplacement,
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_HIGH,
  defineExtension,
  FORMAT_TEXT_COMMAND,
  REDO_COMMAND,
  UNDO_COMMAND,
  HISTORY_PUSH_TAG,
} from "lexical";
import type { NewsBody, NewsDraftMetadata } from "@caab/contracts";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { NewsCover } from "./news-cover";
import { NewsImageContext, NewsImageNode } from "./news-image-node";

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
  canRead,
  canUpload,
  disabled,
  onUploadingChange,
}: Readonly<{
  newsId?: string;
  canRead: boolean;
  canUpload: boolean;
  disabled: boolean;
  onUploadingChange(uploading: boolean): void;
}>) {
  const [editor] = useLexicalComposerContext();
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [image, setImage] = useState<NewsDraftMetadata["cover"]>(null);
  if (!newsId || !canRead) return null;
  function insert() {
    if (!image || disabled || uploading) return;
    editor.update(
      () => {
        const paragraph = $createParagraphNode();
        $getRoot().append(
          $applyNodeReplacement(new NewsImageNode(image.fileId, image.alt)),
          paragraph,
        );
        paragraph.selectEnd();
      },
      { tag: HISTORY_PUSH_TAG },
    );
    setImage(null);
    setOpen(false);
  }
  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(value) => {
          if (!uploading) {
            setOpen(value);
            if (!value) setImage(null);
          }
        }}
      >
        <DialogTrigger asChild>
          <Button disabled={disabled}>Inserir imagem no corpo</Button>
        </DialogTrigger>
        <DialogContent
          title="Inserir imagem no corpo"
          description="A imagem será adicionada ao final do conteúdo. Você pode movê-la depois."
        >
          <NewsCover
            newsId={newsId}
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

function EditorControls({ disabled }: Readonly<{ disabled: boolean }>) {
  const [editor] = useLexicalComposerContext();
  useEffect(() => {
    editor.setEditable(!disabled);
  }, [editor, disabled]);
  useEffect(
    () =>
      editor.registerCommand(
        FORMAT_TEXT_COMMAND,
        (format) => format !== "bold" && format !== "italic",
        COMMAND_PRIORITY_HIGH,
      ),
    [editor],
  );
  function block(tag: "p" | "h2" | "h3") {
    editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection))
        $setBlocksType(selection, () =>
          tag === "p" ? $createParagraphNode() : $createHeadingNode(tag),
        );
    });
    editor.focus();
  }
  return (
    <div className="news-toolbar" role="group" aria-label="Formatação do conteúdo">
      <Button
        disabled={disabled}
        size="compact"
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold")}
      >
        Negrito
      </Button>
      <Button
        disabled={disabled}
        size="compact"
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic")}
      >
        Itálico
      </Button>
      <Button disabled={disabled} size="compact" onClick={() => block("p")}>
        Parágrafo
      </Button>
      <Button disabled={disabled} size="compact" onClick={() => block("h2")}>
        Título 2
      </Button>
      <Button disabled={disabled} size="compact" onClick={() => block("h3")}>
        Título 3
      </Button>
      <Button
        disabled={disabled}
        size="compact"
        onClick={() => editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined)}
      >
        Lista
      </Button>
      <Button
        disabled={disabled}
        size="compact"
        onClick={() => editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined)}
      >
        Lista numerada
      </Button>
      <Button
        disabled={disabled}
        size="compact"
        onClick={() => editor.dispatchCommand(UNDO_COMMAND, undefined)}
      >
        Desfazer
      </Button>
      <Button
        disabled={disabled}
        size="compact"
        onClick={() => editor.dispatchCommand(REDO_COMMAND, undefined)}
      >
        Refazer
      </Button>
    </div>
  );
}

export function RichTextEditor({
  error,
  initialBody,
  disabled,
  onChange,
  newsId,
  canReadMedia,
  canUploadMedia,
  onUploadingChange,
}: Readonly<{
  error?: string;
  initialBody: NewsBody;
  disabled: boolean;
  onChange(body: unknown): void;
  newsId?: string;
  canReadMedia: boolean;
  canUploadMedia: boolean;
  onUploadingChange(uploading: boolean): void;
}>) {
  // The extension must stay stable while typing; parent updates must not recreate the editor.
  const [extension] = useState(() =>
    defineExtension({
      name: "caab/news",
      namespace: "caab-news",
      dependencies: [RichTextExtension, ListExtension],
      nodes: [NewsImageNode],
      $initialEditorState: initialBody.root.children?.length
        ? JSON.stringify(initialBody)
        : undefined,
      theme: { text: { bold: "news-bold", italic: "news-italic" } },
    }),
  );
  return (
    <NewsImageContext.Provider
      value={{ newsId: newsId ?? "", canRead: canReadMedia, showErrors: !!error }}
    >
      <LexicalExtensionComposer extension={extension} contentEditable={null}>
        <EditorControls disabled={disabled} />
        <InsertImage
          newsId={newsId}
          canRead={canReadMedia}
          canUpload={canUploadMedia}
          disabled={disabled}
          onUploadingChange={onUploadingChange}
        />
        <ContentEditable
          id="news-body"
          aria-label="Conteúdo da notícia"
          aria-describedby={error ? "news-body-hint news-body-error" : "news-body-hint"}
          aria-invalid={!!error}
          className="news-editor-content news-prose"
        />
        <EditorHistory />
        <OnChangePlugin ignoreSelectionChange onChange={(state) => onChange(state.toJSON())} />
      </LexicalExtensionComposer>
    </NewsImageContext.Provider>
  );
}
