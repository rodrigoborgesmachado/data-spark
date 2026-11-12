import ImageTracer from "imagetracerjs";

self.onmessage = ({ data }) => {
  try {
    self.postMessage({ svg: ImageTracer.imagedataToSVG(data.image, data.options) });
  } catch {
    self.postMessage({ error: true });
  }
};
