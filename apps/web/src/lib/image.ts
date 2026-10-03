import type { ImageInput } from '@tapcare/shared';

/** A captured kiosk frame: the payload for the API plus a preview URL for the UI. */
export interface CapturedFrame {
  image: ImageInput;
  previewUrl: string;
}

/** Longest edge sent to the server. Big enough to read small kiosk text, small enough to upload fast. */
export const MAX_EDGE = 1280;
const JPEG_QUALITY = 0.82;

/** Scales a size down (never up) so the longest edge fits within `maxEdge`. */
export function fitWithin(width: number, height: number, maxEdge = MAX_EDGE) {
  if (width <= 0 || height <= 0) throw new Error('Image has no size');
  const scale = Math.min(1, maxEdge / Math.max(width, height));
  return { width: Math.round(width * scale), height: Math.round(height * scale) };
}

/** Splits a `data:` URL into its media type and base64 body. */
export function parseDataUrl(dataUrl: string): { mediaType: string; data: string } {
  const match = /^data:([^;]+);base64,(.+)$/.exec(dataUrl);
  if (!match?.[1] || !match[2]) throw new Error('Not a base64 data URL');
  return { mediaType: match[1], data: match[2] };
}

function encode(source: CanvasImageSource, width: number, height: number): CapturedFrame {
  const size = fitWithin(width, height);
  const canvas = document.createElement('canvas');
  canvas.width = size.width;
  canvas.height = size.height;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas is not supported');
  context.drawImage(source, 0, 0, size.width, size.height);

  const previewUrl = canvas.toDataURL('image/jpeg', JPEG_QUALITY);
  const { data } = parseDataUrl(previewUrl);
  return { previewUrl, image: { mediaType: 'image/jpeg', data, ...size } };
}

export function captureVideoFrame(video: HTMLVideoElement): CapturedFrame {
  return encode(video, video.videoWidth, video.videoHeight);
}

export async function fileToFrame(file: File): Promise<CapturedFrame> {
  if (!file.type.startsWith('image/')) throw new Error('Not an image');
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  try {
    return encode(bitmap, bitmap.width, bitmap.height);
  } finally {
    bitmap.close();
  }
}
