# Cap raffle tickets per session: 1 for rating + 1 for questions

## What changes for attendees
- Each session can earn at most 2 tickets: 1 for rating it and 1 for sending questions.
- Attendees can still send as many questions as they like. Only the first submission per session earns a ticket.
- After the first question submission, the session page says something like "You've earned your question ticket for this session. More questions are always welcome."
- Day feedback is unchanged: 1 ticket per category.
- Moderator totals and the raffle draw use the same rule, so every count matches.

## Technical details
- Update `raffle_leaderboard()` and `draw_raffle_winner()` to count DISTINCT session_id from questions per user, not question rows.
- Update `countRaffleEntries` in `src/lib/raffle.ts` to match, and add a test: 3 submissions to one session = 1 ticket; submissions to 2 sessions = 2 tickets.
- Update the question-form copy and the ticket-earned toast on the session page.
- Update the project memory and AGENTS.md rule ("per submission" becomes "per session with a submission").
