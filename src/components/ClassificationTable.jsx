import Table from "react-bootstrap/Table";
export default function ClassificationTable({
  headingLeft = "Faixa",
  headingRight = "Classificacao",
  rows,
  activeKey = "",
}) {
  return (
    <Table responsive hover className="data-table">
      <thead><tr>
        <th scope="col">{headingLeft}</th>
        <th scope="col">{headingRight}</th>
      </tr></thead>

      <tbody>
        {rows.map((row) => (
          <tr
            key={row.key}
            className={`table__row ${row.key === activeKey ? "table__row--active" : ""}`.trim()}
          >
            <td>{row.range}</td>
            <td>{row.label}</td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
}
