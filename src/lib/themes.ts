export type Theme = { label: string; question_ids: string[] };
export type ThemedGroup<Q> = { label: string; questions: Q[] };

/** Places questions into AI themes (by upvotes); unknown or new questions go to "New / ungrouped". */
export function applyThemes<Q extends { id: string; vote_count: number }>(themes: Theme[], questions: Q[]): ThemedGroup<Q>[] {
  const byId = new Map(questions.map((q) => [q.id, q]));
  const used = new Set<string>();
  const groups: ThemedGroup<Q>[] = [];
  for (const t of themes) {
    const qs: Q[] = [];
    for (const id of t.question_ids) {
      const q = byId.get(id);
      if (q && !used.has(id)) { used.add(id); qs.push(q); }
    }
    if (qs.length) groups.push({ label: t.label, questions: qs.sort((a, b) => b.vote_count - a.vote_count) });
  }
  const rest = questions.filter((q) => !used.has(q.id)).sort((a, b) => b.vote_count - a.vote_count);
  if (rest.length) groups.push({ label: "New / ungrouped", questions: rest });
  return groups;
}
