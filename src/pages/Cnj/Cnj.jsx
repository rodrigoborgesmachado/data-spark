import { useState } from "react";
import { fetchCnjCommunications } from "../../services/api";

function formatDateLabel(value) {
  if (!value) return "";
  if (value.includes("/")) return value;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("pt-BR");
}

function maskProcess(number, masked) {
  if (masked) return masked;
  const digits = String(number ?? "").replace(/\D/g, "");
  if (digits.length !== 20) return number || "";
  return `${digits.slice(0, 7)}-${digits.slice(7, 9)}.${digits.slice(
    9,
    13
  )}.${digits.slice(13, 14)}.${digits.slice(14, 16)}.${digits.slice(16)}`;
}

function listNames(items) {
  if (!Array.isArray(items)) return "";
  return items
    .map((item) => item?.nome)
    .filter(Boolean)
    .join("; ");
}

export default function Cnj() {
  const [oab, setOab] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [payload, setPayload] = useState(null);

  const hasResults = Array.isArray(payload?.items) && payload.items.length > 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError("");
      setLoading(true);
      const data = await fetchCnjCommunications({
        numeroOab: oab,
        dataInicio: startDate,
        dataFim: endDate,
        siglaTribunal: 'TJMG'
      });
      setPayload({
        ...data,
        items: Array.isArray(data?.items) ? data.items : [],
      });
    } catch (err) {
      setPayload(null);
      setError(err?.message || "Erro ao consultar comunicacoes.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="verify">
      <header className="verify__header">
        <div>
          <p className="eyebrow">Consulta CNJ</p>
          <h1 className="page-title">Comunicacoes por OAB</h1>
          <p className="muted">
            Envie apenas o numero da OAB e um intervalo de disponibilizacao
            (data inicial e final). Usamos os parametros{" "}
            <code>numeroOab</code>, <code>dataDisponibilizacaoInicio</code> e{" "}
            <code>dataDisponibilizacaoFim</code>.
          </p>
        </div>
      </header>

      <form className="form" onSubmit={handleSubmit}>
        <div className="form__group">
          <label htmlFor="oab">Numero da OAB</label>
          <div className="form__row">
            <input
              id="oab"
              name="oab"
              value={oab}
              onChange={(e) => setOab(e.target.value)}
              placeholder="216372"
              inputMode="numeric"
              autoComplete="off"
            />
          </div>
          <p className="hint">Somente os numeros, sem UF ou barras.</p>
        </div>

        <div className="form__group">
          <label>Periodo de disponibilizacao</label>
          <div className="form__row">
            <input
              type="date"
              id="data-inicio"
              name="dataInicio"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <input
              type="date"
              id="data-fim"
              name="dataFim"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
            <button
              className="btn"
              type="submit"
              disabled={loading || !oab || !startDate || !endDate}
            >
              {loading ? "Consultando..." : "Consultar"}
            </button>
          </div>
          <p className="hint">
            Exemplo: 2025-12-01 ate 2025-12-09 (periodo maximo definido pela API).
          </p>
        </div>
      </form>

      {error && <div className="error">{error}</div>}
      {loading && <div className="skeleton">Consultando CNJ...</div>}

      {!loading && payload && (
        <div className="panel">
          <div className="panel__head">
            <div>
              <p className="eyebrow">Retorno</p>
              <h2 className="panel__title">
                {payload?.count ?? payload?.items?.length ?? 0} comunicacao(oes)
              </h2>
              <p className="muted">
                {payload?.message || "Resultados retornados pela comunicaapi.pje.jus.br"}
              </p>
            </div>
          </div>

          {!hasResults && (
            <div className="empty">
              Nenhuma comunicacao encontrada para este numero e periodo.
            </div>
          )}

          {hasResults && (
            <div>
              {payload.items.map((item) => {
                const destinatarios = listNames(item?.destinatarios);
                const advogados = listNames(
                  item?.destinatarioadvogados?.map((d) => d?.advogado)
                );
                const processLabel = maskProcess(
                  item?.numero_processo,
                  item?.numeroprocessocommascara
                );
                const fields = [
                  {
                    label: "Data de disponibilizacao",
                    value:
                      formatDateLabel(item?.data_disponibilizacao) ||
                      formatDateLabel(item?.datadisponibilizacao),
                  },
                  { label: "Tribunal", value: item?.siglaTribunal },
                  { label: "Orgao", value: item?.nomeOrgao },
                  { label: "Tipo", value: item?.tipoComunicacao || item?.tipoDocumento },
                  { label: "Meio", value: item?.meiocompleto || item?.meio },
                  { label: "Processo", value: processLabel },
                  { label: "Destinatarios", value: destinatarios },
                  { label: "Advogados", value: advogados },
                  {
                    label: "Documento",
                    value: item?.link ? (
                      <a href={item.link} target="_blank" rel="noreferrer">
                        Abrir documento
                      </a>
                    ) : null,
                  },
                ].filter((f) => f.value);

                return (
                  <div key={item?.id || item?.numeroComunicacao} className="result-card">
                    <div className="result-card__head">
                      <div>
                        <p className="eyebrow">{item?.siglaTribunal || "Comunicacao"}</p>
                        <h3 className="result-card__title">
                          {processLabel || item?.numeroComunicacao || "Processo"}
                        </h3>
                        {item?.nomeOrgao && <p className="muted">{item.nomeOrgao}</p>}
                      </div>
                      <span className="pill pill--muted">
                        {item?.tipoComunicacao || item?.tipoDocumento || "Comunicacao"}
                      </span>
                    </div>

                    {fields.length > 0 && (
                      <ul className="kv kv--compact">
                        {fields.map((field) => (
                          <li key={field.label} className="kv__row">
                            <div className="kv__key">{field.label}</div>
                            <div className="kv__val">{field.value}</div>
                          </li>
                        ))}
                      </ul>
                    )}

                    {item?.texto && (
                      <details className="json-view">
                        <summary>Texto da comunicacao</summary>
                        <p>{item.texto}</p>
                      </details>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
