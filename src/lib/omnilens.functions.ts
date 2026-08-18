import { createServerFn } from "@tanstack/react-start";
import {
  analyzeSourceInput,
  chatQueryInput,
  detectConflictsInput,
  generatePosterInput,
} from "./omnilens.schemas";

export const analyzeSource = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => analyzeSourceInput.parse(input))
  .handler(async ({ data }) => {
    const { analyzeSourceImpl } = await import("./omnilens.server");
    return analyzeSourceImpl(data);
  });

export const detectConflicts = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => detectConflictsInput.parse(input))
  .handler(async ({ data }) => {
    const { detectConflictsImpl } = await import("./omnilens.server");
    return detectConflictsImpl(data);
  });

export const chatQuery = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => chatQueryInput.parse(input))
  .handler(async ({ data }) => {
    const { chatQueryImpl } = await import("./omnilens.server");
    return chatQueryImpl(data);
  });

export const generatePoster = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => generatePosterInput.parse(input))
  .handler(async ({ data }) => {
    const { generatePosterImpl } = await import("./omnilens.server");
    return generatePosterImpl(data);
  });
