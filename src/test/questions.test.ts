import { describe, expect, it } from "vitest";
import { canSubmitQuestions, qaOffNote } from "@/lib/questions";

describe("session question availability", () => {
  it("does not allow Q&A for opening remarks even if the flag is enabled", () => {
    expect(canSubmitQuestions({ kind: "Opening", qa_enabled: true })).toBe(false);
  });
  it("keeps Q&A available for enabled sessions", () => {
    expect(canSubmitQuestions({ kind: "Keynote", qa_enabled: true })).toBe(true);
  });
  it("does not allow Q&A for sessions disabled by organizers", () => {
    expect(canSubmitQuestions({ kind: "Panel", qa_enabled: false })).toBe(false);
  });
});

describe("qa off note", () => {
  it("tells coffee chat visitors questions are asked live", () => {
    expect(qaOffNote({ kind: "Coffee chat" })).toContain("asked live");
  });
  it("shows no note for other sessions without Q&A", () => {
    expect(qaOffNote({ kind: "Opening" })).toBeNull();
    expect(qaOffNote({ kind: "Fireside" })).toBeNull();
  });
});