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

1. **Attendees refresh on a timer, moderators stay live.** Attendee phones stop listening for live changes. They reload a session's questions every 30 seconds while the page is on screen, and right away after their own post or upvote. That removes the burst problem. The moderator desk keeps instant updates.
2. **Moderator desk loads only their sessions.** It listens only to the session currently picked, and reloads in batches.
3. **Slower raffle refresh.** Totals refresh every 60 seconds while that tab is open, and pause when the browser tab is hidden. A "Refresh" button is there when you need it right away.
4. **Database lookups by session and by person**, so question lists and ticket counts stay fast as entries grow.
5. **Fewer repeat loads.** Session list and roles are kept for a few minutes, and failed loads retry a limited number of times with growing gaps.
6. **Double-tap protection.** Submit and upvote buttons stay disabled while saving, so a slow connection can't cause duplicate sends.
7. **Rehearsal.** A scripted run with about 200 simulated attendees opening sessions, upvoting and submitting at the same time. I'll watch database load and response times, and share the numbers with you.

## Technical details

- Indexes: `questions(session_id)`, `questions(user_id)`, `question_votes(user_id)`, `session_feedback(user_id)`, `session_feedback(session_id)`, `general_feedback(user_id)`.
- `sessions.$id.tsx`: remove the realtime channel. The `session_questions` query uses `refetchInterval: 30_000` and `refetchIntervalInBackground: false`, and is invalidated after the user's own submit or vote. `admin.tsx` keeps realtime with a short (~500ms) debounce, filtered by `session_id` when one session is picked.
- `raffle_leaderboard` refetchInterval raised to 60s with `refetchIntervalInBackground: false`. Feedback dashboard raised from 30s to 60s.
- QueryClient defaults: `staleTime` 30s, `retry: 2`, exponential backoff, and `refetchOnWindowFocus` kept on but rate-limited by staleTime.
- Load test: a Python script using test sessions makes bounded concurrent RPC calls against `session_questions` and vote inserts. Before and after, I check `db_health` and `slow_queries`. Test rows are removed afterwards.
- The backend size stays as it is unless the rehearsal shows pressure. If it does, I'll suggest an upgrade and you decide.

## Cheaper AI theme grouping

Today one grouping click costs about 0.016 credits and takes about 3 seconds (the one recorded call). That's already small. These changes cut both cost and repeat clicks:

1. **Skip calls when nothing changed.** If no new questions came in since the last grouping, the button reuses the saved themes instead of calling the AI again.
2. **Share themes between moderators.** Themes are saved per session, so a second moderator or a page reload sees them right away with no new call. Only super admins and that session's moderators can read them.
3. **Short question numbers instead of long IDs.** Each question is sent as "1, 2, 3" rather than a 36-character code. That roughly halves what the AI has to read and write.
4. **Turn off extra AI "thinking".** Sorting questions into a few topics doesn't need step-by-step reasoning. Before switching for good, I'll compare results on the real test questions.
5. **Short cooldown.** The button is disabled for 30 seconds after each run, so repeated clicks can't stack up calls.

### Technical details (AI)

- New `question_themes(session_id pk, themes jsonb, question_count int, latest_question_at timestamptz, updated_at)` table. SELECT is allowed when `can_moderate_session(session_id)`; writes happen only in the server function after its permission check.
- `groupSessionQuestions` returns the cached row when the visible question count and latest timestamp match. Otherwise it calls the AI and upserts the row.
- Prompt sends `[n] body`; the result is mapped back to IDs on the server. Reasoning options are removed (`forceReasoning` off). The model stays `openai/gpt-6-astra` unless the side-by-side check shows a lighter one groups just as well.
