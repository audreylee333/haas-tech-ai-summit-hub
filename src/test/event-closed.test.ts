import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { EVENT_SUBMISSIONS_OPEN } from "@/lib/event";

const sql = readFileSync("drizzle/migrations/0013_close_2026_event_submissions.sql", "utf8");

describe("2026 event closure", () => {
  it("does not accept submissions after sign-in", () => {
    expect(EVENT_SUBMISSIONS_OPEN).toBe(false);
  });

  it.each([
    ["session_feedback", "INSERT"],
    ["session_feedback", "UPDATE"],
    ["general_feedback", "INSERT"],
    ["general_feedback", "UPDATE"],
    ["questions", "INSERT"],
    ["question_votes", "INSERT"],
    ["question_votes", "DELETE"],
  ])("enforces closed %s %s requests for signed-in accounts", (table, action) => {
    const statement = sql.split(";").find((s) => s.includes(`ON public.${table} AS RESTRICTIVE FOR ${action} TO authenticated`));
    expect(statement).toBeDefined();
    expect(statement).toMatch(/(?:USING|WITH CHECK) \(false\)/);
  });

  it("does not block reading results or staff question moderation", () => {
    expect(sql).not.toMatch(/FOR SELECT/);
    expect(sql).not.toMatch(/ON public\.questions AS RESTRICTIVE FOR UPDATE/);
    expect(sql).not.toMatch(/(?:user_roles|moderator_emails|moderator_assignments|profiles)/);
  });
});