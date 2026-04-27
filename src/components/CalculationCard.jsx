export default function CalculationCard({
  eyebrow = "Ciclismo",
  title,
  description,
  aside = null,
  children,
  result = null,
  footer = null,
  className = "",
}) {
  const classes = ["panel", "calc-card", className].filter(Boolean).join(" ");

  return (
    <section className={classes}>
      <div className="calc-card__header">
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h2 className="panel__title">{title}</h2>
        </div>
        {aside}
      </div>

      {description ? <p className="muted calc-card__description">{description}</p> : null}

      {children}

      {result ? (
        <div className="calc-card__result" aria-live="polite">
          {result}
        </div>
      ) : null}

      {footer}
    </section>
  );
}
