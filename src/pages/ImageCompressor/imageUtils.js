export const MAX_FILE_SIZE = 50 * 1024 * 1024;
export const FORMATS = { "image/jpeg": "JPEG", "image/png": "PNG", "image/webp": "WebP" };

export function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / (bytes < 1024 * 1024 ? 1024 : 1024 * 1024)).toLocaleString("pt-BR", { maximumFractionDigits: 2 })} ${bytes < 1024 * 1024 ? "KB" : "MB"}`;
}

// Check the file contents as well as its MIME type; extensions alone are unreliable.
export async function validateImage(file) {
  if (!file.size) throw new Error("A imagem está vazia. Selecione outro arquivo.");
  if (file.size > MAX_FILE_SIZE) throw new Error("Esta imagem ultrapassa 50 MB. Selecione um arquivo menor.");
  const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  const isJpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  const isPng = [137, 80, 78, 71, 13, 10, 26, 10].every((value, index) => bytes[index] === value);
  const isWebp = String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP";
  const type = isJpeg ? "image/jpeg" : isPng ? "image/png" : isWebp ? "image/webp" : "";
  if (!type || (file.type && file.type !== type)) {
    throw new Error("Arquivo inválido. Selecione uma imagem JPEG, PNG ou WebP.");
  }
  return file.type ? file : new File([file], file.name, { type, lastModified: file.lastModified });
}

export function getDimensions(file, signal) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    const finish = (error) => {
      const dimensions = { width: image.naturalWidth, height: image.naturalHeight };
      image.onload = image.onerror = null;
      signal.removeEventListener("abort", abort);
      image.src = "";
      URL.revokeObjectURL(url);
      if (error) reject(error);
      else resolve(dimensions);
    };
    const abort = () => finish(new DOMException("Operação cancelada", "AbortError"));
    image.onload = () => finish();
    image.onerror = () => finish(new Error("Não foi possível ler a imagem. O arquivo pode estar corrompido ou exceder os limites do navegador."));
    signal.addEventListener("abort", abort, { once: true });
    if (signal.aborted) abort();
    else image.src = url;
  });
}

export function downloadName(name, type) {
  const extension = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" }[type];
  return `${name.replace(/\.[^.]+$/, "") || "imagem"}-comprimida.${extension}`;
}
