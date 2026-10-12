export type UploadPreset = "cover" | "thumb" | "logo" | "gallery" | "background";

/** 프리셋별 리사이즈 기준 (긴 변 px) + 정사각 크롭 여부 */
const PRESETS: Record<UploadPreset, { max: number; square?: boolean }> = {
  cover: { max: 1200 },
  background: { max: 1600 },
  gallery: { max: 1400 },
  thumb: { max: 480, square: true },
  logo: { max: 600 },
};

/**
 * 브라우저에서 이미지를 줄이고(필요하면 정사각으로 가운데 크롭) WebP/JPEG 로 바꾼다.
 * 폰 사진(4~10MB)을 그대로 올리면 공개 페이지가 느려지므로 꼭 거친다.
 * GIF·SVG 는 애니메이션/벡터가 깨지므로 그대로 올린다.
 */
export async function prepareImage(file: File, preset: UploadPreset = "gallery"): Promise<Blob> {
  if (/image\/gif/.test(file.type)) return file;
  const { max, square } = PRESETS[preset];

  let bitmap: ImageBitmap | HTMLImageElement;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    bitmap = await loadImage(file);
  }

  const sw = bitmap.width;
  const sh = bitmap.height;
  let sx = 0;
  let sy = 0;
  let cw = sw;
  let ch = sh;

  if (square) {
    const side = Math.min(sw, sh);
    sx = Math.round((sw - side) / 2);
    sy = Math.round((sh - side) / 2);
    cw = side;
    ch = side;
  }

  const scale = Math.min(1, max / Math.max(cw, ch));
  const tw = Math.max(1, Math.round(cw * scale));
  const th = Math.max(1, Math.round(ch * scale));

  const canvas = document.createElement("canvas");
  canvas.width = tw;
  canvas.height = th;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.drawImage(bitmap as CanvasImageSource, sx, sy, cw, ch, 0, 0, tw, th);

  const keepAlpha = /image\/png/.test(file.type) && preset === "logo";
  const type = keepAlpha ? "image/png" : "image/webp";
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, 0.85));
  if (blob && blob.size > 0) return blob;
  const jpeg = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.85));
  return jpeg || file;
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(e);
    };
    img.src = url;
  });
}

export async function uploadImage(file: File, preset: UploadPreset = "gallery") {
  // SVG 는 안에 스크립트를 넣을 수 있어 올리지 않음
  if (/svg/i.test(file.type) || /\.svg$/i.test(file.name)) {
    throw new Error("SVG 는 올릴 수 없어요. PNG·JPG 로 올려주세요");
  }
  if (file.size > 15 * 1024 * 1024) {
    throw new Error("15MB 이하 이미지만 올릴 수 있어요");
  }
  const blob = await prepareImage(file, preset);
  const fd = new FormData();
  fd.append("file", blob, file.name || "image");
  const res = await fetch("/api/upload", { method: "POST", body: fd });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.url) throw new Error(json.error || "이미지를 올리지 못했어요");
  return json.url as string;
}
