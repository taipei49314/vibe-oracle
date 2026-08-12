/**
 * Zero-dep share card PNG — spirit of modern-screenshot / html-to-image,
 * implemented with Canvas 2D for no extra npm weight.
 */

export type ShareImageInput = {
  archetype: string;
  tagline: string;
  shareLine: string;
  confidence: number;
};

export async function renderSharePng(input: ShareImageInput): Promise<Blob> {
  const w = 1080;
  const h = 1350;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas unsupported");

  // Background
  const grad = ctx.createLinearGradient(0, 0, w, h);
  grad.addColorStop(0, "#2a1848");
  grad.addColorStop(0.5, "#161222");
  grad.addColorStop(1, "#3a1830");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Soft orbs
  ctx.fillStyle = "rgba(139, 92, 246, 0.28)";
  ctx.beginPath();
  ctx.arc(w * 0.85, h * 0.12, 220, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(244, 114, 182, 0.18)";
  ctx.beginPath();
  ctx.arc(w * 0.15, h * 0.88, 200, 0, Math.PI * 2);
  ctx.fill();

  // Border
  ctx.strokeStyle = "rgba(245, 215, 142, 0.35)";
  ctx.lineWidth = 4;
  ctx.strokeRect(36, 36, w - 72, h - 72);

  ctx.fillStyle = "rgba(245, 215, 142, 0.9)";
  ctx.font = "600 28px 'DM Sans', system-ui, sans-serif";
  ctx.fillText("VIBEORACLE", 80, 120);

  ctx.fillStyle = "#e8e2f5";
  ctx.font = "600 72px Georgia, 'Times New Roman', serif";
  wrapText(ctx, input.archetype, 80, 280, w - 160, 84);

  ctx.fillStyle = "rgba(232, 226, 245, 0.75)";
  ctx.font = "italic 36px Georgia, serif";
  wrapText(ctx, input.tagline, 80, 480, w - 160, 48);

  ctx.fillStyle = "#f5d78e";
  ctx.font = "500 34px 'DM Sans', system-ui, sans-serif";
  wrapText(ctx, input.shareLine, 80, 720, w - 160, 44);

  ctx.fillStyle = "rgba(255,255,255,0.4)";
  ctx.font = "500 22px 'DM Sans', system-ui, sans-serif";
  ctx.fillText(
    `Vibe intensity · theatrical · ${input.confidence} · pure vibe`,
    80,
    h - 100
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("toBlob failed"))),
      "image/png"
    );
  });
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
) {
  const words = text.split(/\s+/);
  let line = "";
  let yy = y;
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, yy);
      line = word;
      yy += lineHeight;
    } else {
      line = test;
    }
  }
  if (line) ctx.fillText(line, x, yy);
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
