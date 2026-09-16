"use client";
import { useEffect, useId, useRef, useState } from "react";
import type { MessageData, MessageList } from "@caab/contracts";
import { FormField } from "@/components/ui/form-field";
import { Button } from "@/components/ui/button";
import { useMessageData } from "./client";
import { MessageDataState } from "./shared";
export type MessageChoiceItem = {
  id: string;
  name?: string;
  data?: MessageData;
  blocked?: boolean;
  version?: number;
  reason?: string;
};
export function MessageChoice({
  label,
  resource,
  onChoose,
  disabled = false,
}: {
  label: string;
  resource: string;
  onChoose(item: MessageChoiceItem): void;
  disabled?: boolean;
}) {
  const id = useId(),
    input = useRef<HTMLInputElement>(null);
  const [text, setText] = useState("");
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [page, setPage] = useState(1);
  useEffect(() => {
    const timer = setTimeout(() => setSearch(text), 200);
    return () => clearTimeout(timer);
  }, [text]);
  const result = useMessageData<MessageList<MessageChoiceItem>>(
    open && search === text ? `${resource}?q=${encodeURIComponent(search)}&page=${page}` : null,
  );
  const items = result.data?.items ?? [];
  const activeId = open ? items[active]?.id : undefined;
  useEffect(() => {
    if (activeId)
      document.getElementById(`${id}-${activeId}`)?.scrollIntoView({ block: "nearest" });
  }, [activeId, id]);
  function choose(item: MessageChoiceItem) {
    onChoose(item);
    setText("");
    setSearch("");
    setOpen(false);
    setActive(-1);
    input.current?.focus();
  }
  return (
    <div
      className="audit-person-filter"
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setOpen(false);
      }}
    >
      <FormField id={id} label={label}>
        <input
          ref={input}
          role="combobox"
          aria-autocomplete="list"
          autoComplete="off"
          aria-expanded={open}
          aria-controls={open ? `${id}-options` : undefined}
          aria-activedescendant={open && items[active] ? `${id}-${items[active]!.id}` : undefined}
          placeholder="Selecione ou digite"
          value={text}
          disabled={disabled}
          maxLength={160}
          onFocus={() => {
            setOpen(true);
            setPage(1);
            setActive(-1);
          }}
          onClick={() => setOpen(true)}
          onChange={(e) => {
            setText(e.target.value);
            setOpen(true);
            setPage(1);
            setActive(-1);
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              e.preventDefault();
              setOpen(false);
            }
            if (e.key === "ArrowDown" || e.key === "ArrowUp") {
              e.preventDefault();
              setOpen(true);
              setActive((n) =>
                Math.max(0, Math.min(items.length - 1, n + (e.key === "ArrowDown" ? 1 : -1))),
              );
            }
            if (e.key === "Enter" && open) {
              e.preventDefault();
              if (items[active]) choose(items[active]!);
            }
          }}
        />
      </FormField>
      {open && !disabled && (
        <div className="audit-person-options">
          <ul
            id={`${id}-options`}
            role="listbox"
            aria-label={`Opções de ${label.toLocaleLowerCase("pt-BR")}`}
          >
            {items.map((item, index) => (
              <li
                key={item.id}
                id={`${id}-${item.id}`}
                role="option"
                aria-selected={active === index}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => choose(item)}
              >
                {item.name ?? item.data?.name}
                {item.blocked ? " · Bloqueado" : ""}
              </li>
            ))}
          </ul>
          {result.data ? (
            <>
              {!items.length && <p>Nenhum registro encontrado.</p>}
              <div className="form-actions">
                <Button
                  disabled={page === 1}
                  onClick={() => {
                    setPage((n) => n - 1);
                    setActive(-1);
                  }}
                >
                  Anterior
                </Button>
                <Button
                  disabled={!result.data.hasNextPage}
                  onClick={() => {
                    setPage((n) => n + 1);
                    setActive(-1);
                  }}
                >
                  Próxima
                </Button>
              </div>
            </>
          ) : (
            <MessageDataState {...result} />
          )}
        </div>
      )}
    </div>
  );
}
