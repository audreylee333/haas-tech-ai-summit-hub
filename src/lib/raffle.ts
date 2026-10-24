// Reviews count once per session/category; each distinct question submission
// counts once, regardless of how many questions its paragraph contains.
export function countRaffleEntries(sessionIds: string[], categories: string[], submissionIds: string[] = []): number {
  return new Set(sessionIds).size + new Set(categories).size + new Set(submissionIds).size;
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
