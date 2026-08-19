import { createServerFn } from "@tanstack/react-start";
import {
  analyzeSourceInput,
  chatQueryInput,
  detectConflictsInput,
  generatePosterInput,
} from "./omnilens.schemas";

export const analyzeSource = createServerFn({ method: "POST" })
  .validator((input: unknown) => analyzeSourceInput.parse(input))
  .handler(async ({ data }) => {
    const { analyzeSourceImpl } = await import("./omnilens.server");
    return analyzeSourceImpl(data);
  });

export const detectConflicts = createServerFn({ method: "POST" })
  .validator((input: unknown) => detectConflictsInput.parse(input))
  .handler(async ({ data }) => {
    const { detectConflictsImpl } = await import("./omnilens.server");
    return detectConflictsImpl(data);
  });

export const chatQuery = createServerFn({ method: "POST" })
  .validator((input: unknown) => chatQueryInput.parse(input))
  .handler(async ({ data }) => {
    const { chatQueryImpl } = await import("./omnilens.server");
    return chatQueryImpl(data);
  });

export const generatePoster = createServerFn({ method: "POST" })
  .validator((input: unknown) => generatePosterInput.parse(input))
  .handler(async ({ data }) => {
    const { generatePosterImpl } = await import("./omnilens.server");
    return generatePosterImpl(data);
  });
