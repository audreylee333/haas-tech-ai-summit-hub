// Raffle rules: one entry per distinct session reviewed, plus one entry per
// distinct "rest of the day" category reviewed. Editing a review never adds entries.
export function countRaffleEntries(sessionIds: string[], categories: string[]): number {
  return new Set(sessionIds).size + new Set(categories).size;
}

export const DAY_CATEGORIES = [
  { id: "overall", label: "The day overall", hint: "How would you rate the overall experience today?" },
  { id: "pacing", label: "Pacing & schedule", hint: "Session lengths, breaks, running on time" },
  { id: "topics", label: "Topics covered", hint: "What hit, what was missing" },
  { id: "speakers", label: "Speaker lineup", hint: "Who you'd want to hear from next" },
  { id: "catering", label: "Food & coffee", hint: "Breakfast, lunch, snacks" },
  { id: "venue", label: "Venue", hint: "Seating, AV, comfort" },
  { id: "logistics", label: "Logistics", hint: "Registration, signage, communication" },
] as const;
