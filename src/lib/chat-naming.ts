/** Keyword → emoji rules for auto-tagging a chat, NotebookLM-style. First match wins. */
const EMOJI_RULES: [RegExp, string][] = [
  [/\b(budget|cost|spend|financ|invoice|pricing|revenue)\b/i, "💰"],
  [/\b(roadmap|timeline|schedule|milestone|launch|deadline|release)\b/i, "🗺️"],
  [/\b(bug|error|issue|crash|fail|outage|incident)\b/i, "🐛"],
  [/\b(architecture|infra|infrastructure|system design|technical|deploy)\b/i, "🏗️"],
  [/\b(meeting|standup|sync|agenda|call)\b/i, "📅"],
  [/\b(marketing|campaign|brand|social media)\b/i, "📣"],
  [/\b(sales|deal|pipeline|prospect|gtm|go-to-market)\b/i, "🤝"],
  [/\b(hr|hiring|onboarding|headcount|culture|people ops)\b/i, "🧑‍🤝‍🧑"],
  [/\b(security|risk|compliance|audit|privacy|breach)\b/i, "🔒"],
  [/\b(conflict|contradiction|discrepanc|mismatch)\b/i, "⚠️"],
  [/\b(report|summary|analysis|research|findings)\b/i, "📊"],
  [/\b(product|feature|spec|requirement)\b/i, "🧩"],
  [/\b(support|ticket|troubleshoot|help desk|customer issue)\b/i, "🎧"],
  [/\b(legal|contract|agreement|terms)\b/i, "📜"],
  [/\b(design|ui|ux|mockup|wireframe)\b/i, "🎨"],
];

const DEFAULT_EMOJI = "💬";

/** Picks an emoji that matches the topic of a chat from its name or first message. */
export function pickChatEmoji(text: string): string {
  for (const [pattern, emoji] of EMOJI_RULES) {
    if (pattern.test(text)) return emoji;
  }
  return DEFAULT_EMOJI;
}

/** Derives a short, readable chat title from the first user message. */
export function autoName(message: string): string {
  const cleaned = message
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[.?!]+$/, "");
  if (cleaned.length <= 42) return cleaned;
  const truncated = cleaned.slice(0, 42);
  const lastSpace = truncated.lastIndexOf(" ");
  return (lastSpace > 20 ? truncated.slice(0, lastSpace) : truncated).trimEnd() + "…";
}
