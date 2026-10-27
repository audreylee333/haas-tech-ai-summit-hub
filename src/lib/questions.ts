export function canSubmitQuestions(session: { kind: string; qa_enabled: boolean }): boolean {
  return session.qa_enabled && session.kind.toLowerCase() !== "opening";
}

/** Short note shown on a session page when its question box is off, or null when nothing to say. */
export function qaOffNote(session: { kind: string }): string | null {
  const kind = session.kind.toLowerCase();
  if (kind.includes("coffee")) {
    return "Questions for this session are asked live, so bring yours for the room.";
  }
  return null;
}