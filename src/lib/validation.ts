import { z } from "zod";
import { sanitizeRichText } from "@/lib/sanitize";

/**
 * Request schemas for user-supplied payloads.
 *
 * Two jobs here:
 *   1. Bound the input. Previously every field was copied straight from the
 *      JSON body into the database, so a client could store megabytes in
 *      `summary` or an arbitrarily deep object in `theme`.
 *   2. Sanitize on write. Fields marked `richText` reach
 *      `dangerouslySetInnerHTML` in the template renderer, so they are
 *      sanitized here instead of at render time.
 *
 * Unknown keys are stripped by zod by default, which is what we want: the
 * request body can never set a field the handler did not explicitly declare
 * (no mass assignment, and `userId` can never come from the client).
 */

/** Plain-text field: trimmed, length-capped, stored as-is. */
const plain = (max: number) =>
  z
    .string()
    .max(max, `Must be ${max} characters or fewer`)
    .transform((s) => s.trim())
    .optional()
    .nullable();

/**
 * Rich-text field: capped, then run through the HTML allowlist.
 * `transform` runs after the length check, so the cap bounds the sanitizer
 * input too.
 */
const richText = (max: number) =>
  z
    .string()
    .max(max * 4, `Must be ${max} characters or fewer`)
    .transform((value) => sanitizeRichText(value, max))
    .optional()
    .nullable();

const experienceItem = z.object({
  id: z.string().max(64).optional(),
  company: richText(120),
  role: richText(120),
  date: richText(80),
  description: richText(4_000),
});

const educationItem = z.object({
  id: z.string().max(64).optional(),
  school: richText(160),
  degree: richText(160),
  date: richText(80),
});

const textBlockStyle = z
  .object({
    bold: z.boolean().optional(),
    italic: z.boolean().optional(),
    underline: z.boolean().optional(),
    strike: z.boolean().optional(),
    align: z.enum(["left", "center", "right", "justify"]).optional(),
    // Whitelisted font stacks are resolved in fonts.tsx; anything else is
    // passed to `style.fontFamily` and would be arbitrary CSS injection.
    fontFamily: z
      .string()
      .max(200)
      .refine(
        (v) => /^[A-Za-z0-9\s'",\-().]+$/.test(v),
        "Unsupported font value"
      )
      .optional(),
    fontSize: z.number().min(6).max(96).optional(),
    lineHeight: z.string().max(16).optional(),
    letterSpacing: z.number().min(-10).max(40).optional(),
  })
  .partial();

const resumeTheme = z
  .object({
    primaryColor: z
      .string()
      .regex(/^#[0-9a-fA-F]{3,8}$/, "Invalid color")
      .optional(),
    fontFamily: z
      .string()
      .max(200)
      .refine((v) => /^[A-Za-z0-9\s'",\-().]+$/.test(v), "Unsupported font value")
      .optional(),
    layout: z.string().max(64).optional(),
    fontSize: z.enum(["sm", "md", "lg"]).optional(),
  })
  .partial();

/** Body of POST /api/resume/[id] */
export const resumePayloadSchema = z.object({
  title: plain(200),
  titleIsCustom: z.boolean().optional(),
  firstName: richText(120),
  lastName: richText(120),
  jobTitle: richText(160),
  email: plain(320),
  phone: plain(40),
  address: plain(300),
  summary: richText(5_000),
  experience: z.array(experienceItem).max(30).default([]),
  education: z.array(educationItem).max(20).default([]),
  skills: richText(4_000),
  certifications: richText(4_000),
  theme: resumeTheme.optional().nullable(),
  blockStyles: z.record(z.string().max(32), textBlockStyle).optional().nullable(),
});

export type ResumePayload = z.infer<typeof resumePayloadSchema>;

/** Body of PATCH /api/resume/[id] */
export const resumeTitleSchema = z.object({
  title: z
    .string()
    // 4x headroom over the sanitized cap, mirroring richText() above.
    .max(800, "Title must be 200 characters or fewer")
    // Resume.title is NOT NULL in the schema, so fall back rather than
    // writing null when the value sanitizes away to nothing.
    .transform((value) => sanitizeRichText(value, 200) ?? "Untitled Resume"),
});

/** Body of PATCH /api/applications/[id] */
export const applicationStatusSchema = z.object({
  status: z.enum(["pending", "reviewing", "interviewing", "hired", "rejected"]),
});

/** Body of PATCH /api/profile */
export const profileSchema = z.object({
  fullName: plain(120),
  username: plain(60),
  /**
   * Display label only. The authorization role lives in Clerk publicMetadata
   * and is read from the session token, never from this column.
   */
  role: z
    .enum(["employer", "jobseeker", "recruiter", "other"])
    .optional()
    .nullable(),
  location: plain(120),
  bio: plain(2_000),
  website: plain(300),
  social: plain(300),
  github: plain(120),
});

/** Body of POST /api/testimonials */
export const testimonialSchema = z.object({
  name: z.string().trim().min(1).max(120),
  role: z.string().trim().max(120).optional().nullable(),
  company: z.string().trim().max(120).optional().nullable(),
  quote: z.string().trim().min(20, "Must be at least 20 characters").max(2_000),
  rating: z.number().int().min(1).max(5).optional(),
});

/** Body of POST /api/user/role */
export const userRoleSchema = z.object({
  role: z.enum(["employer", "jobseeker"]),
});

/** Body of POST /api/ai/rewrite */
export const aiRewriteSchema = z.object({
  text: z.string().trim().min(1).max(5_000),
  jobTitle: z.string().trim().max(160).optional(),
});

/** Body of POST /api/ai/analyze */
export const aiAnalyzeSchema = z.object({
  summary: z.string().trim().min(1).max(5_000),
  jobTitle: z.string().trim().max(160).optional(),
  firstName: z.string().max(120).optional(),
  lastName: z.string().max(120).optional(),
});

/** Body of POST /api/ai/interview-questions */
export const aiInterviewQuestionsSchema = z.object({
  targetJobTitle: z.string().trim().max(160).optional(),
  jobTitle: z.string().trim().max(160).optional(),
  summary: z.string().max(5_000).optional(),
  skills: z.string().max(2_000).optional(),
  experience: z
    .array(
      z.object({
        company: z.string().max(120).optional(),
        role: z.string().max(120).optional(),
        date: z.string().max(80).optional(),
        description: z.string().max(2_000).optional(),
      })
    )
    .max(20)
    .optional(),
});

/** Body of POST /api/ai/interview-feedback */
export const aiInterviewFeedbackSchema = z.object({
  targetJobTitle: z.string().trim().max(160).optional(),
  qa: z
    .array(
      z.object({
        question: z.string().max(2_000),
        answer: z.string().max(5_000),
      })
    )
    .min(1)
    .max(20),
});
