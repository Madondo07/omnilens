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
  history: z.array(
    z.object({ role: z.enum(["user", "assistant"]), content: z.string() }),
  ),
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
