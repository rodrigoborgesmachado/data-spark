import { useEffect, useMemo, useState } from "react";
import { fetchNameHistory, fetchNameRanking } from "../../services/api";

export default function NamesIbge() {
  const [ranking, setRanking] = useState([]);
  const [loadingRanking, setLoadingRanking] = useState(true);
  const [rankingError, setRankingError] = useState("");

  const [query, setQuery] = useState("");
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyError, setHistoryError] = useState("");

  useEffect(() => {
    async function loadRanking() {
      try {
        setRankingError("");
        setLoadingRanking(true);
        const data = await fetchNameRanking();
        const res = data?.[0]?.res ?? [];
        setRanking(res.slice(0, 20));
      } catch (err) {
        setRankingError(err?.message || "Erro ao carregar ranking.");
      } finally {
        setLoadingRanking(false);
      }
    }

    loadRanking();
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    try {
      setHistoryError("");
      setLoadingHistory(true);
      const data = await fetchNameHistory(query);
      setHistory(data?.[0]?.res ?? []);
    } catch (err) {
      setHistory([]);
      setHistoryError(err?.message || "Erro ao consultar nome.");
    } finally {
      setLoadingHistory(false);
    }
  };

  const totalHistory = useMemo(
    () => history.reduce((sum, item) => sum + (item?.frequencia || 0), 0),
    [history]
  );

  return (
    <section className="verify">
      <header className="verify__header">
        <div>
          <p className="eyebrow">IBGE</p>
          <h1 className="page-title">Nomes mais usados no Brasil</h1>
          <p className="muted">
            Visualize o top 20 nacional e pesquise a distribuicao historica de
            um nome.
          </p>
        </div>
      </header>
      
      <div className="panel">
        <div className="panel__head">
          <div>
            <p className="eyebrow">Distribuicao historica</p>
            <h2 className="panel__title">Pesquisar nome</h2>
          </div>
        </div>

        <form className="form" onSubmit={handleSearch}>
          <div className="form__group">
            <label htmlFor="nome">Nome</label>
            <div className="form__row">
              <input
                id="nome"
                name="nome"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ex.: Ana, Rodrigo, Maria"
                autoComplete="off"
              />
              <button className="btn" type="submit" disabled={loadingHistory}>
                {loadingHistory ? "Buscando..." : "Buscar"}
              </button>
            </div>
          </div>
        </form>

        {historyError && <div className="error">{historyError}</div>}
        {loadingHistory && <div className="skeleton">Buscando dados...</div>}

        {!loadingHistory && history.length > 0 && (
          <div className="table">
            <div className="table__header">
              <span>Periodo</span>
              <span>Frequencia</span>
            </div>
            <div className="table__body">
              {history.map((item) => (
                <div key={item.periodo} className="table__row">
                  <span>{item.periodo}</span>
                  <span>{item.frequencia.toLocaleString("pt-BR")}</span>
                </div>
              ))}
            </div>
            <div className="table__footer">
              <span>Total</span>
              <span>{totalHistory.toLocaleString("pt-BR")}</span>
            </div>
          </div>
        )}
      </div>

      <div className="panel">
        <div className="panel__head">
          <div>
            <p className="eyebrow">Ranking nacional</p>
            <h2 className="panel__title">Top 20</h2>
          </div>
        </div>

        {rankingError && <div className="error">{rankingError}</div>}
        {loadingRanking && <div className="skeleton">Carregando ranking...</div>}

        {!loadingRanking && !rankingError && ranking.length > 0 && (
          <div className="table">
            <div className="table__header">
              <span>Posicao</span>
              <span>Nome</span>
              <span>Frequencia</span>
            </div>
            <div className="table__body">
              {ranking.map((item) => (
                <div key={item.ranking} className="table__row">
                  <span>#{item.ranking}</span>
                  <span className="text-strong">{item.nome}</span>
                  <span>{item.frequencia.toLocaleString("pt-BR")}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
