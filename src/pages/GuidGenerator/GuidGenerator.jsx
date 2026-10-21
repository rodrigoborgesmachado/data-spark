import { EmptyState, ErrorState } from "../../components/Feedback";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import PageHeader from "../../components/PageHeader";
import { useState } from "react";

const STORAGE_KEY = "dataSpark.guid.recent.v1";
const RECENT_LIMIT = 20;

const FORMAT_OPTIONS = {
  uppercase: "MAIÚSCULO",
  noHyphens: "Sem hífens",
  braces: "Com chaves {}",
};

const SEPARATORS = {
  semicolon: { label: "Ponto e vírgula (;)", value: ";" },
  newline: { label: "Quebra de linha", value: "\n" },
  comma: { label: "Vírgula (,)", value: "," },
};

function formatGuid(guid, format) {
  let value = format.noHyphens ? guid.replaceAll("-", "") : guid;
  if (format.uppercase) value = value.toUpperCase();
  return format.braces ? `{${value}}` : value;
}

function readRecent() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(parsed)
      ? parsed.filter((item) => item?.id && typeof item.value === "string").slice(0, RECENT_LIMIT)
      : [];
  } catch {
    return [];
  }
}

function saveRecent(recent) {
  try {
    if (recent.length) localStorage.setItem(STORAGE_KEY, JSON.stringify(recent));
    else localStorage.removeItem(STORAGE_KEY);
  } catch { /* Keep the recent list for this session. */ }
}

export default function GuidGenerator({ title = "Gerador de GUID" }) {
  const [quantity, setQuantity] = useState(1);
  const [format, setFormat] = useState({ uppercase: false, noHyphens: false, braces: false });
  const [separator, setSeparator] = useState("semicolon");
  const [guids, setGuids] = useState([]);
  const [recent, setRecent] = useState(readRecent);
  const [copyError, setCopyError] = useState("");
  const [copiedId, setCopiedId] = useState(null);

  function handleFormatChange(key) {
    setFormat((current) => ({ ...current, [key]: !current[key] }));
  }

  function handleGenerate(event) {
    event.preventDefault();

    const safeQuantity = Math.min(100, Math.max(1, Math.trunc(Number(quantity)) || 1));
    const generated = Array.from({ length: safeQuantity }, () => ({
      id: window.crypto.randomUUID(),
      value: formatGuid(window.crypto.randomUUID(), format),
    }));
    const nextRecent = [...generated].reverse().concat(recent).slice(0, RECENT_LIMIT);

    setQuantity(safeQuantity);
    setGuids(generated);
    setRecent(nextRecent);
    saveRecent(nextRecent);
    setCopiedId(null);
    setCopyError("");
  }

  async function handleCopy(id, value) {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedId(id);
      setCopyError("");
    } catch {
      setCopiedId(null);
      setCopyError("Não foi possível copiar. Selecione o GUID e copie manualmente.");
    }
  }

  function handleClearRecent() {
    setRecent([]);
    saveRecent([]);
  }

  return (
    <section className="verify">
      <PageHeader eyebrow="Utilidades" title={<>{title}</>} description={<>
            Gere GUIDs (UUID v4) no formato desejado e copie um a um ou todos
            de uma vez.
          </>} />

      <Form className="form" onSubmit={handleGenerate}>
        <div className="form__group">
          <label htmlFor="guid-quantity">Quantidade</label>
          <Form.Control
            id="guid-quantity"
            name="guid-quantity"
            className="input"
            type="number"
            min="1"
            max="100"
            value={quantity}
            onChange={(event) => setQuantity(event.target.value)}
          />
        </div>

        <fieldset className="password-options">
          <legend>Formato</legend>
          {Object.entries(FORMAT_OPTIONS).map(([key, label]) => (
            <label key={key} className="password-options__item">
              <Form.Check.Input
                type="checkbox"
                name="guid-format"
                value={key}
                checked={format[key]}
                onChange={() => handleFormatChange(key)}
              />
              {label}
            </label>
          ))}
        </fieldset>

        <div className="form__group">
          <label htmlFor="guid-separator">Separador para copiar todos</label>
          <Form.Select
            id="guid-separator"
            className="input tool-select"
            value={separator}
            onChange={(event) => setSeparator(event.target.value)}
          >
            {Object.entries(SEPARATORS).map(([key, option]) => (
              <option key={key} value={key}>{option.label}</option>
            ))}
          </Form.Select>
        </div>

        <div className="form__row">
          <Button className="btn" type="submit">
            Gerar
          </Button>
        </div>
      </Form>

      {copyError && <ErrorState>{copyError}</ErrorState>}
      <section className="panel" aria-live="polite">
        <div className="panel__head">
          <div>
            <p className="eyebrow">GUIDs gerados</p>
            <h2 className="panel__title">Resultado</h2>
          </div>
          {guids.length > 0 && (
            <Button variant="outline-secondary"
              className="btn btn--ghost"
              type="button"
              onClick={() => handleCopy("all", guids.map((guid) => guid.value).join(SEPARATORS[separator].value))}
            >
              {copiedId === "all" ? "Copiados" : "Copiar todos"}
            </Button>
          )}
        </div>

        {guids.length ? (
          <ul className="password-list">
            {guids.map((guid) => (
              <li key={guid.id} className="password-list__item">
                <strong className="password-list__value">{guid.value}</strong>
                <Button variant="outline-secondary"
                  className="btn btn--ghost"
                  type="button"
                  onClick={() => handleCopy(guid.id, guid.value)}
                >
                  {copiedId === guid.id ? "Copiado" : "Copiar"}
                </Button>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState>Os GUIDs gerados aparecerão aqui.</EmptyState>
        )}
      </section>

      <section className="panel">
        <div className="panel__head">
          <div>
            <p className="eyebrow">Recentes</p>
            <h2 className="panel__title">Últimos {RECENT_LIMIT} GUIDs</h2>
          </div>
          {recent.length > 0 && (
            <Button variant="outline-secondary"
              className="btn btn--ghost"
              type="button"
              onClick={handleClearRecent}
            >
              Limpar
            </Button>
          )}
        </div>

        {recent.length ? (
          <ul className="password-list">
            {recent.map((guid) => (
              <li key={`recent-${guid.id}`} className="password-list__item">
                <strong className="password-list__value">{guid.value}</strong>
                <Button variant="outline-secondary"
                  className="btn btn--ghost"
                  type="button"
                  onClick={() => handleCopy(`recent-${guid.id}`, guid.value)}
                >
                  {copiedId === `recent-${guid.id}` ? "Copiado" : "Copiar"}
                </Button>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState title="Nenhum GUID recente">Os últimos GUIDs gerados ficam salvos neste navegador.</EmptyState>
        )}
      </section>
    </section>
  );
}
