import type { StaffRole } from "@/lib/data";
import { canSubmitQuestions } from "@/lib/questions";

export type DeskTab = "qa" | "feedback" | "raffle";

/**
 * "Your session" label: shown to assigned moderators only (super admins moderate
 * everything, so the label would mean nothing there) and only where Q&A is open.
 */
export function isYourSession(
  role: StaffRole | undefined,
  moderated: Set<string> | undefined,
  session: { id: string; kind: string; qa_enabled: boolean },
): boolean {
  return role === "moderator" && !!moderated?.has(session.id) && canSubmitQuestions(session);
}

/** Super admins see everything; moderators only see Q&A. */
export function deskTabsFor(role: StaffRole): DeskTab[] {
  if (role === "admin") return ["qa", "feedback", "raffle"];
  if (role === "moderator") return ["qa"];
  return [];
}
