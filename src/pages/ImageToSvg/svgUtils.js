export const PRESETS = [
  { label: "Simples", colors: 4, options: { pathomit: 16, ltres: 1, qtres: 1 } },
  { label: "Equilibrado", colors: 16, options: { pathomit: 8, ltres: 1, qtres: 1 } },
  { label: "Detalhado", colors: 48, options: { pathomit: 2, ltres: 0.5, qtres: 0.5 } },
];

export async function readImageData(file, maxSide) {
  const bitmap = await createImageBitmap(file);
  const ratio = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * ratio));
  const height = Math.max(1, Math.round(bitmap.height * ratio));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  return context.getImageData(0, 0, width, height);
}

export function traceImage(image, options, signal) {
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL("./svgWorker.js", import.meta.url), { type: "module" });
    const finish = (error, svg) => {
      worker.terminate();
      signal.removeEventListener("abort", abort);
      if (error) reject(error);
      else resolve(svg);
    };
    const abort = () => finish(new DOMException("Operação cancelada", "AbortError"));
    const fail = () => finish(new Error("Não foi possível converter a imagem. Tente uma resolução menor ou menos cores."));
    worker.onmessage = ({ data }) => (data.error ? fail() : finish(null, data.svg));
    worker.onerror = fail;
    signal.addEventListener("abort", abort, { once: true });
    if (signal.aborted) abort();
    else worker.postMessage({ image, options });
  });
}

export function svgName(name) {
  return `${name.replace(/\.[^.]+$/, "") || "imagem"}.svg`;
}
