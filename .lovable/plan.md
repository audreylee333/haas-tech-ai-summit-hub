# Attendee vs. moderator experience

Yes, a separate moderator view makes sense. There already is one (the Organizers tab), so this plan builds on it rather than starting over.

## 1. Moderator access by email list
- Keep a short list of moderator emails. Anyone who signs in with Google using one of those emails gets the moderator view automatically.
- Each moderator sees every session (no per-session assignment).
- Everyone else only gets the attendee view. The moderator page shows "organizers only" for anyone not on the list.
- You'll send me the moderator emails, and I'll add them.

## 2. Moderator Q&A view, organized by theme
- Choose a session to see all of its questions, including the attendee's name.
- A **Group by theme** button sorts that session's questions into a few labeled themes (for example "AI in hiring" or "Regulation"). Each theme shows its questions, highest upvotes first.
- Tap the button again whenever new questions come in. New questions that arrive after grouping show in an "Ungrouped / new" section until you regroup.
- Keeps the current tools: mark as Asked, Hide/Unhide, search, filters, and the Q&A on/off switch.
- A flat "All questions" list sorted by upvotes is still there as a backup.

## 3. Attendees: see and upvote questions
- On each session page with Q&A, attendees see the questions everyone else sent for that session, most upvoted first, updating live.
- Questions show without names, so attendees don't know who asked what.
- One upvote per person per question. Tap again to take it back. You can't upvote your own.
- Upvoting **does not** earn raffle tickets. Each question submission still earns one ticket.
- Questions a moderator hides disappear for attendees right away.
- The page copy changes to: "See what others are asking. Upvote the questions you want to hear. Moderators pick what gets asked on stage."

## Technical details
- New `moderator_emails` table, with RLS and no client access. A security-definer function plus a trigger on sign-in/signup gives the `admin` role in `user_roles` when the email matches. A one-time backfill covers people who already signed in.
- Public question list: a security-definer RPC `session_questions(session_id)` returns `id, body, vote_count, created_at, voted_by_me, is_mine` for non-hidden questions on Q&A-enabled sessions. It never returns `user_id` or `author_name`. The base table's RLS stays "own or admin".
- Reuse the existing `question_votes` table and `sync_vote_count` trigger. Add a rule that blocks voting on your own or hidden questions. Raffle math doesn't change because votes aren't counted.
- Theme grouping: a `createServerFn` with `requireSupabaseAuth` checks `has_role(admin)`, loads the session's questions, and calls Lovable AI (`openai/gpt-6-astra`, Responses, strict JSON schema `{themes:[{label, question_ids[]}]}`). The result is cached client-side per session. Gateway errors such as 402 or 429 show as a clear toast.
- Update the project memory: the old "no public list, no upvoting" rule becomes "public anonymous list + upvotes, upvotes don't earn tickets, moderators can hide". Update AGENTS.md with the moderator allowlist and the theme server function.
- Tests: upvotes don't change raffle totals, and attendee questions never include author fields.
