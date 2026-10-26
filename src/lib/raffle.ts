// Reviews count once per session and once per day section (group); questions
// count once per session the attendee submitted to.
export function countRaffleEntries(sessionIds: string[], dayCategories: string[], questionSessionIds: string[] = []): number {
  const groups = new Set(dayCategories.map(dayGroupOf).filter(Boolean));
  return new Set(sessionIds).size + groups.size + new Set(questionSessionIds).size;
}

export const DAY_GROUPS = [
  { id: "overall", label: "The day overall", hint: "How would you rate the overall experience today?" },
  { id: "program", label: "Program", hint: "Pacing, topics, and the speaker lineup" },
  { id: "venue", label: "Venue & logistics", hint: "Food, the space, and getting around" },
] as const;

export type DayGroupId = (typeof DAY_GROUPS)[number]["id"];

export const DAY_CATEGORIES = [
  { id: "overall", group: "overall", label: "The day overall", hint: "How would you rate the overall experience today?" },
  { id: "pacing", group: "program", label: "Pacing & schedule", hint: "Session lengths, breaks, running on time" },
  { id: "topics", group: "program", label: "Topics covered", hint: "What hit, what was missing" },
  { id: "speakers", group: "program", label: "Speaker lineup", hint: "Who you'd want to hear from next" },
  { id: "catering", group: "venue", label: "Food & coffee", hint: "Breakfast, lunch, snacks" },
  { id: "venue", group: "venue", label: "Venue", hint: "Seating, AV, comfort" },
  { id: "logistics", group: "venue", label: "Registration & signage", hint: "Registration, signage, communication" },
] as const;

export function dayGroupOf(category: string): DayGroupId | undefined {
  return DAY_CATEGORIES.find((c) => c.id === category)?.group;
}
