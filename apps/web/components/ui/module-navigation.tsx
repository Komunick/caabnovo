import Link from "next/link";
import { buttonVariants } from "./button";

export function ModuleNavigation({
  label,
  items,
}: Readonly<{
  label: string;
  items: ReadonlyArray<{ href: string; label: string; active: boolean }>;
}>) {
  return (
    <nav className="module-tabs" aria-label={label}>
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={buttonVariants({ intent: item.active ? "primary" : "secondary" })}
          aria-current={item.active ? "page" : undefined}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
