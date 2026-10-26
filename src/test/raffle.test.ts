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
