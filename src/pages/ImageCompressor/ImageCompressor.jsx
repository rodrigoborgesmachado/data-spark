import { useEffect, useRef, useState } from "react";
import Alert from "react-bootstrap/Alert";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import ProgressBar from "react-bootstrap/ProgressBar";
import imageCompression from "browser-image-compression";
import compressionLibraryUrl from "browser-image-compression/dist/browser-image-compression.js?url";
import PageHeader from "../../components/PageHeader";
import { EmptyState, ErrorState, LoadingState } from "../../components/Feedback";
import { downloadName, formatSize, FORMATS, getDimensions, validateImage } from "./imageUtils";

const PRESETS = [
  { label: "Leve", quality: 90 },
  { label: "Equilibrada", quality: 75 },
  { label: "Máxima", quality: 50 },
];

export default function ImageCompressor({ title = "Compressor de Imagens" }) {
  const [source, setSource] = useState(null);
  const [result, setResult] = useState(null);
  const [quality, setQuality] = useState(75);
  const [resolution, setResolution] = useState("");
  const [output, setOutput] = useState("original");
  const [busy, setBusy] = useState("");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
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

  async function compress(event) {
    event.preventDefault();
    if (!source || busy) return;
    clearResult();
    setBusy("compressing");
    setProgress(0);
    const controller = new AbortController();
    operationRef.current = controller;
    try {
      const type = output === "original" ? source.file.type : output;
      const file = await imageCompression(source.file, {
        useWebWorker: true,
        libURL: new URL(compressionLibraryUrl, window.location.href).href,
        signal: controller.signal,
        initialQuality: quality / 100,
        maxIteration: 10,
        maxSizeMB: Number.POSITIVE_INFINITY,
        maxWidthOrHeight: resolution ? Number(resolution) : undefined,
        alwaysKeepResolution: !resolution,
        fileType: type,
        preserveExif: false,
        onProgress: (value) => { if (!controller.signal.aborted) setProgress(Math.round(value)); },
      });
      if (controller.signal.aborted) return;
      if (!file.size || file.type !== type) throw new Error("O navegador não conseguiu gerar o formato escolhido. Tente outro formato de saída.");
      const dimensions = await getDimensions(file, controller.signal);
      if (controller.signal.aborted) return;
      const url = URL.createObjectURL(file);
      urlsRef.current.result = url;
      setResult({ file, url, ...dimensions });
    } catch (err) {
      if (!controller.signal.aborted) setError(err?.message?.startsWith("O navegador não conseguiu") ? err.message : "Não foi possível comprimir a imagem. Tente uma resolução menor ou outro formato de saída.");
    } finally {
      if (!controller.signal.aborted) setBusy("");
    }
  }

  const outputType = output === "original" ? source?.file.type : output;
  const reduction = result ? (1 - result.file.size / source.file.size) * 100 : 0;

  return <section className="verify image-compressor">
    <PageHeader eyebrow="Utilidades" title={title} description="Reduza o tamanho das suas imagens e baixe o resultado. Todo o processamento acontece no seu navegador, sem enviar ou armazenar imagens em servidores." />

    <div className={`panel image-compressor__dropzone${dragging ? " is-dragging" : ""}`}
      onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
      onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setDragging(false); }}
      onDrop={(event) => { event.preventDefault(); selectFiles(event.dataTransfer.files); }}>
      <i className="bi bi-cloud-arrow-up image-compressor__upload-icon" aria-hidden="true" />
      <div><h2 className="panel__title">Arraste uma imagem para cá</h2><p className="muted" id="image-file-help">JPEG, PNG ou WebP • Uma imagem por vez • Até 50 MB</p></div>
      <Form.Control ref={inputRef} id="image-file" className="visually-hidden" type="file" accept="image/jpeg,image/png,image/webp" tabIndex={-1} aria-label="Selecionar imagem" aria-describedby="image-file-help"
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

      <Form className="form" onSubmit={compress}>
        <h2 className="panel__title">Configurar compressão</h2>
        <fieldset disabled={Boolean(busy)} className="image-compressor__settings">
          <legend className="visually-hidden">Opções de compressão</legend>
          <div className="form__group">
            <span id="compression-presets">Nível de compressão</span>
            <div className="form__row" role="group" aria-labelledby="compression-presets">
              {PRESETS.map((preset) => <Button key={preset.label} type="button" variant={quality === preset.quality ? "primary" : "outline-secondary"} aria-pressed={quality === preset.quality} onClick={() => { setQuality(preset.quality); clearResult(); }}>{preset.label}</Button>)}
            </div>
          </div>
          <div className="form__group">
            <Form.Label htmlFor="image-quality">Qualidade: {quality}%</Form.Label>
            <Form.Range id="image-quality" min={10} max={100} step={1} value={quality} onChange={(event) => { setQuality(Number(event.target.value)); clearResult(); }} aria-describedby="image-quality-help" />
            <p className="hint" id="image-quality-help">Os níveis começam em 90%, 75% e 50%. A compressão pode ajustar a qualidade para tentar reduzir o arquivo.</p>
          </div>
          <div className="form__grid">
            <div className="form__group">
              <Form.Label htmlFor="image-resolution">Resolução máxima</Form.Label>
              <Form.Select id="image-resolution" value={resolution} onChange={(event) => { setResolution(event.target.value); clearResult(); }}>
                <option value="">Manter resolução original</option>
                {[3840, 2560, 1920, 1280, 800].map((size) => <option key={size} value={size}>{size} px no maior lado</option>)}
              </Form.Select>
              <p className="hint">Mantém a proporção e não amplia imagens menores.</p>
            </div>
            <div className="form__group">
              <Form.Label htmlFor="image-format">Formato de saída</Form.Label>
              <Form.Select id="image-format" value={output} onChange={(event) => { setOutput(event.target.value); clearResult(); }}>
                <option value="original">Original{source ? ` (${FORMATS[source.file.type]})` : ""}</option>
                <option value="image/jpeg">JPEG</option><option value="image/webp">WebP</option>
              </Form.Select>
            </div>
          </div>
          {outputType === "image/png" && <p className="hint">PNG preserva a transparência, mas a qualidade pode ter pouco efeito no tamanho. Para fotos, experimente JPEG ou WebP.</p>}
          {outputType === "image/jpeg" && <p className="hint">JPEG não preserva transparência; áreas transparentes recebem fundo branco.</p>}
          <p className="hint">Metadados EXIF não são preservados. Imagens muito grandes podem ser limitadas pela capacidade do navegador.</p>
          <div className="form__row"><Button type="submit">{busy === "compressing" ? "Comprimindo…" : "Comprimir imagem"}</Button></div>
        </fieldset>
      </Form>

      {busy === "compressing" && <div className="panel"><LoadingState>Comprimindo imagem… {progress}%</LoadingState><ProgressBar now={progress} label={`${progress}%`} aria-label="Progresso da compressão" /></div>}

      {result && <section className="panel" aria-labelledby="compression-result" aria-live="polite">
        <h2 className="panel__title" id="compression-result">Resultado da compressão</h2>
        <div className="stats-grid">
          {[["Tamanho original", formatSize(source.file.size)], ["Tamanho final", formatSize(result.file.size)], ["Redução", `${Math.max(0, reduction).toLocaleString("pt-BR", { maximumFractionDigits: 2 })}%`]].map(([label, value]) => <div className="stat-card" key={label}><div className="stat-card__value">{value}</div><div className="stat-card__label">{label}</div></div>)}
        </div>
        {reduction <= 0 && <Alert variant="warning">A compressão não reduziu o tamanho do arquivo. A imagem pode já estar otimizada. Tente reduzir a qualidade, a resolução ou usar outro formato.</Alert>}
        {!resolution && (result.width !== source.width || result.height !== source.height) && <Alert variant="warning">O navegador precisou limitar a resolução para {result.width} × {result.height} px. Confira a prévia antes de baixar.</Alert>}
        <div className="form__row"><Button as="a" href={result.url} download={downloadName(source.file.name, result.file.type)}><i className="bi bi-download" aria-hidden="true" /> Baixar imagem comprimida</Button></div>
      </section>}

      <div className="panel-grid">
        <section className="panel"><h2 className="panel__title">Prévia original</h2><div className="image-compressor__preview"><img src={source.url} alt="Imagem original selecionada" /></div></section>
        <section className="panel"><h2 className="panel__title">Prévia comprimida</h2>{result ? <><div className="image-compressor__preview"><img src={result.url} alt="Resultado da compressão" /></div><p className="hint">{FORMATS[result.file.type]} • {result.width} × {result.height} px • {formatSize(result.file.size)}</p></> : <EmptyState>Comprima a imagem para comparar o resultado.</EmptyState>}</section>
      </div>
    </>}
    {!source && !busy && !error && <EmptyState title="Escolha sua imagem">Selecione ou arraste uma imagem para configurar a compressão.</EmptyState>}
  </section>;
}
