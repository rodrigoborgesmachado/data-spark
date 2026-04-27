export default function ClassificationTable({
  headingLeft = "Faixa",
  headingRight = "Classificacao",
  rows,
  activeKey = "",
}) {
  return (
    <div className="table table--two-cols">
      <div className="table__header">
        <span>{headingLeft}</span>
        <span>{headingRight}</span>
      </div>

      <div className="table__body">
        {rows.map((row) => (
          <div
            key={row.key}
            className={`table__row ${row.key === activeKey ? "table__row--active" : ""}`.trim()}
          >
            <span>{row.range}</span>
            <span>{row.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
