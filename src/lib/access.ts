import type { StaffRole } from "@/lib/data";
import { canSubmitQuestions } from "@/lib/questions";

export type DeskTab = "qa" | "feedback" | "raffle";

/**
 * "Your session" label: shown to assigned moderators only (super admins moderate
 * everything, so the label would mean nothing there), only where Q&A is open, and
 * only for sessions assigned to that person - the keynotes are open to every
 * moderator, so they are nobody's own session.
 */
export function isYourSession(
  role: StaffRole | undefined,
  moderated: Set<string> | undefined,
  session: { id: string; kind: string; qa_enabled: boolean; open_to_all_moderators?: boolean } | undefined,
): boolean {
  if (!session || session.open_to_all_moderators) return false;
  return role === "moderator" && !!moderated?.has(session.id) && canSubmitQuestions(session);
}

/**
 * The session a moderator should land on first: the one assigned to them.
 * Keynotes open to every moderator don't count as "their" session.
 */
export function firstOwnSession<T extends { open_to_all_moderators: boolean; qa_enabled: boolean }>(
  sessions: T[] | undefined,
): T | undefined {
  return sessions?.find((s) => !s.open_to_all_moderators && s.qa_enabled);
}

/** Super admins see everything; moderators only see Q&A. */
export function deskTabsFor(role: StaffRole): DeskTab[] {
  if (role === "admin") return ["qa", "feedback", "raffle"];
  if (role === "moderator") return ["qa"];
  return [];
}
