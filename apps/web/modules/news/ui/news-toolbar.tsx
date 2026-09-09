"use client";
import { useEffect, useState, type ReactNode } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $createHeadingNode, $isHeadingNode } from "@lexical/rich-text";
import {
  $isListNode,
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
  REMOVE_LIST_COMMAND,
} from "@lexical/list";
import { $setBlocksType } from "@lexical/selection";
import {
  $createParagraphNode,
  $getSelection,
  $isRangeSelection,
  $isTextNode,
  CAN_REDO_COMMAND,
  CAN_UNDO_COMMAND,
  COMMAND_PRIORITY_HIGH,
  COMMAND_PRIORITY_LOW,
  FORMAT_ELEMENT_COMMAND,
  FORMAT_TEXT_COMMAND,
  HISTORY_PUSH_TAG,
  REDO_COMMAND,
  UNDO_COMMAND,
} from "lexical";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Undo2,
  Redo2,
  RemoveFormatting,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export function NewsToolbar({ disabled, children }: { disabled: boolean; children: ReactNode }) {
  const [editor] = useLexicalComposerContext();
  const [active, setActive] = useState({
    bold: false,
    italic: false,
    underline: false,
    strikethrough: false,
    block: "p",
    alignment: "left",
  });
  const [canUndo, setCanUndo] = useState(false),
    [canRedo, setCanRedo] = useState(false);
  useEffect(() => {
    editor.setEditable(!disabled);
  }, [editor, disabled]);
  useEffect(() => {
    const unregister = [
      editor.registerCommand(
        FORMAT_TEXT_COMMAND,
        (format) => !["bold", "italic", "underline", "strikethrough"].includes(format),
        COMMAND_PRIORITY_HIGH,
      ),
      editor.registerCommand(
        CAN_UNDO_COMMAND,
        (value) => {
          setCanUndo(value);
          return false;
        },
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand(
        CAN_REDO_COMMAND,
        (value) => {
          setCanRedo(value);
          return false;
        },
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerUpdateListener(({ editorState }) =>
        editorState.read(() => {
          const selection = $getSelection();
          if (!$isRangeSelection(selection)) return;
          const element = selection.anchor.getNode().getTopLevelElement();
          setActive({
            bold: selection.hasFormat("bold"),
            italic: selection.hasFormat("italic"),
            underline: selection.hasFormat("underline"),
            strikethrough: selection.hasFormat("strikethrough"),
            block: $isHeadingNode(element)
              ? element.getTag()
              : $isListNode(element)
                ? element.getListType()
                : "p",
            alignment: element?.getFormatType() || "left",
          });
        }),
      ),
    ];
    return () => unregister.forEach((stop) => stop());
  }, [editor]);
  function block(tag: string) {
    editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
    editor.update(
      () => {
        const selection = $getSelection();
        if ($isRangeSelection(selection))
          $setBlocksType(selection, () =>
            tag === "p" ? $createParagraphNode() : $createHeadingNode(tag === "h2" ? "h2" : "h3"),
          );
      },
      { tag: HISTORY_PUSH_TAG },
    );
    editor.focus();
  }
  function clear() {
    editor.update(
      () => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection)) return;
        selection.extract().forEach((node) => {
          if ($isTextNode(node)) node.setFormat(0);
        });
        selection.format = 0;
      },
      { tag: HISTORY_PUSH_TAG },
    );
    editor.focus();
  }
  return (
    <div className="news-ribbon" role="group" aria-label="Formatação do conteúdo">
      <div className="news-ribbon-group">
        <span className="news-ribbon-label">Estilo</span>
        <label className="sr-only" htmlFor="news-block-style">
          Estilo do texto
        </label>
        <select
          id="news-block-style"
          disabled={disabled}
          value={["h2", "h3"].includes(active.block) ? active.block : "p"}
          onChange={(event) => block(event.target.value)}
        >
          <option value="p">Texto normal</option>
          <option value="h2">Título 2</option>
          <option value="h3">Título 3</option>
        </select>
      </div>
      <div className="news-ribbon-group">
        <span className="news-ribbon-label">Texto</span>
        <div className="news-ribbon-buttons">
          {(
            [
              { format: "bold", label: "Negrito", shortcut: "Ctrl+B", Icon: Bold },
              { format: "italic", label: "Itálico", shortcut: "Ctrl+I", Icon: Italic },
              { format: "underline", label: "Sublinhado", shortcut: "Ctrl+U", Icon: Underline },
              { format: "strikethrough", label: "Tachado", shortcut: "", Icon: Strikethrough },
            ] as const
          ).map(({ format, label, shortcut, Icon }) => (
            <Button
              key={format}
              className="news-tool-button"
              size="compact"
              disabled={disabled}
              aria-label={label}
              title={`${label}${shortcut ? ` (${shortcut})` : ""}`}
              aria-pressed={active[format]}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, format)}
            >
              <Icon size={19} aria-hidden="true" />
            </Button>
          ))}
          <Button
            className="news-tool-button"
            size="compact"
            disabled={disabled}
            aria-label="Limpar formatação"
            title="Limpar formatação"
            onMouseDown={(event) => event.preventDefault()}
            onClick={clear}
          >
            <RemoveFormatting size={19} aria-hidden="true" />
          </Button>
        </div>
      </div>
      <div className="news-ribbon-group">
        <span className="news-ribbon-label">Parágrafo</span>
        <div className="news-ribbon-buttons">
          {(
            [
              {
                value: "bullet",
                label: "Lista",
                Icon: List,
                command: INSERT_UNORDERED_LIST_COMMAND,
              },
              {
                value: "number",
                label: "Lista numerada",
                Icon: ListOrdered,
                command: INSERT_ORDERED_LIST_COMMAND,
              },
            ] as const
          ).map(({ value, label, Icon, command }) => (
            <Button
              key={value}
              className="news-tool-button"
              size="compact"
              disabled={disabled}
              aria-label={label}
              title={label}
              aria-pressed={active.block === value}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() =>
                editor.dispatchCommand(
                  active.block === value ? REMOVE_LIST_COMMAND : command,
                  undefined,
                )
              }
            >
              <Icon size={19} aria-hidden="true" />
            </Button>
          ))}
          {(
            [
              { value: "left", label: "Alinhar à esquerda", Icon: AlignLeft },
              { value: "center", label: "Centralizar", Icon: AlignCenter },
              { value: "right", label: "Alinhar à direita", Icon: AlignRight },
              { value: "justify", label: "Justificar", Icon: AlignJustify },
            ] as const
          ).map(({ value, label, Icon }) => (
            <Button
              key={value}
              className="news-tool-button"
              size="compact"
              disabled={disabled}
              aria-label={label}
              title={label}
              aria-pressed={active.alignment === value}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, value)}
            >
              <Icon size={19} aria-hidden="true" />
            </Button>
          ))}
        </div>
      </div>
      <div className="news-ribbon-group">
        <span className="news-ribbon-label">Inserir</span>
        {children}
      </div>
      <div className="news-ribbon-group">
        <span className="news-ribbon-label">Histórico</span>
        <div className="news-ribbon-buttons">
          <Button
            className="news-tool-button"
            size="compact"
            disabled={disabled || !canUndo}
            aria-label="Desfazer"
            title="Desfazer (Ctrl+Z)"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => editor.dispatchCommand(UNDO_COMMAND, undefined)}
          >
            <Undo2 size={19} aria-hidden="true" />
          </Button>
          <Button
            className="news-tool-button"
            size="compact"
            disabled={disabled || !canRedo}
            aria-label="Refazer"
            title="Refazer (Ctrl+Y)"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => editor.dispatchCommand(REDO_COMMAND, undefined)}
          >
            <Redo2 size={19} aria-hidden="true" />
          </Button>
        </div>
      </div>
    </div>
  );
}
