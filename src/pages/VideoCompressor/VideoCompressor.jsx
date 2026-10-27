import { useEffect, useRef, useState } from "react";
import Alert from "react-bootstrap/Alert";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import ProgressBar from "react-bootstrap/ProgressBar";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import coreURL from "@ffmpeg/core?url";
import wasmURL from "@ffmpeg/core/wasm?url";
import PageHeader from "../../components/PageHeader";
import { EmptyState, ErrorState, LoadingState } from "../../components/Feedback";
import { formatSize } from "../ImageCompressor/imageUtils";
import { buildArgs, downloadName, EXTENSIONS, formatDuration, getExtension, getMetadata, QUALITIES, RESOLUTIONS, validateVideo } from "./videoUtils";

export default function VideoCompressor({ title = "Compressor de Vídeos" }) {
  const [source, setSource] = useState(null);
  const [result, setResult] = useState(null);
  const [quality, setQuality] = useState("media");
  const [resolution, setResolution] = useState("");
  const [busy, setBusy] = useState("");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef(null);
  const ffmpegRef = useRef(null);
  const cancelledRef = useRef(false);
  const urlsRef = useRef({ source: null, result: null });

  useEffect(() => () => {
    ffmpegRef.current?.terminate();
    Object.values(urlsRef.current).forEach((url) => { if (url) URL.revokeObjectURL(url); });
  }, []);

  function clearResult() {
    if (urlsRef.current.result) URL.revokeObjectURL(urlsRef.current.result);
    urlsRef.current.result = null;
    setResult(null);
    setError("");
  }

  function discardFFmpeg() {
    ffmpegRef.current?.terminate();
    ffmpegRef.current = null;
  }

  async function selectFiles(files) {
    if (!files.length || busy) return;
    setDragging(false);
    clearResult();
    if (urlsRef.current.source) URL.revokeObjectURL(urlsRef.current.source);
    urlsRef.current.source = null;
    setSource(null);
    setBusy("reading");
    try {
      if (files.length !== 1) throw new Error("Selecione apenas um vídeo por vez.");
      const file = validateVideo(files[0]);
      const url = URL.createObjectURL(file);
      urlsRef.current.source = url;
      setSource({ file, url, ...(await getMetadata(url)) });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy("");
    }
  }

  async function loadFFmpeg() {
    if (ffmpegRef.current) return ffmpegRef.current;
    const ffmpeg = new FFmpeg();
    ffmpegRef.current = ffmpeg;
    ffmpeg.on("progress", ({ progress: value }) => setProgress(Math.min(100, Math.max(0, Math.round(value * 100)))));
    await ffmpeg.load({ coreURL, wasmURL });
    return ffmpeg;
  }

  async function compress(event) {
    event.preventDefault();
    if (!source || busy) return;
    clearResult();
    setProgress(0);
    setBusy("loading");
    cancelledRef.current = false;
    const extension = getExtension(source.file.name);
    const input = `entrada${extension ? `.${extension}` : ""}`;
    const output = "saida.mp4";
    let ffmpeg = null;
    let loaded = false;
    try {
      ffmpeg = await loadFFmpeg();
      loaded = true;
      setBusy("compressing");
      await ffmpeg.writeFile(input, new Uint8Array(await source.file.arrayBuffer()));
      const code = await ffmpeg.exec(buildArgs(input, output, quality, resolution));
      if (code !== 0) throw new Error("exec");
      const data = await ffmpeg.readFile(output);
      if (!data.length) throw new Error("exec");
      const file = new File([data], downloadName(source.file.name), { type: "video/mp4" });
      const url = URL.createObjectURL(file);
      urlsRef.current.result = url;
      setResult({ file, url, ...(await getMetadata(url)) });
      await Promise.allSettled([ffmpeg.deleteFile(input), ffmpeg.deleteFile(output)]);
    } catch {
      if (cancelledRef.current) return;
      discardFFmpeg();
      setError(loaded
        ? "Não foi possível comprimir o vídeo. O formato pode ser incompatível ou o arquivo pode exceder a memória disponível no navegador. Tente uma resolução menor ou outro arquivo."
        : "Não foi possível carregar o compressor. Verifique se o seu navegador oferece suporte a WebAssembly e tente novamente.");
    } finally {
      setBusy("");
    }
  }

  function cancel() {
    cancelledRef.current = true;
    discardFFmpeg();
  }

  const reduction = result ? (1 - result.file.size / source.file.size) * 100 : 0;
  const working = busy === "loading" || busy === "compressing";

  return <section className="verify image-compressor">
    <PageHeader eyebrow="Utilidades" title={title} description="Reduza o tamanho dos seus vídeos e baixe o resultado. Todo o processamento acontece no seu navegador, sem enviar ou armazenar vídeos em servidores." />

    <div className={`panel image-compressor__dropzone${dragging ? " is-dragging" : ""}`}
      onDragOver={(event) => { event.preventDefault(); if (!busy) setDragging(true); }}
      onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setDragging(false); }}
      onDrop={(event) => { event.preventDefault(); selectFiles(event.dataTransfer.files); }}>
      <i className="bi bi-cloud-arrow-up image-compressor__upload-icon" aria-hidden="true" />
      <div><h2 className="panel__title">Arraste um vídeo para cá</h2><p className="muted" id="video-file-help">MP4, MOV, WebM, MKV, AVI e outros • Um vídeo por vez • Até 300 MB</p></div>
      <Form.Control ref={inputRef} id="video-file" className="visually-hidden" type="file" accept={`video/*,${EXTENSIONS.map((item) => `.${item}`).join(",")}`} tabIndex={-1} aria-label="Selecionar vídeo" aria-describedby="video-file-help"
        onChange={(event) => { selectFiles(event.target.files); event.target.value = ""; }} />
      <Button type="button" variant="outline-secondary" disabled={Boolean(busy)} onClick={() => inputRef.current.click()}>{source ? "Selecionar outro vídeo" : "Selecionar vídeo"}</Button>
    </div>

    {busy === "reading" && <LoadingState>Lendo vídeo…</LoadingState>}
    {error && <ErrorState>{error}</ErrorState>}

    {source && <>
      <div className="panel">
        <h2 className="panel__title">Vídeo original</h2>
        <dl className="image-compressor__metadata">
          {[["Nome", source.file.name], ["Tamanho", formatSize(source.file.size)], ["Formato", getExtension(source.file.name).toUpperCase() || "-"], ["Resolução", source.width ? `${source.width} × ${source.height} px` : "-"], ["Duração", formatDuration(source.duration)]].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
        </dl>
      </div>

      <Form className="form" onSubmit={compress}>
        <h2 className="panel__title">Configurar compressão</h2>
        <fieldset disabled={Boolean(busy)} className="image-compressor__settings">
          <legend className="visually-hidden">Opções de compressão</legend>
          <div className="form__group">
            <span id="video-quality">Qualidade</span>
            <div className="form__row" role="group" aria-labelledby="video-quality">
              {QUALITIES.map((item) => <Button key={item.value} type="button" variant={quality === item.value ? "primary" : "outline-secondary"} aria-pressed={quality === item.value} onClick={() => { setQuality(item.value); clearResult(); }}>{item.label}</Button>)}
            </div>
            <p className="hint">Quanto menor a qualidade, menor o arquivo final.</p>
          </div>
          <div className="form__group">
            <Form.Label htmlFor="video-resolution">Resolução</Form.Label>
            <Form.Select id="video-resolution" value={resolution} onChange={(event) => { setResolution(event.target.value); clearResult(); }}>
              {RESOLUTIONS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </Form.Select>
            <p className="hint">Mantém a proporção e não amplia vídeos menores.</p>
          </div>
          <p className="hint">O vídeo é convertido para MP4 (H.264 e AAC). Na primeira compressão o compressor é carregado, o que pode levar alguns segundos. Vídeos longos podem demorar.</p>
          <div className="form__row"><Button type="submit">{working ? "Comprimindo…" : "Comprimir vídeo"}</Button></div>
        </fieldset>
      </Form>

      {working && <div className="panel">
        <LoadingState>{busy === "loading" ? "Carregando compressor…" : `Comprimindo vídeo… ${progress}%`}</LoadingState>
        {busy === "compressing" && <ProgressBar now={progress} label={`${progress}%`} aria-label="Progresso da compressão" />}
        <div className="form__row"><Button type="button" variant="outline-secondary" onClick={cancel}>Cancelar</Button></div>
      </div>}

      {result && <section className="panel" aria-labelledby="compression-result" aria-live="polite">
        <h2 className="panel__title" id="compression-result">Resultado da compressão</h2>
        <div className="stats-grid">
          {[["Tamanho original", formatSize(source.file.size)], ["Tamanho final", formatSize(result.file.size)], ["Redução", `${Math.max(0, reduction).toLocaleString("pt-BR", { maximumFractionDigits: 2 })}%`]].map(([label, value]) => <div className="stat-card" key={label}><div className="stat-card__value">{value}</div><div className="stat-card__label">{label}</div></div>)}
        </div>
        {reduction <= 0 && <Alert variant="warning">A compressão não reduziu o tamanho do arquivo. O vídeo pode já estar otimizado. Tente uma qualidade ou resolução menor.</Alert>}
        <div className="form__row"><Button as="a" href={result.url} download={result.file.name}><i className="bi bi-download" aria-hidden="true" /> Baixar vídeo comprimido</Button></div>
      </section>}

      <div className="panel-grid">
        <section className="panel"><h2 className="panel__title">Prévia original</h2>{source.width ? <div className="image-compressor__preview"><video src={source.url} controls preload="metadata" aria-label="Vídeo original selecionado" /></div> : <EmptyState title="Prévia indisponível">O navegador não reproduz este formato, mas ele ainda pode ser comprimido.</EmptyState>}</section>
        <section className="panel"><h2 className="panel__title">Prévia comprimida</h2>{result ? <><div className="image-compressor__preview"><video src={result.url} controls preload="metadata" aria-label="Resultado da compressão" /></div><p className="hint">MP4{result.width ? ` • ${result.width} × ${result.height} px` : ""} • {formatSize(result.file.size)}</p></> : <EmptyState>Comprima o vídeo para comparar o resultado.</EmptyState>}</section>
      </div>
    </>}
    {!source && !busy && !error && <EmptyState title="Escolha seu vídeo">Selecione ou arraste um vídeo para configurar a compressão.</EmptyState>}
  </section>;
}
