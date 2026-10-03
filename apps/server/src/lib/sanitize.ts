import type { BoundingBox } from '@tapcare/shared';

// C0 controls (except tab/newline), DEL, zero-width and bidi-override characters.
const UNSAFE_CHARS =
  // eslint-disable-next-line no-control-regex
  /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F\u200B-\u200F\u202A-\u202E\u2066-\u2069]/g;

/** Normalises model output before it reaches the UI and the speech engine. */
export function cleanText(value: string, maxLength: number): string {
  const cleaned = value.replace(UNSAFE_CHARS, '').replace(/\s+/g, ' ').trim();
  if (cleaned.length <= maxLength) return cleaned;
  return `${cleaned.slice(0, maxLength - 1).trimEnd()}…`;
}

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
const MIN_BOX_SIDE = 0.005;

/** Keeps a normalised box inside the frame; drops boxes that are degenerate or non-finite. */
export function clampBox(box: BoundingBox | null): BoundingBox | null {
  if (!box) return null;
  const values = [box.x, box.y, box.width, box.height];
  if (!values.every(Number.isFinite)) return null;

  const x = clamp01(box.x);
  const y = clamp01(box.y);
  const width = Math.min(clamp01(box.width), 1 - x);
  const height = Math.min(clamp01(box.height), 1 - y);
  if (width < MIN_BOX_SIDE || height < MIN_BOX_SIDE) return null;
  return { x, y, width, height };
}

/** Converts a pixel rectangle to a normalised one. */
export function normalizeBox(
  box: { x: number; y: number; width: number; height: number },
  frame: { width: number; height: number },
): BoundingBox | null {
  return clampBox({
    x: box.x / frame.width,
    y: box.y / frame.height,
    width: box.width / frame.width,
    height: box.height / frame.height,
  });
}
