import { useEffect, useState, useMemo } from "react";
import { getFirstObject } from "../../services/api";

/**
 * Reusable dynamic page:
 * - path: API path (e.g. "/api/ForDevPublic/person/random")
 * - params: query params (e.g. { qt: 1 })
 * - title: page title
 */
export default function RandomInfoPage({
  path = "/api/ForDevPublic/person/random",
  params = { qt: 1 },
  title = "Informações",
}) {
  const [entity, setEntity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  async function load() {
    try {
      setErr("");
      setLoading(true);
      const obj = await getFirstObject(path, params);
      setEntity(obj ?? {});
    } catch (e) {
      setErr(e.message || "Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, JSON.stringify(params)]);

  // Pretty label from key: "dataNascimento" -> "Data Nascimento", "cpf" -> "CPF"
  const formatKey = (k) => {
    if (!k) return "";
    const specials = new Set(["id", "cpf", "rg", "cep", "cnpj", "uf"]);
    if (specials.has(k.toLowerCase())) return k.toUpperCase();
    return k
      .replaceAll("_", " ")
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      .replace(/\s+/g, " ")
      .replace(/^./, (s) => s.toUpperCase());
  };

  const pairs = useMemo(() => {
    if (!entity || typeof entity !== "object") return [];
    return Object.entries(entity);
  }, [entity]);

  const copy = async (label, value) => {
    try {
      await navigator.clipboard.writeText(String(value ?? ""));
      const el = document.createElement("div");
      el.className = "toast";
      el.textContent = `${label} copiado!`;
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 1200);
    } catch {}
  };

  return (
    <section className="random">
      <header className="random__header">
        <h1 className="page-title">{title}</h1>
        <div className="actions">
          <button className="btn" onClick={load} disabled={loading}>
            {loading ? "Gerando..." : "Gerar novamente"}
          </button>
          {entity && (
            <button
              className="btn btn--ghost"
              onClick={() => copy("JSON", JSON.stringify(entity, null, 2))}
            >
              Copiar JSON
            </button>
          )}
        </div>
      </header>

      {err && <div className="error">{err}</div>}
      {loading && <div className="skeleton">Carregando…</div>}

      {!loading && entity && pairs.length > 0 && (
        <>
          <ul className="kv">
            {pairs.map(([key, value]) => (
              <li key={key} className="kv__row">
                <div className="kv__key">{formatKey(key)}</div>
                <div className="kv__val">
                  {typeof value === "object"
                    ? JSON.stringify(value)
                    : String(value ?? "")}
                </div>
                <button
                  className="icon-btn"
                  aria-label={`Copiar ${formatKey(key)}`}
                  title={`Copiar ${formatKey(key)}`}
                  onClick={() => copy(formatKey(key), value)}
                >
                  📋
                </button>
              </li>
            ))}
          </ul>

          <details className="json-view">
            <summary>JSON</summary>
            <pre className="code">{JSON.stringify(entity, null, 2)}</pre>
          </details>
        </>
      )}
    </section>
  );
}
