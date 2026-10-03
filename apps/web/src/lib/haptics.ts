/** Short vibration feedback where supported (mostly Android). Silently ignored elsewhere. */
export function vibrate(pattern: number | number[]): void {
  try {
    navigator.vibrate?.(pattern);
  } catch {
    // Some browsers throw when vibration is blocked by policy; feedback is optional.
  }
}
