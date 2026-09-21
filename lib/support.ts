export const SUPPORT_EMAIL = "hi@basecase.vc";

export interface SupportDraft {
  subject: string;
  description: string;
}

// Escalation must work even when the chat provider cannot answer. Keep the
// customer's own words instead of depending on another model to summarize them.
export function createSupportDraft(
  messages: { role?: string; content?: string | null; tool_calls?: unknown }[],
): SupportDraft {
  const transcript = messages
    .filter((message) => !message.tool_calls && message.content)
    .map((message) => `${message.role ?? "message"}: ${message.content}`)
    .join("\n\n");
  return {
    subject: "Branded support request",
    description: transcript ? `Please help with this issue:\n\n${transcript}` : "",
  };
}

export function supportMailto(subject: string, description: string): string {
  // Subject is one email header; preserve multiline text only in the body.
  const safeSubject = subject.replace(/[\r\n]+/g, " ");
  return `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(safeSubject)}&body=${encodeURIComponent(description)}`;
}

export function chatFailure(error: unknown): string | null {
  if (error == null) return null;
  if (typeof error === "object" && "name" in error && error.name === "AbortError") {
    return null;
  }
  if (typeof error === "string" && error.trim()) return error;
  if (typeof error === "object" && "message" in error && typeof error.message === "string" && error.message.trim()) {
    return error.message;
  }
  return "The support service returned an error.";
}
