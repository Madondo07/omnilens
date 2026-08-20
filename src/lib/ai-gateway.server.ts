import { createGoogleGenerativeAI } from "@ai-sdk/google";

export function gateway() {
  const key = process.env["GOOGLE_GENERATIVE_AI_API_KEY"];
  if (!key) throw new Error("Missing GOOGLE_GENERATIVE_AI_API_KEY");
  return createGoogleGenerativeAI({ apiKey: key });
}

export const CHAT_MODEL = "gemini-3.6-flash";
