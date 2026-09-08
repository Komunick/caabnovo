"use client";

import type { ReactNode } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;

export function DialogContent({
  title,
  description,
  children,
}: Readonly<{ title: string; description?: string; children: ReactNode }>) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="dialog-backdrop" />
      <DialogPrimitive.Content className="dialog-card">
        <DialogPrimitive.Title>{title}</DialogPrimitive.Title>
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
