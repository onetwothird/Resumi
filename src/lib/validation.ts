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
   * Free-text professional headline, e.g. "Full Stack Developer" - NOT the
   * account role. The authorization role lives in Clerk publicMetadata and is
   * read from the session token, never from this column, so it must not be
   * enum-restricted here or the profile form stops accepting real job titles.
   */
  role: plain(120),
  location: plain(120),
  bio: plain(2_000),
  website: plain(300),
  social: plain(300),
  github: plain(120),
  /** Opt-in for rendering the email address on the public /u/[username] page. */
  showEmail: z.boolean().optional(),
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

/**
 * Admin panel payloads.
 *
 * `plan` is an enum rather than a string so an unknown plan is rejected at the
 * boundary — src/lib/admin.ts re-checks it too, but the route should never be
 * the only thing standing between a typo and a user whose plan is "por".
 *
 * The two ways of setting an expiry are mutually exclusive on purpose: "give
 * them 3 months" and "expire on this date" are different intentions, and
 * accepting both at once means one silently wins.
 */
export const adminPlanSchema = z
  .object({
    plan: z.enum(["free", "pro", "premium"]),
    /** Whole months from now, measured by the catalogue's own month length. */
    months: z.number().int().min(1).max(120).optional(),
    /** ISO date. null/undefined means "never expires". */
    planExpiresAt: z
      .string()
      .max(40)
      .refine(
        (v) => !Number.isNaN(new Date(v).getTime()),
        "Not a valid date"
      )
      .optional()
      .nullable(),
    /**
     * Why this change was made. Required, not optional: a grant of paid access
     * with no stated reason is indistinguishable from a mistake once it is
     * three weeks old.
     */
    note: z.string().trim().min(3, "Say why this change is being made").max(1_000),
  })
  .refine((v) => !(v.months != null && v.planExpiresAt), {
    message: "Send either months or a date, not both",
    path: ["months"],
  });

/** Body of POST /api/admin/payments/[id]/mark-paid */
export const adminMarkPaidSchema = z.object({
  note: z.string().trim().min(3, "Say why this is being marked paid").max(1_000),
});

/** Body of PATCH /api/admin/users/[id]/note */
export const adminNoteSchema = z.object({
  // Empty is allowed and means "clear the note", so this is not min(1).
  note: z.string().trim().max(4_000),
});

/** Query for GET /api/admin/users */
export const adminUserQuerySchema = z.object({
  q: z.string().trim().max(200).optional(),
  plan: z.enum(["free", "pro", "premium", "any"]).default("any"),
  /** paid | free | expiring — the precomputed buckets the panel filters on. */
  filter: z.enum(["all", "paid", "free", "expiring"]).default("all"),
  page: z.coerce.number().int().min(1).max(10_000).default(1),
  perPage: z.coerce.number().int().min(1).max(100).default(25),
});

/**
 * Body of POST /api/billing/checkout.
 *
 * Deliberately contains no amount. The route resolves the plan from this id
 * against the catalogue in src/lib/plans.ts and takes the price from there,
 * so a client cannot choose what it is charged. Sending `amount` in the body
 * is the classic way a checkout endpoint ends up honouring attacker-supplied
 * prices.
 */
export const checkoutSchema = z.object({
  plan: z.enum(["pro", "premium"]),
  interval: z.enum(["month", "year"]).default("month"),
});

/** Query for GET /api/billing/status?payment=<paymentId> */
export const billingStatusQuerySchema = z.object({
  payment: z.string().trim().min(1).max(64).optional(),
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
  skills: z.string().max(4_000).optional(),
  // Sized to match the resume editor's own limits (resumePayloadSchema:
  // 30 entries, 4,000-char descriptions) so a long real resume is not
  // rejected here just because it is a lot to read.
  experience: z
    .array(
      z.object({
        company: z.string().max(120).optional(),
        role: z.string().max(120).optional(),
        date: z.string().max(80).optional(),
        description: z.string().max(4_000).optional(),
      })
    )
    .max(30)
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
