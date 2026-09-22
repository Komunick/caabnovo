import type { ReactNode } from "react";

export function PanelHeading({
  title,
  id,
  children,
}: Readonly<{ title: string; id?: string; children?: ReactNode }>) {
  return (
    <div className="panel-heading">
      <h2 id={id}>{title}</h2>
      {children ? <div className="panel-actions">{children}</div> : null}
    </div>
  );
}
