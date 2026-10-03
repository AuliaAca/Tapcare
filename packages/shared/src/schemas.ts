import { z } from 'zod';

/** Languages the companion can speak. Indonesian is the default audience. */
export const LocaleSchema = z.enum(['id', 'en']);
export type Locale = z.infer<typeof LocaleSchema>;

export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
export const ImageMediaTypeSchema = z.enum(ALLOWED_IMAGE_TYPES);

/** ~1.5 MB of raw image bytes once base64 is decoded. The web app sends ~150–400 KB. */
export const MAX_IMAGE_BASE64_LENGTH = 2_000_000;
export const MAX_GOAL_LENGTH = 200;
export const MAX_HISTORY_STEPS = 20;

const BASE64_PATTERN = /^[A-Za-z0-9+/]+={0,2}$/;

export const ImageInputSchema = z.object({
  mediaType: ImageMediaTypeSchema,
  data: z
    .string()
    .min(100, 'Image is too small to be a camera frame')
    .max(MAX_IMAGE_BASE64_LENGTH, 'Image is too large')
    .regex(BASE64_PATTERN, 'Image must be base64 without a data: prefix'),
  /** Pixel size of the frame as sent, so the model can answer in pixels and we can normalise. */
  width: z.number().int().min(64).max(4096),
  height: z.number().int().min(64).max(4096),
});
export type ImageInput = z.infer<typeof ImageInputSchema>;

/** How the user says the previous step went — lets the agent re-plan instead of repeating itself. */
export const StepFeedbackSchema = z.enum(['done', 'nothing_happened', 'cant_find']);
export type StepFeedback = z.infer<typeof StepFeedbackSchema>;

export const HistoryStepSchema = z.object({
  instruction: z.string().trim().min(1).max(300),
  feedback: StepFeedbackSchema,
});
export type HistoryStep = z.infer<typeof HistoryStepSchema>;

export const GuidanceRequestSchema = z.object({
  goal: z.string().trim().min(2).max(MAX_GOAL_LENGTH),
  locale: LocaleSchema,
  image: ImageInputSchema,
  history: z.array(HistoryStepSchema).max(MAX_HISTORY_STEPS).default([]),
});
export type GuidanceRequest = z.input<typeof GuidanceRequestSchema>;
export type ParsedGuidanceRequest = z.output<typeof GuidanceRequestSchema>;

/** Normalised (0–1) rectangle relative to the captured frame. */
export const BoundingBoxSchema = z.object({
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
  width: z.number().min(0).max(1),
  height: z.number().min(0).max(1),
});
export type BoundingBox = z.infer<typeof BoundingBoxSchema>;

export const GuidanceStatusSchema = z.enum([
  /** A single next tap is identified. */
  'next_step',
  /** The goal looks complete. */
  'done',
  /** Frame is blurry, cut off, glare, or not a kiosk. */
  'need_better_view',
  /** Kiosk error, out of service, card stuck — a person should help. */
  'needs_human',
]);
export type GuidanceStatus = z.infer<typeof GuidanceStatusSchema>;

export const SafetyKindSchema = z.enum([
  'none',
  'pin_entry',
  'payment',
  'personal_data',
  'suspicious',
]);
export type SafetyKind = z.infer<typeof SafetyKindSchema>;

export const SafetySchema = z.object({
  /** none = proceed, caution = proceed carefully, stop = do not continue alone. */
  level: z.enum(['none', 'caution', 'stop']),
  kind: SafetyKindSchema,
  message: z.string().nullable(),
});
export type Safety = z.infer<typeof SafetySchema>;

export const TargetSchema = z.object({
  /** Visible text on the element, e.g. "Beli Tiket". */
  label: z.string(),
  /** How to find it without the overlay, e.g. "green button, bottom right". */
  hint: z.string(),
  box: BoundingBoxSchema.nullable(),
});
export type Target = z.infer<typeof TargetSchema>;

export const ProviderNameSchema = z.enum(['claude', 'mock']);
export type ProviderName = z.infer<typeof ProviderNameSchema>;

export const GuidanceResponseSchema = z.object({
  status: GuidanceStatusSchema,
  instruction: z.string(),
  screenSummary: z.string(),
  target: TargetSchema.nullable(),
  safety: SafetySchema,
  confidence: z.enum(['high', 'medium', 'low']),
  stepNumber: z.number().int().min(1),
  meta: z.object({
    provider: ProviderNameSchema,
    latencyMs: z.number().int().min(0),
    requestId: z.string(),
  }),
});
export type GuidanceResponse = z.infer<typeof GuidanceResponseSchema>;

export const ErrorCodeSchema = z.enum([
  'VALIDATION_ERROR',
  'PAYLOAD_TOO_LARGE',
  'RATE_LIMITED',
  'UPSTREAM_UNAVAILABLE',
  'UPSTREAM_REFUSED',
  'NOT_FOUND',
  'INTERNAL_ERROR',
]);
export type ErrorCode = z.infer<typeof ErrorCodeSchema>;

export const ApiErrorBodySchema = z.object({
  error: z.object({
    code: ErrorCodeSchema,
    message: z.string(),
    requestId: z.string().optional(),
  }),
});
export type ApiErrorBody = z.infer<typeof ApiErrorBodySchema>;

export const HealthResponseSchema = z.object({
  status: z.literal('ok'),
  provider: ProviderNameSchema,
  version: z.string(),
});
export type HealthResponse = z.infer<typeof HealthResponseSchema>;
