"use client";

import { useRef, type ReactNode, type ComponentProps } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;

export function DialogContent({
  title,
  description,
  children,
  className,
  onCloseAutoFocus,
  focusTitle = false,
}: Readonly<{
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
  onCloseAutoFocus?: ComponentProps<typeof DialogPrimitive.Content>["onCloseAutoFocus"];
  focusTitle?: boolean;
}>) {
  const titleRef = useRef<HTMLHeadingElement>(null);
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="dialog-backdrop" />
      <DialogPrimitive.Content
        className={["dialog-card", className].filter(Boolean).join(" ")}
        onCloseAutoFocus={onCloseAutoFocus}
        onOpenAutoFocus={
          focusTitle
            ? (event) => {
                event.preventDefault();
                titleRef.current?.focus({ preventScroll: true });
              }
            : undefined
        }
      >
        <DialogPrimitive.Title ref={titleRef} tabIndex={focusTitle ? -1 : undefined}>
          {title}
        </DialogPrimitive.Title>
        {description ? (
          <DialogPrimitive.Description>{description}</DialogPrimitive.Description>
        ) : null}
        {children}
        <DialogPrimitive.Close className="dialog-close" aria-label="Fechar">
          <X aria-hidden="true" size={20} />
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}
