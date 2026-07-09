import MarkdownIt from "markdown-it";
import { useMemo, useState } from "react";

const markdownParser = new MarkdownIt({
  html: false,
  linkify: true,
  typographer: true,
});

function isMarkdownFile(file) {
  const name = file?.name?.toLowerCase() || "";
  return name.endsWith(".md") || name.endsWith(".markdown");
}

export default function MarkdownRenderer({ title = "Renderizador de Markdown" }) {
  const [markdownText, setMarkdownText] = useState("");
  const [fileName, setFileName] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const renderedHtml = useMemo(
    () => markdownParser.render(markdownText),
    [markdownText],
  );

  async function handleFileChange(event) {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!isMarkdownFile(file)) {
      setErr("Envie um arquivo Markdown com extensao .md ou .markdown.");
      setMarkdownText("");
      setFileName("");
      event.target.value = "";
      return;
    }

    try {
      setLoading(true);
      setErr("");

      const content = await file.text();
      setMarkdownText(content);
      setFileName(file.name);
    } catch {
      setErr("Nao foi possivel ler o arquivo Markdown.");
      setMarkdownText("");
      setFileName("");
    } finally {
      setLoading(false);
    }
  }

  function handleClear() {
    setMarkdownText("");
    setFileName("");
    setErr("");
  }

  function handlePrint() {
    window.print();
  }

  return (
    <section className="verify markdown-page">
      <header className="verify__header">
        <div>
          <p className="eyebrow">Utilidades</p>
          <h1 className="page-title">{title}</h1>
          <p className="muted">
            Envie um arquivo .md para visualizar o conteudo renderizado em HTML.
          </p>
        </div>
      </header>

      <div className="form markdown-controls">
        <div className="form__group">
          <label htmlFor="markdown-file">Arquivo Markdown</label>
          <input
            id="markdown-file"
            name="markdown-file"
            className="input"
            type="file"
            accept=".md,.markdown,text/markdown,text/plain"
            onChange={handleFileChange}
          />
          <p className="hint">
            HTML escrito dentro do Markdown e tratado como texto por seguranca.
          </p>
        </div>

        <div className="form__row">
          <button
            className="btn"
            type="button"
            onClick={handlePrint}
            disabled={!markdownText || loading}
          >
            Imprimir / salvar PDF
          </button>
          <button
            className="btn btn--ghost"
            type="button"
            onClick={handleClear}
            disabled={!markdownText && !fileName && !err}
          >
            Limpar
          </button>
        </div>
      </div>

      {err && <div className="error">{err}</div>}

      {markdownText && (
        <section className="panel markdown-source-panel">
          <div className="panel__head">
            <div>
              <p className="eyebrow">Texto lido</p>
              <h2 className="panel__title">{fileName || "Markdown"}</h2>
            </div>
          </div>
          <pre className="code markdown-source">{markdownText}</pre>
        </section>
      )}

      <section className="panel markdown-print-area" aria-live="polite">
        <div className="panel__head">
          <div>
            <p className="eyebrow">Preview</p>
            <h2 className="panel__title">
              {markdownText ? fileName || "Markdown renderizado" : "Nenhum arquivo carregado"}
            </h2>
          </div>
        </div>

        {markdownText ? (
          <div
            className="markdown-preview"
            dangerouslySetInnerHTML={{ __html: renderedHtml }}
          />
        ) : (
          <p className="muted">
            O resultado renderizado aparecera aqui depois do upload.
          </p>
        )}
      </section>
    </section>
  );
}
