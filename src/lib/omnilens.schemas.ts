import { z } from "zod";

export const analyzeSourceInput = z.object({
  filename: z.string().min(1),
  content: z.string().min(1),
});

export const detectConflictsInput = z.object({
  sources: z.array(
    z.object({
      filename: z.string(),
      claims: z.array(z.object({ text: z.string(), type: z.string() })),
    }),
  ),
});

export const chatQueryInput = z.object({
  question: z.string().min(1),
  sources: z.array(z.object({ filename: z.string(), content: z.string() })),
  history: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string() })),
  /** What the user is currently looking at in the app — lets the assistant explain its own UI/output, not just the sources. */
  appContext: z
    .object({
      activeGeneration: z
        .object({
          title: z.string(),
          lens: z.string(),
          isCustom: z.boolean(),
          completenessScore: z.number(),
          completenessNote: z.string(),
          sectionHeadings: z.array(z.string()),
        })
        .nullable(),
    })
    .optional(),
});

export const generatePosterInput = z.object({
  lens: z.string().min(1),
  isCustom: z.boolean(),
  sources: z.array(z.object({ filename: z.string(), content: z.string() })),
  conflicts: z.array(
    z.object({
      claimA: z.string(),
      sourceA: z.string(),
      claimB: z.string(),
      sourceB: z.string(),
      explanation: z.string(),
    }),
  ),
});

/** Schema for the structured-prose poster output from the AI. */
export const posterOutputSchema = z.object({
  title: z.string().max(80),
  brief: z.string(),
  sections: z
    .array(
      z.object({
        heading: z.string(),
        bullets: z.array(z.string()).min(1),
      }),
    )
    .min(3)
    .max(8),
  completenessScore: z
    .number()
    .min(0)
    .max(100)
    .describe("How completely the sources cover this lens, 0-100"),
  completenessNote: z
    .string()
    .describe(
      "1-3 sentences: what's thin or missing from the sources for this lens, driving the completenessScore below 100 — specific enough that a user could act on it (e.g. what kind of document or detail to add).",
    ),
});
