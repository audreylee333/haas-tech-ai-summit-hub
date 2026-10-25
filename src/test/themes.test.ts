import { describe, expect, it } from "vitest";
import { applyThemes } from "@/lib/themes";
import { countRaffleEntries } from "@/lib/raffle";

const qs = [
  { id: "a", vote_count: 1 },
  { id: "b", vote_count: 5 },
  { id: "c", vote_count: 0 },
];

describe("theme grouping", () => {
  it("sorts each theme by upvotes and puts new questions in ungrouped", () => {
    const groups = applyThemes([{ label: "Trust", question_ids: ["a", "b"] }], qs);
    expect(groups[0]!.questions.map((q) => q.id)).toEqual(["b", "a"]);
    expect(groups[1]).toEqual({ label: "New / ungrouped", questions: [qs[2]] });
  });
  it("never shows a question in two themes", () => {
    const groups = applyThemes([{ label: "X", question_ids: ["a"] }, { label: "Y", question_ids: ["a", "b"] }], qs);
    expect(groups.flatMap((g) => g.questions.map((q) => q.id)).sort()).toEqual(["a", "b", "c"]);
  });
});

describe("upvotes", () => {
  it("do not earn raffle tickets: only submissions count", () => {
    // raffle counts submission ids only; votes have no input
    expect(countRaffleEntries([], [], ["q1"])).toBe(1);
  });
});
