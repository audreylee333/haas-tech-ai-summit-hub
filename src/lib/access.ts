import type { StaffRole } from "@/lib/data";

export type DeskTab = "qa" | "feedback" | "raffle";

/** Super admins see everything; moderators only see Q&A. */
export function deskTabsFor(role: StaffRole): DeskTab[] {
  if (role === "admin") return ["qa", "feedback", "raffle"];
  if (role === "moderator") return ["qa"];
  return [];
}
