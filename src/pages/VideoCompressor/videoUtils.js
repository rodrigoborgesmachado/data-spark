export const MAX_FILE_SIZE = 300 * 1024 * 1024;
export const EXTENSIONS = ["mp4", "m4v", "mov", "webm", "mkv", "avi", "wmv", "flv", "3gp", "mpg", "mpeg", "ogv"];
export const QUALITIES = [
  { value: "alta", label: "Alta", crf: 23 },
  { value: "media", label: "Média", crf: 28 },
  { value: "baixa", label: "Baixa", crf: 33 },
];
export const RESOLUTIONS = [
  { value: "", label: "Original" },
  { value: "1080", label: "1080p" },
  { value: "720", label: "720p" },
  { value: "480", label: "480p" },
];

export function getExtension(name) {
  const match = /\.([^.]+)$/.exec(name);
  return match ? match[1].toLowerCase() : "";
}

export function validateVideo(file) {
  if (!file.size) throw new Error("O vídeo está vazio. Selecione outro arquivo.");
  if (file.size > MAX_FILE_SIZE) throw new Error("Este vídeo ultrapassa 300 MB. Selecione um arquivo menor para evitar travamentos no navegador.");
  if (!file.type.startsWith("video/") && !EXTENSIONS.includes(getExtension(file.name))) {
    throw new Error("Formato incompatível. Selecione um vídeo MP4, MOV, WebM, MKV, AVI ou outro formato de vídeo comum.");
  }
  return file;
}

export function getMetadata(url) {
  return new Promise((resolve) => {
    const video = document.createElement("video");
    const finish = (metadata) => {
      video.onloadedmetadata = video.onerror = null;
      video.removeAttribute("src");
      video.load();
      resolve(metadata);
    };
    video.preload = "metadata";
    video.onloadedmetadata = () => finish({ width: video.videoWidth, height: video.videoHeight, duration: video.duration });
    video.onerror = () => finish({});
    video.src = url;
  });
}

export function formatDuration(seconds) {
  if (!Number.isFinite(seconds)) return "-";
  const total = Math.round(seconds);
  const parts = [Math.floor(total / 3600), Math.floor((total % 3600) / 60), total % 60];
  return (parts[0] ? parts : parts.slice(1)).map((value, index) => String(value).padStart(index ? 2 : 1, "0")).join(":");
}

export function buildArgs(input, output, quality, resolution) {
  const { crf } = QUALITIES.find((item) => item.value === quality);
  const scale = resolution ? `scale=-2:'trunc(min(${resolution},ih)/2)*2'` : "scale='trunc(iw/2)*2':'trunc(ih/2)*2'";
  return ["-i", input, "-map", "0:v:0", "-map", "0:a:0?", "-vf", scale, "-c:v", "libx264", "-preset", "veryfast", "-crf", String(crf), "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "128k", "-movflags", "+faststart", output];
}

export function downloadName(name) {
  return `${name.replace(/\.[^.]+$/, "") || "video"}-comprimido.mp4`;
}
