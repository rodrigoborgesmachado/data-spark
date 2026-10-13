import { EmptyState, ErrorState, LoadingState } from "../../components/Feedback";
import { ROUTES } from "../../routes/config";
import Button from "react-bootstrap/Button";
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
  title = "Informacoes",
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
      el.className = "copy-toast";
      el.setAttribute("role", "status");
      el.textContent = `${label} copiado!`;
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 1200);
    } catch {
      /* ignore clipboard errors */
    }
  };

  return (
    <section className="random">
      <header className="random__header">
        <div><p className="eyebrow">Geradores de dados</p><h1 className="page-title">{title}</h1><p className="muted">{ROUTES.find((route) => route.apiPath === path)?.description}</p></div>
        <div className="actions">
          <Button className="btn" onClick={load} disabled={loading}>
            {loading ? "Gerando..." : "Gerar novamente"}
          </Button>
          {entity && (
            <Button variant="outline-secondary"
              className="btn btn--ghost"
              onClick={() => copy("JSON", JSON.stringify(entity, null, 2))}
            >
              Copiar JSON
            </Button>
          )}
        </div>
      </header>

      {err && <ErrorState>{err}</ErrorState>}
      {loading && <LoadingState>Carregando...</LoadingState>}

      {!loading && !err && pairs.length === 0 && <EmptyState title="Nenhum dado retornado">Gere novamente para tentar obter novos dados.</EmptyState>}

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
                <Button
                  variant="outline-secondary"
                  className="icon-btn"
                  aria-label={`Copiar ${formatKey(key)}`}
                  title={`Copiar ${formatKey(key)}`}
                  onClick={() => copy(formatKey(key), value)}
                >
                  Copiar
                </Button>
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
