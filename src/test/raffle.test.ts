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
});
