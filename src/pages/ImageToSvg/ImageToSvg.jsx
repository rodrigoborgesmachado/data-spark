import { useEffect, useRef, useState } from "react";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import PageHeader from "../../components/PageHeader";
import { EmptyState, ErrorState, LoadingState } from "../../components/Feedback";
import { formatSize, FORMATS, getDimensions, validateImage } from "../ImageCompressor/imageUtils";
import { PRESETS, readImageData, svgName, traceImage } from "./svgUtils";

export default function ImageToSvg({ title = "Imagem para SVG" }) {
  const [source, setSource] = useState(null);
  const [result, setResult] = useState(null);
  const [preset, setPreset] = useState(PRESETS[1]);
  const [colors, setColors] = useState(PRESETS[1].colors);
  const [resolution, setResolution] = useState("800");
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef(null);
  const operationRef = useRef(null);
  const urlsRef = useRef({ source: null, result: null });

  useEffect(() => () => {
    operationRef.current?.abort();
    Object.values(urlsRef.current).forEach((url) => { if (url) URL.revokeObjectURL(url); });
  }, []);

  function clearResult() {
    if (urlsRef.current.result) URL.revokeObjectURL(urlsRef.current.result);
    urlsRef.current.result = null;
    setResult(null);
    setError("");
    setCopied(false);
  }

  async function selectFiles(files) {
    if (!files.length) return;
    operationRef.current?.abort();
    const controller = new AbortController();
    operationRef.current = controller;
    setDragging(false);
    clearResult();
    if (urlsRef.current.source) URL.revokeObjectURL(urlsRef.current.source);
    urlsRef.current.source = null;
    setSource(null);
    setBusy("reading");
    try {
      if (files.length !== 1) throw new Error("Selecione apenas uma imagem por vez.");
      const file = await validateImage(files[0]);
      if (controller.signal.aborted) return;
      const dimensions = await getDimensions(file, controller.signal);
      if (controller.signal.aborted) return;
      const url = URL.createObjectURL(file);
      urlsRef.current.source = url;
      setSource({ file, url, ...dimensions });
    } catch (err) {
      if (!controller.signal.aborted) setError(err.message);
    } finally {
      if (!controller.signal.aborted) setBusy("");
    }
  }

  async function convert(event) {
    event.preventDefault();
    if (!source || busy) return;
    clearResult();
    setBusy("converting");
    const controller = new AbortController();
    operationRef.current = controller;
    try {
      const image = await readImageData(source.file, Number(resolution));
      if (controller.signal.aborted) return;
      const svg = await traceImage(image, { ...preset.options, numberofcolors: colors, scale: source.width / image.width }, controller.signal);
      const file = new Blob([svg], { type: "image/svg+xml" });
      const url = URL.createObjectURL(file);
      urlsRef.current.result = url;
      setResult({ svg, file, url, width: image.width, height: image.height });
    } catch (err) {
      if (!controller.signal.aborted) setError(err?.message?.startsWith("Não foi possível converter") ? err.message : "Não foi possível converter a imagem. Tente uma resolução menor ou menos cores.");
    } finally {
      if (!controller.signal.aborted) setBusy("");
    }
  }

  async function copySvg() {
    try {
      await navigator.clipboard.writeText(result.svg);
      setCopied(true);
    } catch {
      setError("Não foi possível copiar o código SVG.");
    }
  }

  return <section className="verify image-compressor">
    <PageHeader eyebrow="Utilidades" title={title} description="Converta imagens em SVG vetorizado e baixe o resultado. Todo o processamento acontece no seu navegador, sem enviar ou armazenar imagens em servidores." />

    <div className={`panel image-compressor__dropzone${dragging ? " is-dragging" : ""}`}
      onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
      onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setDragging(false); }}
      onDrop={(event) => { event.preventDefault(); selectFiles(event.dataTransfer.files); }}>
      <i className="bi bi-cloud-arrow-up image-compressor__upload-icon" aria-hidden="true" />
      <div><h2 className="panel__title">Arraste uma imagem para cá</h2><p className="muted" id="svg-file-help">JPEG, PNG ou WebP • Uma imagem por vez • Até 50 MB</p></div>
      <Form.Control ref={inputRef} id="svg-file" className="visually-hidden" type="file" accept="image/jpeg,image/png,image/webp" tabIndex={-1} aria-label="Selecionar imagem" aria-describedby="svg-file-help"
        onChange={(event) => { selectFiles(event.target.files); event.target.value = ""; }} />
      <Button type="button" variant="outline-secondary" onClick={() => inputRef.current.click()}>{source ? "Selecionar outra imagem" : "Selecionar imagem"}</Button>
    </div>

    {busy === "reading" && <LoadingState>Lendo imagem…</LoadingState>}
    {error && <ErrorState>{error}</ErrorState>}

    {source && <>
      <div className="panel">
        <h2 className="panel__title">Imagem original</h2>
        <dl className="image-compressor__metadata">
          {[["Nome", source.file.name], ["Tamanho", formatSize(source.file.size)], ["Formato", FORMATS[source.file.type]], ["Resolução", `${source.width} × ${source.height} px`]].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
        </dl>
      </div>

      <Form className="form" onSubmit={convert}>
        <h2 className="panel__title">Configurar conversão</h2>
        <fieldset disabled={Boolean(busy)} className="image-compressor__settings">
          <legend className="visually-hidden">Opções de conversão</legend>
          <div className="form__group">
            <span id="svg-presets">Nível de detalhe</span>
            <div className="form__row" role="group" aria-labelledby="svg-presets">
              {PRESETS.map((item) => <Button key={item.label} type="button" variant={preset === item ? "primary" : "outline-secondary"} aria-pressed={preset === item} onClick={() => { setPreset(item); setColors(item.colors); clearResult(); }}>{item.label}</Button>)}
            </div>
          </div>
          <div className="form__group">
            <Form.Label htmlFor="svg-colors">Cores: {colors}</Form.Label>
            <Form.Range id="svg-colors" min={2} max={64} step={1} value={colors} onChange={(event) => { setColors(Number(event.target.value)); clearResult(); }} aria-describedby="svg-colors-help" />
            <p className="hint" id="svg-colors-help">Menos cores geram arquivos menores e funcionam melhor para logotipos e ícones. Fotos precisam de mais cores e geram arquivos maiores.</p>
          </div>
          <div className="form__group">
            <Form.Label htmlFor="svg-resolution">Resolução de processamento</Form.Label>
            <Form.Select id="svg-resolution" value={resolution} onChange={(event) => { setResolution(event.target.value); clearResult(); }}>
              {[400, 800, 1200, 1600].map((size) => <option key={size} value={size}>{size} px no maior lado</option>)}
            </Form.Select>
            <p className="hint">Resoluções maiores preservam mais detalhes, mas demoram mais. O SVG mantém o tamanho da imagem original.</p>
          </div>
          <div className="form__row"><Button type="submit">{busy === "converting" ? "Convertendo…" : "Converter para SVG"}</Button></div>
        </fieldset>
        {busy === "converting" && <div className="form__row"><Button type="button" variant="outline-secondary" onClick={() => { operationRef.current?.abort(); setBusy(""); }}>Cancelar</Button></div>}
      </Form>

      {busy === "converting" && <div className="panel"><LoadingState>Convertendo imagem…</LoadingState></div>}

      {result && <section className="panel" aria-labelledby="svg-result" aria-live="polite">
        <h2 className="panel__title" id="svg-result">Resultado da conversão</h2>
        <div className="stats-grid">
          {[["Tamanho original", formatSize(source.file.size)], ["Tamanho do SVG", formatSize(result.file.size)], ["Processado em", `${result.width} × ${result.height} px`]].map(([label, value]) => <div className="stat-card" key={label}><div className="stat-card__value">{value}</div><div className="stat-card__label">{label}</div></div>)}
        </div>
        <div className="form__row">
          <Button as="a" href={result.url} download={svgName(source.file.name)}><i className="bi bi-download" aria-hidden="true" /> Baixar SVG</Button>
          <Button type="button" variant="outline-secondary" onClick={copySvg}><i className="bi bi-clipboard" aria-hidden="true" /> {copied ? "Código copiado" : "Copiar código SVG"}</Button>
        </div>
      </section>}

      <div className="panel-grid">
        <section className="panel"><h2 className="panel__title">Prévia original</h2><div className="image-compressor__preview"><img src={source.url} alt="Imagem original selecionada" /></div></section>
        <section className="panel"><h2 className="panel__title">Prévia do SVG</h2>{result ? <div className="image-compressor__preview"><img src={result.url} alt="Resultado da conversão em SVG" /></div> : <EmptyState>Converta a imagem para comparar o resultado.</EmptyState>}</section>
      </div>
    </>}
    {!source && !busy && !error && <EmptyState title="Escolha sua imagem">Selecione ou arraste uma imagem para configurar a conversão.</EmptyState>}
  </section>;
}
