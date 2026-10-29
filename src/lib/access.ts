import type { StaffRole } from "@/lib/data";

export type DeskTab = "qa" | "feedback" | "raffle" | "attendees";


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
  if (role === "admin") return ["qa", "feedback", "raffle", "attendees"];
  if (role === "moderator") return ["qa"];
  return [];
}
