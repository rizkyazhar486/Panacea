export function firstSentence(text: string): string {
  if (typeof text !== "string") return "";
  const trimmed = text.trim();
  if (!trimmed) return "";
  const match = trimmed.match(/^[^.!?]+[.!?]/);
  return match ? match[0].trim() : trimmed;
}
// Backward-compatible alias for legacy callers
export const kalimatPertama = firstSentence;