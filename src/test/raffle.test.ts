import { describe, expect, it } from "vitest";
import { countRaffleEntries } from "@/lib/raffle";

describe("raffle entries", () => {
  it("gives one entry per session reviewed", () => {
    expect(countRaffleEntries(["a", "b", "c"], [])).toBe(3);
  });
  it("does not add entries for re-reviewing the same session", () => {
    expect(countRaffleEntries(["a", "a"], [])).toBe(1);
  });
  it("gives one ticket for rating 3 topics in one day section", () => {
    expect(countRaffleEntries([], ["pacing", "topics", "speakers"])).toBe(1);
  });
  it("gives 3 tickets for one topic in each of the 3 day sections", () => {
    expect(countRaffleEntries([], ["overall", "pacing", "catering"])).toBe(3);
  });
  it("caps the whole day at 3 tickets", () => {
    expect(countRaffleEntries([], ["overall", "pacing", "topics", "speakers", "catering", "venue", "logistics"])).toBe(3);
  });
  it("gives one question ticket per session even with 3 submissions", () => {
    expect(countRaffleEntries([], [], ["s1", "s1", "s1"])).toBe(1);
  });
  it("gives one question ticket for each of 2 sessions", () => {
    expect(countRaffleEntries([], [], ["s1", "s2"])).toBe(2);
  });
  it("caps a session at 2 tickets: 1 rating + 1 question", () => {
    expect(countRaffleEntries(["s1"], [], ["s1", "s1"])).toBe(2);
  });
});
