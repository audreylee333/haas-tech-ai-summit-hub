export function canSubmitQuestions(session: { kind: string; qa_enabled: boolean }): boolean {
  return session.qa_enabled && session.kind.toLowerCase() !== "opening";
}