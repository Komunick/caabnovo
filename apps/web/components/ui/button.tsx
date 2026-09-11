import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/components/ui/utils";

export const buttonVariants = cva("button", {
  variants: {
    intent: {
      primary: "button--primary",
      secondary: "button--secondary",
      danger: "button--danger",
      ghost: "button--ghost",
    },
    size: {
      default: "button--default",
      compact: "button--compact",
      add: "button--add",
    },
  },
  defaultVariants: { intent: "secondary", size: "default" },
});

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, intent, size, type = "button", ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(buttonVariants({ intent, size }), className)}
      {...props}
    />
  );
});
