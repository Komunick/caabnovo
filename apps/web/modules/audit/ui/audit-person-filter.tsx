"use client";

import { useEffect, useRef, useState } from "react";
import { auditActorPageSchema } from "@caab/contracts";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";

export function AuditPersonFilter({
  value,
  name,
  onChange,
}: Readonly<{ value: string; name?: string; onChange: (id: string) => void }>) {
  const [text, setText] = useState(value ? (name ?? "Pessoa selecionada") : "");
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<{ id: string; name: string }[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [pageCursor, setPageCursor] = useState<string>();
  const [active, setActive] = useState(-1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const optionsRef = useRef<HTMLUListElement>(null);
  useEffect(() => {
    if (open && active >= 0)
      optionsRef.current?.children[active]?.scrollIntoView({ block: "nearest" });
  }, [active, open]);
  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      setLoading(true);
      setError(false);
      try {
        const query = new URLSearchParams({ q: value ? "" : text });
        if (pageCursor) query.set("cursor", pageCursor);
        const response = await fetch(`/api/v1/audit-actors?${query}`, {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("Search failed");
        const result = auditActorPageSchema.parse(await response.json());
        if (controller.signal.aborted) return;
        setItems((previous) => (pageCursor ? [...previous, ...result.items] : result.items));
        setCursor(result.nextCursor);
      } catch {
        if (!controller.signal.aborted) setError(true);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 250);
    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [text, value, open, pageCursor]);
  function choose(person: { id: string; name: string }) {
    setText(person.name);
    onChange(person.id);
    setOpen(false);
    setActive(-1);
  }
  return (
    <div
      className="audit-person-filter"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
    >
      <FormField id="audit-person" label="Pessoa">
        <Input
          name="personSearch"
          value={text}
          placeholder="Buscar pelo nome"
          autoComplete="off"
          role="combobox"
          aria-expanded={open}
          aria-controls={open ? "audit-person-options" : undefined}
          aria-autocomplete="list"
          aria-activedescendant={
            open && active >= 0 && items[active] ? `audit-person-${items[active]!.id}` : undefined
          }
          onFocus={() => {
            setOpen(true);
            setPageCursor(undefined);
          }}
          onChange={(event) => {
            setText(event.target.value);
            onChange("");
            setOpen(true);
            setPageCursor(undefined);
            setActive(-1);
            setItems([]);
            setCursor(null);
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              event.preventDefault();
              setOpen(false);
            }
            if (event.key === "ArrowDown" || event.key === "ArrowUp") {
              event.preventDefault();
              setOpen(true);
              setActive((index) =>
                Math.max(
                  0,
                  Math.min(items.length - 1, index + (event.key === "ArrowDown" ? 1 : -1)),
                ),
              );
            }
            if (event.key === "Enter" && open) {
              event.preventDefault();
              if (items[active]) choose(items[active]!);
            }
          }}
        />
      </FormField>
      {open && (
        <div className="audit-person-options">
          <ul
            role="listbox"
            ref={optionsRef}
            id="audit-person-options"
            aria-label="Pessoas que realizaram atividades"
          >
            {items.map((person, index) => (
              <li
                key={person.id}
                role="option"
                id={`audit-person-${person.id}`}
                aria-selected={active >= 0 ? active === index : value === person.id}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => choose(person)}
              >
                {person.name}
              </li>
            ))}
          </ul>
          {loading && <p role="status">Buscando pessoas…</p>}
          {error && (
            <p role="alert">Não foi possível buscar pessoas. Digite novamente para tentar.</p>
          )}
          {!loading && !error && !items.length && <p>Nenhuma pessoa encontrada.</p>}
          {cursor && (
            <button type="button" disabled={loading} onClick={() => setPageCursor(cursor)}>
              Mostrar mais pessoas
            </button>
          )}
        </div>
      )}
    </div>
  );
}
