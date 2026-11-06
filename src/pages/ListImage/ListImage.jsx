import { EmptyState, ErrorState, LoadingState } from "../../components/Feedback";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import PageHeader from "../../components/PageHeader";
import { useEffect, useMemo, useState } from "react";
import { getFileName, parseList, renderListImages, toWhatsAppText } from "./listImage";

export default function ListImage({ title = "Lista em imagem" }) {
  const [listTitle, setListTitle] = useState("");
  const [text, setText] = useState("");
  const [columns, setColumns] = useState("1");
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [copied, setCopied] = useState("");

  const entries = useMemo(() => parseList(text), [text]);
  const canShare = useMemo(() => {
    if (!images.length || !navigator.canShare) return false;
    return navigator.canShare({ files: images.map((image) => image.file) });
  }, [images]);

  useEffect(() => () => images.forEach((image) => URL.revokeObjectURL(image.url)), [images]);

  async function handleGenerate(event) {
    event.preventDefault();

    if (!entries.some((entry) => entry.type === "item")) {
      setErr("Informe ao menos um item na lista.");
      setImages([]);
      return;
    }

    try {
      setLoading(true);
      setErr("");
      setCopied("");
      const blobs = await renderListImages(listTitle, entries, Number(columns));
      const fileName = getFileName(listTitle);
      setImages(blobs.map((blob, index) => {
        const name = blobs.length > 1 ? `${fileName}-${index + 1}.png` : `${fileName}.png`;
        return { name, url: URL.createObjectURL(blob), file: new File([blob], name, { type: "image/png" }) };
      }));
    } catch {
      setErr("Não foi possível gerar a imagem.");
      setImages([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleCopyImage(image) {
    try {
      await navigator.clipboard.write([new ClipboardItem({ "image/png": image.file })]);
      setCopied(image.name);
      setErr("");
    } catch {
      setCopied("");
      setErr("Não foi possível copiar a imagem neste navegador. Use o botão Baixar PNG.");
    }
  }

  async function handleCopyText() {
    try {
      await navigator.clipboard.writeText(toWhatsAppText(listTitle, entries));
      setCopied("text");
      setErr("");
    } catch {
      setCopied("");
      setErr("Não foi possível copiar o texto.");
    }
  }

  function handleDownload(image) {
    const link = document.createElement("a");
    link.href = image.url;
    link.download = image.name;
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  async function handleShare() {
    try {
      await navigator.share({ files: images.map((image) => image.file), title: listTitle || "Lista" });
    } catch (error) {
      if (error?.name !== "AbortError") setErr("Não foi possível compartilhar a imagem.");
    }
  }

  return (
    <section className="verify">
      <PageHeader eyebrow="Utilidades" title={<>{title}</>} description={<>
            Digite uma lista, como a de compras, e gere uma imagem fácil de ver
            no celular para mandar pelo WhatsApp.
          </>} />

      <Form className="form" onSubmit={handleGenerate}>
        <div className="form__group">
          <label htmlFor="list-title">Título</label>
          <Form.Control
            id="list-title"
            name="list-title"
            className="input"
            type="text"
            placeholder="Mercado – 06/11"
            value={listTitle}
            onChange={(event) => setListTitle(event.target.value)}
            autoComplete="off"
          />
        </div>

        <div className="form__group">
          <label htmlFor="list-items">Itens</label>
          <Form.Control
            id="list-items"
            name="list-items"
            as="textarea"
            className="input"
            placeholder={"Hortifruti:\nBanana\nTomate\nLimpeza:\nDetergente"}
            value={text}
            onChange={(event) => setText(event.target.value)}
          />
          <p className="hint">
            Um item por linha. Linhas terminadas em ":" viram títulos de seção.
          </p>
        </div>

        <div className="form__group">
          <label htmlFor="list-columns">Layout</label>
          <Form.Select
            id="list-columns"
            className="input tool-select"
            value={columns}
            onChange={(event) => setColumns(event.target.value)}
          >
            <option value="1">1 coluna</option>
            <option value="2">2 colunas</option>
          </Form.Select>
          <p className="hint">
            Listas longas são divididas em várias imagens para continuarem legíveis.
          </p>
        </div>

        <div className="form__row">
          <Button className="btn" type="submit" disabled={loading}>
            {loading ? "Gerando..." : "Gerar imagem"}
          </Button>
          <Button variant="outline-secondary"
            className="btn btn--ghost"
            type="button"
            onClick={handleCopyText}
            disabled={!entries.length}
          >
            {copied === "text" ? "Texto copiado" : "Copiar como texto"}
          </Button>
        </div>
      </Form>

      {loading && <LoadingState>Gerando imagem…</LoadingState>}
      {err && <ErrorState>{err}</ErrorState>}

      {images.length > 0 && (
        <section className="panel" aria-live="polite">
          <div className="panel__head">
            <div>
              <p className="eyebrow">Preview</p>
              <h2 className="panel__title">{images.length > 1 ? `${images.length} imagens geradas` : "Imagem gerada"}</h2>
            </div>
            {canShare && (
              <Button variant="outline-secondary" className="btn btn--ghost" type="button" onClick={handleShare}>
                Compartilhar
              </Button>
            )}
          </div>

          <div className="list-image-grid">
            {images.map((image, index) => (
              <div key={image.url} className="list-image-item">
                <div className="qr-preview">
                  <img src={image.url} alt={`Imagem ${index + 1} da lista`} />
                </div>
                <div className="form__row">
                  <Button variant="outline-secondary" className="btn btn--ghost" type="button" onClick={() => handleCopyImage(image)}>
                    {copied === image.name ? "Imagem copiada" : "Copiar imagem"}
                  </Button>
                  <Button variant="outline-secondary" className="btn btn--ghost" type="button" onClick={() => handleDownload(image)}>
                    Baixar PNG
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
      {!loading && !err && !images.length && <EmptyState>Digite os itens da lista para gerar a imagem.</EmptyState>}
    </section>
  );
}
