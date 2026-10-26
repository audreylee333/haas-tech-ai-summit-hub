import { describe, expect, it } from "vitest";
import { deskTabsFor } from "@/lib/access";
import { pickStaffRole } from "@/lib/data";

describe("access levels", () => {
  it("super admins see Q&A, feedback and raffle", () => expect(deskTabsFor("admin")).toEqual(["qa", "feedback", "raffle"]));
  it("moderators see only Q&A", () => expect(deskTabsFor("moderator")).toEqual(["qa"]));
  it("attendees get no desk", () => expect(deskTabsFor(null)).toEqual([]));
  it("super admin wins over moderator", () => expect(pickStaffRole(["moderator", "admin"])).toBe("admin"));
  it("plain users are attendees", () => expect(pickStaffRole(["user"])).toBeNull());
});
