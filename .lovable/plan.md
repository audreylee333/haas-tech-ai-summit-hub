# Getting ready for 200 people on the day

## Short answer

200 people is a light load. The database is healthy right now: memory 62%, 18 of 60 connections in use, and 1 of 200 pooled connections. Saving ratings and questions is cheap (one small row each). Request volume on its own won't be a problem.

The real risk is the **live Q&A refresh**. Every new question or upvote tells every phone viewing that session to reload the whole question list. If 150 people sit in one keynote and upvote at once, that becomes thousands of reloads a minute. The other cost is the **AI theme grouping**, the only step that costs money per click. Its usage is small and limited to staff.

## Most expensive operations (ranked)

1. Live question refresh during busy sessions: each upvote reloads the list for every viewer
2. Moderator desk: loads every question and reloads it on any change in any session
3. Raffle totals: recount everything every 15 seconds while the tab is open
4. AI theme grouping: one paid AI call per click (staff only)
5. Saving ratings, questions and votes: cheap

## Changes

1. **Batch live refreshes.** Each phone waits about 1.5 seconds and collects updates into a single reload. Ten upvotes in a burst then cause one reload instead of ten. Phones only refresh while the page is on screen.
2. **Moderator desk loads only their sessions.** It listens only to the session currently picked, and reloads in batches.
3. **Slower raffle refresh.** Totals refresh every 60 seconds while that tab is open, and pause when the browser tab is hidden. A "Refresh" button is there when you need it right away.
4. **Database lookups by session and by person**, so question lists and ticket counts stay fast as entries grow.
5. **Fewer repeat loads.** Session list and roles are kept for a few minutes, and failed loads retry a limited number of times with growing gaps.
6. **Double-tap protection.** Submit and upvote buttons stay disabled while saving, so a slow connection can't cause duplicate sends.
7. **Rehearsal.** A scripted run with about 200 simulated attendees opening sessions, upvoting and submitting at the same time. I'll watch database load and response times, and share the numbers with you.

## Technical details

- Indexes: `questions(session_id)`, `questions(user_id)`, `question_votes(user_id)`, `session_feedback(user_id)`, `session_feedback(session_id)`, `general_feedback(user_id)`.
- Debounced `invalidateQueries` in the realtime handlers in `sessions.$id.tsx` and `admin.tsx`. Admin channel filtered by `session_id` when a session is selected; when "All sessions" is selected, the channel stays unfiltered but debounced.
- `raffle_leaderboard` refetchInterval raised to 60s with `refetchIntervalInBackground: false`. Feedback dashboard raised from 30s to 60s.
- QueryClient defaults: `staleTime` 30s, `retry: 2`, exponential backoff, and `refetchOnWindowFocus` kept on but rate-limited by staleTime.
- Load test: a Python script using test sessions makes bounded concurrent RPC calls against `session_questions` and vote inserts. Before and after, I check `db_health` and `slow_queries`. Test rows are removed afterwards.
- The backend size stays as it is unless the rehearsal shows pressure. If it does, I'll suggest an upgrade and you decide.
