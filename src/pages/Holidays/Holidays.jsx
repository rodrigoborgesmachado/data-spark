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
      <header className="verify__header">
        <div>
          <p className="eyebrow">BrasilAPI</p>
          <h1 className="page-title">Feriados nacionais</h1>
          <p className="muted">
            Consulte os feriados nacionais para um determinado ano.
          </p>
        </div>
      </header>

      <form className="form" onSubmit={handleSubmit}>
        <div className="form__group">
          <label htmlFor="year">Ano</label>
          <div className="form__row">
            <input
              id="year"
              name="year"
              type="number"
              min="1900"
              max="2100"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              inputMode="numeric"
            />
            <button className="btn" type="submit" disabled={loading}>
              {loading ? "Carregando..." : "Buscar"}
            </button>
          </div>
        </div>
      </form>

      {error && <div className="error">{error}</div>}
      {loading && <div className="skeleton">Carregando feriados...</div>}

      {!loading && !error && holidays.length > 0 && (
        <div className="table">
          <div className="table__header">
            <span>Data</span>
            <span>Nome</span>
            <span>Tipo</span>
          </div>
          <div className="table__body">
            {holidays.map((h) => (
              <div key={h.date} className="table__row">
                <span>{formatDate(h.date)}</span>
                <span className="text-strong">{h.name}</span>
                <span>{h.type}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
