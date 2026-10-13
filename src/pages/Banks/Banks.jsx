import { EmptyState, ErrorState, LoadingState } from "../../components/Feedback";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import PageHeader from "../../components/PageHeader";
import { useEffect, useMemo, useState } from "react";
import { fetchBankByCode, fetchBanks } from "../../services/api";

export default function Banks() {
  const [banks, setBanks] = useState([]);
  const [selected, setSelected] = useState("");
  const [bank, setBank] = useState(null);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingBank, setLoadingBank] = useState(false);
  const [errorList, setErrorList] = useState("");
  const [errorBank, setErrorBank] = useState("");

  useEffect(() => {
    async function loadBanks() {
      try {
        setErrorList("");
        setLoadingList(true);
        const data = await fetchBanks();
        const sorted = [...data].sort((a, b) => {
          const aName = a?.name || "";
          const bName = b?.name || "";
          return aName.localeCompare(bName, "pt-BR");
        });
        setBanks(sorted);
      } catch (err) {
        setErrorList(err?.message || "Erro ao carregar lista de bancos.");
      } finally {
        setLoadingList(false);
      }
    }
    loadBanks();
  }, []);

  const summary = useMemo(
    () =>
      bank
        ? [
            { label: "Codigo", value: bank.code ?? "—" },
            { label: "ISPB", value: bank.ispb ?? "—" },
            { label: "Nome", value: bank.name ?? "—" },
            { label: "Razao social", value: bank.fullName ?? "—" },
          ]
        : [],
    [bank]
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setErrorBank("");
      setLoadingBank(true);
      const data = await fetchBankByCode(selected);
      setBank(data);
    } catch (err) {
      setBank(null);
      setErrorBank(err?.message || "Erro ao buscar banco.");
    } finally {
      setLoadingBank(false);
    }
  };

  return (
    <section className="verify">
      <PageHeader eyebrow="BrasilAPI" title="Bancos" description={<>
            Selecione um banco pelo codigo (COMPE) para ver detalhes.
          </>} />

      <Form className="form" onSubmit={handleSubmit}>
        <div className="form__group">
          <label htmlFor="bank">Banco</label>
          <div className="form__row">
            <Form.Select
              id="bank"
              name="bank"
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
              disabled={loadingList}
            >
              <option value="">Selecione um banco</option>
              {banks.map((b) => (
                <option key={`${b.ispb}-${b.code}-${b.name}`} value={b.code ?? b.ispb}>
                  {b.code ? `${b.code} - ${b.name}` : b.name}
                </option>
              ))}
            </Form.Select>
            <Button
              className="btn"
              type="submit"
              disabled={loadingList || !selected || loadingBank}
            >
              {loadingBank ? "Buscando..." : "Buscar"}
            </Button>
          </div>
        </div>
      </Form>

      {errorList && <ErrorState>{errorList}</ErrorState>}
      {errorBank && <ErrorState>{errorBank}</ErrorState>}
      {(loadingList || loadingBank) && <LoadingState>Carregando...</LoadingState>}

      {!loadingBank && bank && (
        <div className="result-card">
          <div className="result-card__head">
            <div>
              <p className="eyebrow">Banco</p>
              <h2 className="result-card__title">
                {bank.code ? `${bank.code} - ${bank.name}` : bank.name}
              </h2>
              <p className="muted">{bank.fullName}</p>
            </div>
          </div>

          {summary.length > 0 && (
            <ul className="kv kv--compact">
              {summary.map((item) => (
                <li key={item.label} className="kv__row">
                  <div className="kv__key">{item.label}</div>
                  <div className="kv__val">{item.value}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      {!loadingList && !loadingBank && !errorList && !errorBank && !bank && <EmptyState>Selecione um banco para consultar seus dados.</EmptyState>}
    </section>
  );
}
