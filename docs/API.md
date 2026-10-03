# API reference

Base URL: same origin as the web app (`/api`). All bodies are JSON. The authoritative schemas are in [`packages/shared/src/schemas.ts`](../packages/shared/src/schemas.ts).

Every response has an `X-Request-Id` header. Include it in bug reports.

## `GET /api/health`

```json
{ "status": "ok", "provider": "claude", "version": "0.1.0" }
```

`provider` is `claude` or `mock` (demo mode).

## `POST /api/guidance`

Asks for the single next step.

### Request

| Field                         | Type                                              | Rules                                                                                                |
| ----------------------------- | ------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `goal`                        | string                                            | 2–200 characters, trimmed                                                                            |
| `locale`                      | `"id"` \| `"en"`                                  | Language for the instruction                                                                         |
| `image.mediaType`             | `"image/jpeg"` \| `"image/png"` \| `"image/webp"` |                                                                                                      |
| `image.data`                  | string                                            | Base64 without the `data:` prefix, at most 2,000,000 characters                                      |
| `image.width`, `image.height` | integer                                           | 64–4096, pixel size of the image as sent                                                             |
| `history`                     | array (optional)                                  | At most 20 items of `{ instruction: string, feedback: "done" \| "nothing_happened" \| "cant_find" }` |

```json
{
  "goal": "Beli tiket kereta",
  "locale": "id",
  "image": { "mediaType": "image/jpeg", "data": "/9j/4AAQ...", "width": 1280, "height": 960 },
  "history": [{ "instruction": "Tekan \"Beli Tiket\".", "feedback": "done" }]
}
```

### Response `200`

```json
{
  "status": "next_step",
  "instruction": "Pilih \"Stasiun Taman\" di daftar.",
  "screenSummary": "Daftar stasiun tujuan.",
  "target": {
    "label": "Stasiun Taman",
    "hint": "kotak kedua dari atas",
    "box": { "x": 0.12, "y": 0.34, "width": 0.76, "height": 0.1 }
  },
  "safety": { "level": "none", "kind": "none", "message": null },
  "confidence": "high",
  "stepNumber": 2,
  "meta": { "provider": "claude", "latencyMs": 2140, "requestId": "4f1c…" }
}
```

| Field          | Meaning                                                                                                                           |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `status`       | `next_step` (tap the target), `done` (goal reached), `need_better_view` (retake the photo), `needs_human` (ask staff)             |
| `target`       | Present only for `next_step`. `box` holds fractions (0–1) of the image, or `null` when the element could not be located precisely |
| `safety.level` | `none`, `caution` (continue carefully), or `stop` (do not continue alone)                                                         |
| `safety.kind`  | `none`, `pin_entry`, `payment`, `personal_data`, or `suspicious`                                                                  |
| `confidence`   | `high`, `medium` or `low`. The UI suggests asking staff when it is `low`                                                          |
| `stepNumber`   | 1 + the number of steps marked `done` in `history`                                                                                |

### Errors

```json
{
  "error": {
    "code": "RATE_LIMITED",
    "message": "Too many requests. Please wait a moment.",
    "requestId": "…"
  }
}
```

| Status | `code`                 | When                                                        |
| ------ | ---------------------- | ----------------------------------------------------------- |
| 400    | `VALIDATION_ERROR`     | Body is not valid JSON or does not match the schema         |
| 404    | `NOT_FOUND`            | Unknown API route                                           |
| 413    | `PAYLOAD_TOO_LARGE`    | Body larger than 2.5 MB                                     |
| 422    | `UPSTREAM_REFUSED`     | The model declined to analyse this screen                   |
| 429    | `RATE_LIMITED`         | Too many requests; see the `Retry-After` header             |
| 500    | `INTERNAL_ERROR`       | Unexpected error (details are only in server logs)          |
| 503    | `UPSTREAM_UNAVAILABLE` | AI busy or unreachable, or output unreadable; safe to retry |
