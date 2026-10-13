export default function PageHeader({ title, description, eyebrow, actions }) {
  return <header className="page-header">
    <div>
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <h1 className="page-title">{title}</h1>
      {description && <p className="muted">{description}</p>}
    </div>
    {actions && <div className="actions">{actions}</div>}
  </header>;
}
