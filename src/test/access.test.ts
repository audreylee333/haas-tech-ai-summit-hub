import { describe, expect, it } from "vitest";
import { deskTabsFor, firstOwnSession } from "@/lib/access";
import { pickStaffRole } from "@/lib/data";

const keynote = { id: "k1", open_to_all_moderators: true, qa_enabled: true };
const healthcare = { id: "s4", open_to_all_moderators: false, qa_enabled: true };
const noQaAssigned = { id: "s5", open_to_all_moderators: false, qa_enabled: false };

describe("access levels", () => {
  it("super admins see Q&A, feedback and raffle on the desk", () => expect(deskTabsFor("admin")).toEqual(["qa", "feedback", "raffle"]));
  it("moderators see only Q&A", () => expect(deskTabsFor("moderator")).toEqual(["qa"]));
  it("attendees get no desk", () => expect(deskTabsFor(null)).toEqual([]));
  it("super admin wins over moderator", () => expect(pickStaffRole(["moderator", "admin"])).toBe("admin"));
  it("plain users are attendees", () => expect(pickStaffRole(["user"])).toBeNull());
  it("moderators land on the session assigned to them", () => expect(firstOwnSession([keynote, healthcare])?.id).toBe("s4"));
  it("keynotes open to every moderator are nobody's landing session", () => expect(firstOwnSession([keynote])).toBeUndefined());
  it("assigned sessions without Q&A are not a landing session", () => expect(firstOwnSession([keynote, noQaAssigned])).toBeUndefined());
});
