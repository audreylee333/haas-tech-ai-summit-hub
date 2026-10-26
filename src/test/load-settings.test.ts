import { describe, expect, it } from "vitest";
import { QUERY_DEFAULTS, QUESTION_REFRESH_MS } from "@/lib/refresh";
import { numbersToThemes, themesAreFresh } from "@/lib/themes";

describe("load settings", () => {
  it("attendee question list refreshes every 30 seconds", () => expect(QUESTION_REFRESH_MS).toBe(30_000));
  it("failed loads retry at most twice with growing gaps capped at 10s", () => {
    expect(QUERY_DEFAULTS.retry).toBe(2);
    expect(QUERY_DEFAULTS.retryDelay(1)).toBeLessThan(QUERY_DEFAULTS.retryDelay(2));
    expect(QUERY_DEFAULTS.retryDelay(10)).toBe(10_000);
  });
});

describe("AI grouping savings", () => {
  const qs = [{ id: "a" }, { id: "b" }, { id: "c" }];
  it("maps short numbers back to question ids and drops unknown ones", () =>
    expect(numbersToThemes([{ label: "X", question_numbers: [1, 3, 9] }], qs)).toEqual([{ label: "X", question_ids: ["a", "c"] }]));
  it("reuses saved themes only when no questions changed", () => {
    const cache = { question_count: 3, latest_question_at: "2026-10-30T17:00:00.000Z" };
    expect(themesAreFresh(cache, 3, "2026-10-30T17:00:00.000Z")).toBe(true);
    expect(themesAreFresh(cache, 4, "2026-10-30T17:05:00.000Z")).toBe(false);
    expect(themesAreFresh(null, 3, "2026-10-30T17:00:00.000Z")).toBe(false);
  });
});
