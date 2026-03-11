export default function AuthCard({ eyebrow, title, description, children, footer }) {
  return (
    <main className="page-shell">
      <section className="card auth-card">
        <div className="card-header">
          <span className="eyebrow">{eyebrow}</span>
          <h1>{title}</h1>
          <p className="subtext">{description}</p>
        </div>
        {children}
        {footer ? <div className="footer-link-row">{footer}</div> : null}
      </section>
    </main>
  );
}
