import type { BoundingBox } from '@tapcare/shared';

/** Expands tiny targets so the glow is visible, while keeping it centred on the element. */
export function highlightRect(box: BoundingBox, minSide = 0.08): BoundingBox {
  const width = Math.max(box.width, minSide);
  const height = Math.max(box.height, minSide);
  const x = width === box.width ? box.x : centred(box.x, box.width, width);
  const y = height === box.height ? box.y : centred(box.y, box.height, height);
  return { x, y, width, height };
}

const centred = (start: number, size: number, grown: number) =>
  Math.min(Math.max(start + size / 2 - grown / 2, 0), 1 - grown);
