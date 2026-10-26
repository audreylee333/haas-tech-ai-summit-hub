import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { DAY_CATEGORIES, DAY_GROUPS } from "@/lib/raffle";

// Vitest runs from the project root.
const DIR = path.resolve(process.cwd(), "drizzle/migrations");

// Migrations apply in file-name order, so the last definition of a function is the live one.
const sql = readdirSync(DIR)
  .filter((f) => f.endsWith(".sql"))
  .sort()
  .map((f) => readFileSync(DIR + "/" + f, "utf8"))
  .join("\n");

function body(name: string): string {
  const marker = `CREATE OR REPLACE FUNCTION public.${name}`;
  const start = sql.lastIndexOf(marker);
  expect(start, `${name} must be defined in a migration`).toBeGreaterThan(-1);
  const next = sql.indexOf("CREATE OR REPLACE FUNCTION", start + marker.length);
  return next === -1 ? sql.slice(start) : sql.slice(start, next);
}

// The database groups day categories with a CASE in day_feedback_group(); the app groups
// them with DAY_CATEGORIES[].group. If those two lists drift, attendee totals and the
// moderator leaderboard stop agreeing with what the screens show.
function sqlDayGroups(): Map<string, string> {
  const fn = body("day_feedback_group");
  const map = new Map<string, string>();
  for (const m of fn.matchAll(/when _category = '([a-z_]+)' then '([a-z_]+)'/g)) map.set(m[1], m[2]);
  for (const m of fn.matchAll(/when _category in \(([^)]*)\) then '([a-z_]+)'/g)) {
    for (const id of m[1].matchAll(/'([a-z_]+)'/g)) map.set(id[1], m[2]);
  }
  return map;
}

describe("database raffle rules mirror the app", () => {
  it("maps every day category to the same section in the database as in the app", () => {
    const map = sqlDayGroups();
    for (const c of DAY_CATEGORIES) {
      expect(map.get(c.id), `${c.id} is grouped differently in the database`).toBe(c.group);
    }
    expect([...map.keys()].sort()).toEqual(DAY_CATEGORIES.map((c) => c.id).sort());
  });

  it("offers exactly three day sections, each with at least one category", () => {
    expect(DAY_GROUPS.map((g) => g.id)).toEqual(["overall", "program", "venue"]);
    for (const g of DAY_GROUPS) {
      expect(DAY_CATEGORIES.filter((c) => c.group === g.id).length, `${g.id} has no categories`).toBeGreaterThan(0);
    }
  });

  it("counts each session review, day section and question session once in the leaderboard", () => {
    const b = body("raffle_leaderboard");
    expect(b).toContain("from public.session_feedback f");
    expect(b).toContain("distinct g2.user_id, public.day_feedback_group(g2.category)");
    expect(b).toContain("distinct q2.user_id, q2.session_id");
    expect(b).toContain("has_role(auth.uid(), 'admin')");
  });

  it("excludes past winners from a draw and counts the winner's tickets by the same rules", () => {
    const b = body("draw_raffle_winner");
    expect(b).toContain("not in (select d.user_id from public.raffle_draws d)");
    expect(b).toContain("count(distinct public.day_feedback_group(category))");
    expect(b).toContain("count(distinct session_id)");
    expect(b).toContain("has_role(auth.uid(), 'admin')");
  });
});
