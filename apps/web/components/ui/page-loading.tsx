export function PageLoading({ label = "Carregando página…" }: Readonly<{ label?: string }>) {
  return (
    <div className="page-loading" role="status" aria-live="polite">
      <p>{label}</p>
      <div className="page-loading__skeleton" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
    </div>
  );
}
