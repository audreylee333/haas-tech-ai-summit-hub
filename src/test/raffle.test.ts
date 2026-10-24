import { describe, expect, it } from "vitest";
import { countRaffleEntries } from "@/lib/raffle";

describe("raffle entries", () => {
  it("gives one entry per session reviewed", () => {
    expect(countRaffleEntries(["a", "b", "c"], [])).toBe(3);
  });
  it("does not add entries for re-reviewing the same session", () => {
    expect(countRaffleEntries(["a", "a"], [])).toBe(1);
  });
  it("adds one entry per day-feedback category", () => {
    expect(countRaffleEntries(["a"], ["pacing", "catering"])).toBe(3);
  });
  it("gives only one ticket for a submission containing multiple questions", () => {
    const submission = { id: "submission-1", body: "How do you measure trust? What changes next year?" };
    expect(countRaffleEntries([], [], [submission.id])).toBe(1);
  });
  it("counts separate submissions without counting a submission twice", () => {
    expect(countRaffleEntries([], [], ["submission-1", "submission-2", "submission-1"])).toBe(2);
  });
});
