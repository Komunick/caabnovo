"use client";
import NextForm from "next/form";
import Link from "next/link";
import {
  useLayoutEffect,
  useRef,
  type ChangeEvent,
  type ClipboardEvent,
  type ComponentProps,
  type Ref,
} from "react";
import { DraftScope, useDraftCache } from "../workspace-drafts";

type Control = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
type Stored = { value: string; checked?: boolean; files?: File[] };

function useControl<T extends Control>(props: {
  id?: string;
  name?: string;
  type?: string;
  value?: unknown;
  checked?: boolean;
  defaultValue?: unknown;
  defaultChecked?: boolean;
  ref?: Ref<T>;
  onChange?: (event: ChangeEvent<T>) => void;
  onPaste?: (event: ClipboardEvent<T>) => void;
}) {
  const cache = useDraftCache();
  const node = useRef<T | null>(null);
  const initial = useRef(props);
  const restored = useRef(false);
  const key = `field:${props.id ?? props.name ?? ""}${["radio", "checkbox"].includes(props.type ?? "") ? `:${String(props.value)}` : ""}`;
  const controlled =
    props.checked !== undefined ||
    (props.value !== undefined && !["checkbox", "radio"].includes(props.type ?? ""));
  const stored = controlled ? undefined : (cache.read(key) as Stored | undefined);
  // Options backed by an API can arrive after the select mounts.
  useLayoutEffect(() => {
    const element = node.current;
    if (
      !controlled &&
      !restored.current &&
      stored &&
      element instanceof HTMLSelectElement &&
      Array.from(element.options).some((option) => option.value === stored.value)
    ) {
      element.value = stored.value;
      restored.current = true;
    }
  });
  useLayoutEffect(() => {
    const element = node.current;
    if (!element || controlled) return;
    if (stored?.files && element instanceof HTMLInputElement) {
      const transfer = new DataTransfer();
      stored.files.forEach((file) => transfer.items.add(file));
      element.files = transfer.files;
    }
    const reset = () => {
      restored.current = true;
      cache.remove(key);
      if (element instanceof HTMLInputElement) {
        element.defaultChecked = initial.current.defaultChecked ?? false;
        if (element.type !== "file")
          element.defaultValue = String(initial.current.defaultValue ?? "");
      } else if (element instanceof HTMLTextAreaElement)
        element.defaultValue = String(initial.current.defaultValue ?? "");
      else
        for (const option of element.options)
          option.defaultSelected = option.value === String(initial.current.defaultValue ?? "");
    };
    const form = element.form;
    form?.addEventListener("reset", reset);
    return () => form?.removeEventListener("reset", reset);
    // Defaults are captured once, just like a native uncontrolled field.
  }, []);
  const remember = (element: T) => {
    if (controlled || !(props.id || props.name)) return;
    cache.write(key, {
      value: element.value,
      ...(element instanceof HTMLInputElement
        ? {
            checked: element.checked,
            ...(element.type === "file" ? { files: Array.from(element.files ?? []) } : {}),
          }
        : {}),
    });
  };
  return {
    ref: (element: T | null) => {
      node.current = element;
      if (typeof props.ref === "function") props.ref(element);
      else if (props.ref) props.ref.current = element;
    },
    defaultValue: stored?.value ?? props.defaultValue,
    defaultChecked: stored?.checked ?? props.defaultChecked,
    onPaste: (event: ClipboardEvent<T>) => {
      props.onPaste?.(event);
      const element = event.currentTarget;
      queueMicrotask(() => remember(element));
    },
    onChange: (event: ChangeEvent<T>) => {
      restored.current = true;
      props.onChange?.(event);
      remember(event.currentTarget);
    },
  };
}

export function DraftInput(props: ComponentProps<"input">) {
  const draft = useControl<HTMLInputElement>(props);
  return (
    <input
      {...props}
      {...draft}
      defaultValue={
        props.type === "file" || props.value !== undefined
          ? undefined
          : (draft.defaultValue as typeof props.defaultValue)
      }
    />
  );
}
export function DraftSelect(props: ComponentProps<"select">) {
  const draft = useControl<HTMLSelectElement>(props);
  return (
    <select
      {...props}
      ref={draft.ref}
      defaultValue={draft.defaultValue as typeof props.defaultValue}
      onChange={draft.onChange}
    />
  );
}
export function DraftTextarea(props: ComponentProps<"textarea">) {
  const draft = useControl<HTMLTextAreaElement>(props);
  return (
    <textarea
      {...props}
      ref={draft.ref}
      defaultValue={draft.defaultValue as typeof props.defaultValue}
      onChange={draft.onChange}
    />
  );
}
export function DraftForm({ draftKey, ...props }: ComponentProps<"form"> & { draftKey: string }) {
  return (
    <DraftScope name={draftKey}>
      <ScopedForm {...props} />
    </DraftScope>
  );
}
function ScopedForm(props: ComponentProps<"form">) {
  const cache = useDraftCache();
  return (
    <form
      {...props}
      onReset={(event) => {
        props.onReset?.(event);
        if (!event.defaultPrevented) cache.clear();
      }}
    />
  );
}

/** GET filters use Next navigation to retain other modules' unfinished forms. */
export function DraftSearchForm({
  draftKey,
  ...props
}: ComponentProps<typeof NextForm> & { draftKey: string }) {
  return (
    <DraftScope name={draftKey}>
      <NextForm {...props} />
    </DraftScope>
  );
}

export function DraftResetLink({
  draftPrefix = "",
  ...props
}: ComponentProps<typeof Link> & { draftPrefix?: string }) {
  const cache = useDraftCache();
  return (
    <Link
      {...props}
      onClick={(event) => {
        props.onClick?.(event);
        if (!event.defaultPrevented) cache.clear(draftPrefix);
      }}
    />
  );
}
