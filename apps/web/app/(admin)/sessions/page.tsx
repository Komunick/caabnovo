export default function SessionsPage() {
  return (
    <div className="page-stack">
      <header>
        <p className="eyebrow">Segurança da conta</p>
        <h1>Sessões</h1>
        <p>Entenda como seu acesso é protegido durante o uso do portal.</p>
      </header>
      <section className="panel session-panel" aria-labelledby="current-session-title">
        <span className="status-badge status-active">Ativa agora</span>
        <h2 id="current-session-title">Sessão atual</h2>
        <p>
          Sua sessão atual é verificada no banco de dados em toda ação protegida. Use “Sair” na
          navegação para encerrá-la neste dispositivo.
        </p>
      </section>
    </div>
  );
}
