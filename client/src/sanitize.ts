/** Keep in sync with server/src/sanitize.ts */

const SHARE_TEXT_MAX = 120;

const BIDI_AND_ZW =
  /[\u202A-\u202E\u2066-\u2069\u200B-\u200D\uFEFF]/g;

export function sanitizeShareText(input: string): string {
  const cleaned = input
    .replace(BIDI_AND_ZW, "")
    .replace(/[\r\n]+/g, " ")
    .normalize("NFC")
    .trim()
    .replace(/\s+/g, " ");

  const cps = [...cleaned];
  if (cps.length <= SHARE_TEXT_MAX) return cps.join("");
  return cps.slice(0, SHARE_TEXT_MAX).join("");
}
