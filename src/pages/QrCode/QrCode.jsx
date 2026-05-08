import { useMemo, useState } from "react";
import QRCode from "qrcode";

const PREVIEW_QR_WIDTH = 320;
const DOWNLOAD_QR_WIDTH = 2048;

function normalizeUrl(rawValue) {
  const value = String(rawValue ?? "").trim();
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value;
  return `https://${value}`;
}

function parseHttpUrl(url) {
  try {
    const parsed = new URL(url);
    if (!["http:", "https:"].includes(parsed.protocol)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function getFileNameFromUrl(value) {
  const parsed = parseHttpUrl(value);
  if (!parsed) return "qr-code";
  return parsed.hostname.replace(/[^a-z0-9-]+/gi, "-").replace(/-+/g, "-");
}

export default function QrCode({ title = "Gerador de QR Code" }) {
  const [urlInput, setUrlInput] = useState("");
  const [resolvedUrl, setResolvedUrl] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [downloadDataUrl, setDownloadDataUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const canDownload = useMemo(() => Boolean(downloadDataUrl), [downloadDataUrl]);

  async function handleGenerate(event) {
    event.preventDefault();

    const normalized = normalizeUrl(urlInput);
    const parsed = parseHttpUrl(normalized);

    if (!parsed) {
      setErr("Informe uma URL valida. Exemplo: https://site.com");
      setQrDataUrl("");
      setDownloadDataUrl("");
      setResolvedUrl("");
      return;
    }

    try {
      setLoading(true);
      setErr("");

      const value = parsed.toString();
      const qrOptions = {
        errorCorrectionLevel: "H",
        type: "image/png",
        margin: 2,
        color: {
          dark: "#101828",
          light: "#FFFFFF",
        },
      };
      const [previewDataUrl, downloadQrDataUrl] = await Promise.all([
        QRCode.toDataURL(value, {
          ...qrOptions,
          width: PREVIEW_QR_WIDTH,
        }),
        QRCode.toDataURL(value, {
          ...qrOptions,
          width: DOWNLOAD_QR_WIDTH,
        }),
      ]);

      setQrDataUrl(previewDataUrl);
      setDownloadDataUrl(downloadQrDataUrl);
      setResolvedUrl(value);
    } catch {
      setErr("Nao foi possivel gerar o QR code.");
      setQrDataUrl("");
      setDownloadDataUrl("");
      setResolvedUrl("");
    } finally {
      setLoading(false);
    }
  }

  function handleDownload() {
    if (!downloadDataUrl) return;

    const link = document.createElement("a");
    link.href = downloadDataUrl;
    link.download = `${getFileNameFromUrl(resolvedUrl)}-qr.png`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  return (
    <section className="verify">
      <header className="verify__header">
        <div>
          <p className="eyebrow">Utilidades</p>
          <h1 className="page-title">{title}</h1>
          <p className="muted">
            Gere um QR code para qualquer URL e baixe a imagem em PNG.
          </p>
        </div>
      </header>

      <form className="form" onSubmit={handleGenerate}>
        <div className="form__group">
          <label htmlFor="qr-url">URL</label>
          <input
            id="qr-url"
            name="qr-url"
            className="input"
            type="text"
            placeholder="https://site.com"
            value={urlInput}
            onChange={(event) => setUrlInput(event.target.value)}
            autoComplete="off"
          />
          <p className="hint">
            Se voce nao informar protocolo, usamos https:// automaticamente.
          </p>
        </div>

        <div className="form__row">
          <button className="btn" type="submit" disabled={loading}>
            {loading ? "Gerando..." : "Gerar QR code"}
          </button>
          <button
            className="btn btn--ghost"
            type="button"
            onClick={handleDownload}
            disabled={!canDownload}
          >
            Baixar PNG
          </button>
        </div>
      </form>

      {err && <div className="error">{err}</div>}

      {qrDataUrl && (
        <section className="panel qr-panel" aria-live="polite">
          <div>
            <p className="eyebrow">Preview</p>
            <h2 className="panel__title">QR Code gerado</h2>
            <p className="muted qr-meta">{resolvedUrl}</p>
          </div>

          <div className="qr-preview">
            <img src={qrDataUrl} alt={`QR code da URL ${resolvedUrl}`} />
          </div>
        </section>
      )}
    </section>
  );
}
