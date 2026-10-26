import { describe, expect, it } from "vitest";
import { deskTabsFor, firstOwnSession, isYourSession } from "@/lib/access";
import { pickStaffRole } from "@/lib/data";

const qa = { id: "s1", kind: "Panel", qa_enabled: true };
const opening = { id: "s2", kind: "Opening", qa_enabled: true };
const noQa = { id: "s3", kind: "Fireside", qa_enabled: false };
const sharedKeynote = { id: "k2", kind: "Keynote", qa_enabled: true, open_to_all_moderators: true };
const mine = new Set(["s1", "s2", "s3"]);
const keynote = { id: "k1", open_to_all_moderators: true, qa_enabled: true };
const healthcare = { id: "s4", open_to_all_moderators: false, qa_enabled: true };
const noQaAssigned = { id: "s5", open_to_all_moderators: false, qa_enabled: false };

describe("access levels", () => {
  it("super admins see Q&A, feedback and raffle", () => expect(deskTabsFor("admin")).toEqual(["qa", "feedback", "raffle"]));
  it("moderators see only Q&A", () => expect(deskTabsFor("moderator")).toEqual(["qa"]));
  it("attendees get no desk", () => expect(deskTabsFor(null)).toEqual([]));
  it("super admin wins over moderator", () => expect(pickStaffRole(["moderator", "admin"])).toBe("admin"));
  it("plain users are attendees", () => expect(pickStaffRole(["user"])).toBeNull());
  it("assigned moderators get the label on their Q&A session", () => expect(isYourSession("moderator", mine, qa)).toBe(true));
  it("the label needs Q&A open, so opening remarks never get it", () => expect(isYourSession("moderator", mine, opening)).toBe(false));
  it("sessions without Q&A never get the label", () => expect(isYourSession("moderator", mine, noQa)).toBe(false));
  it("super admins are not tagged session by session", () => expect(isYourSession("admin", mine, qa)).toBe(false));
  it("attendees never see the label", () => expect(isYourSession(null, mine, qa)).toBe(false));
  it("unassigned sessions are not tagged", () => expect(isYourSession("moderator", new Set(["other"]), qa)).toBe(false));
  it("moderators land on the session assigned to them", () => expect(firstOwnSession([keynote, healthcare])?.id).toBe("s4"));
  it("keynotes open to every moderator are nobody's landing session", () => expect(firstOwnSession([keynote])).toBeUndefined());
  it("assigned sessions without Q&A are not a landing session", () => expect(firstOwnSession([keynote, noQaAssigned])).toBeUndefined());
});
