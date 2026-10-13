import { EmptyState, ErrorState, LoadingState } from "../../components/Feedback";
import Table from "react-bootstrap/Table";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import PageHeader from "../../components/PageHeader";
import { useEffect, useState } from "react";
import { fetchHolidays } from "../../services/api";

export default function Holidays() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async (targetYear = year) => {
    try {
      setError("");
      setLoading(true);
      const data = await fetchHolidays(targetYear);
      setHolidays(
        (data || []).sort((a, b) => new Date(a.date) - new Date(b.date))
      );
    } catch (err) {
      setHolidays([]);
      setError(err?.message || "Erro ao carregar feriados.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(year);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    load(year);
  };

  const formatDate = (d) =>
    new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(
      new Date(`${d}T00:00:00Z`)
    );

  return (
    <section className="verify">
      <PageHeader eyebrow="BrasilAPI" title="Feriados nacionais" description={<>
            Consulte os feriados nacionais para um determinado ano.
          </>} />

      <Form className="form" onSubmit={handleSubmit}>
        <div className="form__group">
          <label htmlFor="year">Ano</label>
          <div className="form__row">
            <Form.Control
              id="year"
              name="year"
              type="number"
              min="1900"
              max="2100"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              inputMode="numeric"
            />
            <Button className="btn" type="submit" disabled={loading}>
              {loading ? "Carregando..." : "Buscar"}
            </Button>
          </div>
        </div>
      </Form>

      {error && <ErrorState>{error}</ErrorState>}
      {loading && <LoadingState>Carregando feriados...</LoadingState>}

      {!loading && !error && holidays.length > 0 && (
        <Table responsive hover className="data-table">
          <thead><tr>
            <th scope="col">Data</th>
            <th scope="col">Nome</th>
            <th scope="col">Tipo</th>
          </tr></thead>
          <tbody>
            {holidays.map((h) => (
              <tr key={h.date} className="table__row">
                <td>{formatDate(h.date)}</td>
                <td className="text-strong">{h.name}</td>
                <td>{h.type}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
      {!loading && !error && holidays.length === 0 && <EmptyState>Nenhum feriado encontrado para este ano.</EmptyState>}
    </section>
  );
}
