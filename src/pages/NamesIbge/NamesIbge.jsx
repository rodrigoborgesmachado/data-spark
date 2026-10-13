import { EmptyState, ErrorState, LoadingState } from "../../components/Feedback";
import Table from "react-bootstrap/Table";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import PageHeader from "../../components/PageHeader";
import { useEffect, useMemo, useState } from "react";
import { fetchNameHistory, fetchNameRanking } from "../../services/api";

export default function NamesIbge() {
  const [ranking, setRanking] = useState([]);
  const [loadingRanking, setLoadingRanking] = useState(true);
  const [rankingError, setRankingError] = useState("");

  const [query, setQuery] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
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
    setHasSearched(true);
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
      <PageHeader eyebrow="IBGE" title="Nomes mais usados no Brasil" description={<>
            Visualize o top 20 nacional e pesquise a distribuicao historica de
            um nome.
          </>} />
      
      <div className="panel">
        <div className="panel__head">
          <div>
            <p className="eyebrow">Distribuicao historica</p>
            <h2 className="panel__title">Pesquisar nome</h2>
          </div>
        </div>

        <Form className="form" onSubmit={handleSearch}>
          <div className="form__group">
            <label htmlFor="nome">Nome</label>
            <div className="form__row">
              <Form.Control
                id="nome"
                name="nome"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ex.: Ana, Rodrigo, Maria"
                autoComplete="off"
              />
              <Button className="btn" type="submit" disabled={loadingHistory}>
                {loadingHistory ? "Buscando..." : "Buscar"}
              </Button>
            </div>
          </div>
        </Form>

        {historyError && <ErrorState>{historyError}</ErrorState>}
        {loadingHistory && <LoadingState>Buscando dados...</LoadingState>}

        {!loadingHistory && !historyError && history.length === 0 && <EmptyState title={hasSearched ? "Nenhum nome encontrado" : "Explore o histórico de um nome"}>{hasSearched ? "Tente pesquisar outro nome." : "Digite um nome para consultar sua frequência por período."}</EmptyState>}

        {!loadingHistory && history.length > 0 && (
          <Table responsive hover className="data-table">
            <thead><tr>
              <th scope="col">Periodo</th>
              <th scope="col">Frequencia</th>
            </tr></thead>
            <tbody>
              {history.map((item) => (
                <tr key={item.periodo} className="table__row">
                  <td>{item.periodo}</td>
                  <td>{item.frequencia.toLocaleString("pt-BR")}</td>
                </tr>
              ))}
            </tbody>
            <tfoot><tr>
              <td>Total</td>
              <td>{totalHistory.toLocaleString("pt-BR")}</td>
            </tr></tfoot>
          </Table>
        )}
      </div>

      <div className="panel">
        <div className="panel__head">
          <div>
            <p className="eyebrow">Ranking nacional</p>
            <h2 className="panel__title">Top 20</h2>
          </div>
        </div>

        {rankingError && <ErrorState>{rankingError}</ErrorState>}
        {loadingRanking && <LoadingState>Carregando ranking...</LoadingState>}

        {!loadingRanking && !rankingError && ranking.length === 0 && <EmptyState title="Ranking indisponível">Nenhum nome retornado pela consulta.</EmptyState>}

        {!loadingRanking && !rankingError && ranking.length > 0 && (
          <Table responsive hover className="data-table">
            <thead><tr>
              <th scope="col">Posicao</th>
              <th scope="col">Nome</th>
              <th scope="col">Frequencia</th>
            </tr></thead>
            <tbody>
              {ranking.map((item) => (
                <tr key={item.ranking} className="table__row">
                  <td>#{item.ranking}</td>
                  <td className="text-strong">{item.nome}</td>
                  <td>{item.frequencia.toLocaleString("pt-BR")}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </div>
    </section>
  );
}
