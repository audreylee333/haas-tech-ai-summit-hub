/** Attendees see other people's questions refresh on this timer (moderators are live). */
export const QUESTION_REFRESH_MS = 30_000;

export const QUERY_DEFAULTS = {
  staleTime: 30_000,
  retry: 2,
  retryDelay: (attempt: number) => Math.min(1000 * 2 ** attempt, 10_000),
};
