import { useState } from "react";
import { fetchCep } from "../../services/api";

export default function Cep() {
  const [cep, setCep] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError("");
      setLoading(true);
      const res = await fetchCep(cep);
      setData(res);
    } catch (err) {
      setData(null);
      setError(err?.message || "Erro ao buscar CEP.");
    } finally {
      setLoading(false);
    }
  };

  const fields = data
    ? [
        { label: "CEP", value: data.cep },
        { label: "Logradouro", value: data.logradouro },
        { label: "Complemento", value: data.complemento },
        { label: "Bairro", value: data.bairro },
        { label: "Cidade", value: data.localidade },
        { label: "UF", value: data.uf },
        { label: "Estado", value: data.estado },
        { label: "Regiao", value: data.regiao },
        { label: "DDD", value: data.ddd },
        { label: "IBGE", value: data.ibge },
        { label: "SIAFI", value: data.siafi },
      ].filter((f) => f.value)
    : [];

  return (
    <section className="verify">
      <header className="verify__header">
        <div>
          <p className="eyebrow">ViaCep</p>
          <h1 className="page-title">Consultar CEP</h1>
          <p className="muted">
            Use o proxy da API Sunsale para consultar enderecos por CEP.
          </p>
        </div>
      </header>

      <form className="form" onSubmit={handleSubmit}>
        <div className="form__group">
          <label htmlFor="cep">CEP</label>
          <div className="form__row">
            <input
              id="cep"
              name="cep"
              value={cep}
              onChange={(e) => setCep(e.target.value)}
              placeholder="00000000 ou 00000-000"
              inputMode="numeric"
            />
            <button className="btn" type="submit" disabled={loading}>
              {loading ? "Buscando..." : "Buscar"}
            </button>
          </div>
        </div>
      </form>

      {error && <div className="error">{error}</div>}
      {loading && <div className="skeleton">Buscando CEP...</div>}

      {!loading && data && (
        <div className="result-card">
          <div className="result-card__head">
            <div>
              <p className="eyebrow">Resultado</p>
              <h2 className="result-card__title">{data.logradouro || "Endereco"}</h2>
              <p className="muted">
                {data.bairro} - {data.localidade} / {data.uf}
              </p>
            </div>
          </div>

          {fields.length > 0 && (
            <ul className="kv kv--compact">
              {fields.map((f) => (
                <li key={f.label} className="kv__row">
                  <div className="kv__key">{f.label}</div>
                  <div className="kv__val">{f.value}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}
