/**
 * Server-side share / OG PNG via Satori + resvg.
 * https://github.com/vercel/satori
 */
import satori from "satori";
import { Resvg } from "@resvg/resvg-js";
import { readFileSync } from "node:fs";

export type OgInput = {
  archetype: string;
  tagline: string;
  shareLine: string;
  confidence: number;
};

let fontData: ArrayBuffer | null = null;

function loadFont(): ArrayBuffer {
  if (fontData) return fontData;
  // Bundled woff is heavy; use system-ish path or fetch from node_modules if present.
  // Prefer a tiny built-in: read DejaVu from common Linux CI path, else embed minimal via satori default fail.
  const candidates = [
    // CI / Linux
    "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    "/usr/share/fonts/TTF/DejaVuSans.ttf",
    // Windows
    "C:\\Windows\\Fonts\\arial.ttf",
    "C:\\Windows\\Fonts\\segoeui.ttf",
  ];
  for (const p of candidates) {
    try {
      const buf = readFileSync(p);
      fontData = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
      return fontData;
    } catch {
      /* try next */
    }
  }
  // Last resort: empty throws later with clear message
  throw new Error(
    "No TTF font found for Satori (install DejaVu or set OG_FONT_PATH)"
  );
}

function loadFontFromEnv(): ArrayBuffer {
  const custom = process.env.OG_FONT_PATH?.trim();
  if (custom) {
    const buf = readFileSync(custom);
    return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
  }
  return loadFont();
}

export async function renderOgPng(input: OgInput): Promise<Buffer> {
  const font = loadFontFromEnv();
  const archetype = clamp(input.archetype, 80);
  const tagline = clamp(input.tagline, 160);
  const shareLine = clamp(input.shareLine, 120);
  const confidence = Math.min(92, Math.max(72, Math.round(input.confidence || 80)));

  // Satori accepts a React-like element tree; we pass a plain object (no React runtime).
  const element = {
      type: "div",
      props: {
        style: {
          width: "1080px",
          height: "1350px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px",
          background:
            "linear-gradient(145deg, #2a1848 0%, #161222 48%, #3a1830 100%)",
          color: "#e8e2f5",
          fontFamily: "VibeSans",
        },
        children: [
          {
            type: "div",
            props: {
              style: {
                display: "flex",
                flexDirection: "column",
                gap: "28px",
              },
              children: [
                {
                  type: "div",
                  props: {
                    style: {
                      fontSize: 28,
                      letterSpacing: 8,
                      color: "#f5d78e",
                      textTransform: "uppercase",
                    },
                    children: "VibeOracle",
                  },
                },
                {
                  type: "div",
                  props: {
                    style: {
                      fontSize: 72,
                      lineHeight: 1.1,
                      color: "#f5d78e",
                      fontWeight: 600,
                    },
                    children: archetype,
                  },
                },
                {
                  type: "div",
                  props: {
                    style: {
                      fontSize: 36,
                      lineHeight: 1.35,
                      color: "rgba(232,226,245,0.78)",
                      fontStyle: "italic",
                    },
                    children: tagline,
                  },
                },
              ],
            },
          },
          {
            type: "div",
            props: {
              style: {
                display: "flex",
                flexDirection: "column",
                gap: "20px",
              },
              children: [
                {
                  type: "div",
                  props: {
                    style: {
                      fontSize: 34,
                      color: "#f5d78e",
                      lineHeight: 1.3,
                    },
                    children: shareLine,
                  },
                },
                {
                  type: "div",
                  props: {
                    style: {
                      fontSize: 22,
                      color: "rgba(255,255,255,0.4)",
                      letterSpacing: 2,
                      textTransform: "uppercase",
                    },
                    children: `Vibe intensity · theatrical · ${confidence} · pure vibe`,
                  },
                },
              ],
            },
          },
        ],
      },
    };

  const svg = await satori(element as Parameters<typeof satori>[0], {
      width: 1080,
      height: 1350,
      fonts: [
        {
          name: "VibeSans",
          data: font,
          weight: 400,
          style: "normal",
        },
      ],
    }
  );

  const resvg = new Resvg(svg, {
    fitTo: { mode: "width", value: 1080 },
  });
  return Buffer.from(resvg.render().asPng());
}

function clamp(s: string, max: number): string {
  const t = (s || "").trim();
  return t.length <= max ? t : t.slice(0, max);
}

