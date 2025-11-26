import { useMemo, useState } from "react";
import { fetchCompanyByCnpj } from "../../services/api";

function formatActivities(list) {
  if (!Array.isArray(list) || list.length === 0) return "";
  return list
    .map((item) => [item?.code, item?.text].filter(Boolean).join(" - "))
    .filter(Boolean)
    .join("; ");
}

function formatAddress(data) {
  const parts = [
    [data?.logradouro, data?.numero].filter(Boolean).join(", "),
    data?.complemento,
    data?.bairro,
    [data?.municipio, data?.uf].filter(Boolean).join(" - "),
    data?.cep,
  ].filter(Boolean);

  return parts.join(" | ");
}

export default function VerifyCompany({ title = "Verificar empresa" }) {
  const [cnpj, setCnpj] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [company, setCompany] = useState(null);

  const details = useMemo(() => {
    if (!company) return [];

    return [
      { label: "Razao social", value: company?.nome },
      { label: "Nome fantasia", value: company?.fantasia },
      { label: "CNPJ", value: company?.cnpj },
      { label: "Situacao", value: company?.situacao },
      { label: "Abertura", value: company?.abertura },
      {
        label: "Atividade principal",
        value: formatActivities(company?.atividade_principal),
      },
      {
        label: "Atividades secundarias",
        value: formatActivities(company?.atividades_secundarias),
      },
      { label: "Capital social", value: company?.capital_social },
      { label: "Endereco", value: formatAddress(company) },
      { label: "Telefone", value: company?.telefone },
      { label: "Email", value: company?.email },
      { label: "Ultima atualizacao", value: company?.ultima_atualizacao },
    ].filter((item) => item.value);
  }, [company]);

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      setError("");
      setLoading(true);
      const data = await fetchCompanyByCnpj(cnpj);
      setCompany(data);
    } catch (err) {
      setCompany(null);
      setError(err?.message || "Erro ao consultar CNPJ.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="verify">
      <header className="verify__header">
        <div>
          <p className="eyebrow">Consulta publica</p>
          <h1 className="page-title">{title}</h1>
          <p className="muted">
            Consulte dados de empresas diretamente da ReceitaWS informando o
            CNPJ (iremos remover pontos, barras e tracos automaticamente).
          </p>
        </div>
      </header>

      <form className="form" onSubmit={handleSubmit}>
        <div className="form__group">
          <label htmlFor="cnpj">CNPJ</label>
          <div className="form__row">
            <input
              id="cnpj"
              name="cnpj"
              value={cnpj}
              onChange={(e) => setCnpj(e.target.value)}
              placeholder="00.000.000/0000-00"
              inputMode="numeric"
              autoComplete="off"
            />
            <button className="btn" type="submit" disabled={loading}>
              {loading ? "Consultando..." : "Consultar"}
            </button>
          </div>
          <p className="hint">
            Exemplo: 03.007.331/0001-41.
          </p>
        </div>
      </form>

      {error && <div className="error">{error}</div>}
      {loading && <div className="skeleton">Buscando dados...</div>}

      {!loading && company && (
        <div className="result-card">
          <div className="result-card__head">
            <div>
              <p className="eyebrow">Empresa</p>
              <h2 className="result-card__title">
                {company?.nome || "Sem razao social"}
              </h2>
              {company?.fantasia && (
                <p className="muted">Fantasia: {company?.fantasia}</p>
              )}
            </div>
            <span
              className={`pill ${
                company?.situacao === "ATIVA" ? "pill--success" : "pill--muted"
              }`}
            >
              {company?.situacao || "Sem situacao"}
            </span>
          </div>

          {details.length > 0 && (
            <ul className="kv kv--compact">
              {details.map((item) => (
                <li key={item.label} className="kv__row">
                  <div className="kv__key">{item.label}</div>
                  <div className="kv__val">{item.value}</div>
                </li>
              ))}
            </ul>
          )}

          <details className="json-view">
            <summary>JSON completo</summary>
            <pre className="code">
              {JSON.stringify(company, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </section>
  );
}
