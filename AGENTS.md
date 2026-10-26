<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Architecture rules
- Attendee data access uses the browser client with RLS (no server functions); privileged actions (raffle draw, leaderboard) are security-definer SQL functions that check `has_role(auth.uid(),'admin')` — keeps authorization in the database.
- Raffle totals and weighted draws count session reviews, one per day-feedback group (DAY_CATEGORIES.group, mirrored by a SQL CASE), plus one per distinct session with a question submission (repeat submissions to a session add nothing); mirror the database calculation in `src/lib/raffle.ts` to keep attendee totals consistent.
- Organizers are granted via rows in `public.user_roles` (role `admin`).
- Day feedback uses the existing category rating and optional comment fields; the overall category labels its comment as a change suggestion to preserve one raffle entry per category.
- Session Q&A rendering uses `canSubmitQuestions`; opening remarks are excluded even when an organizer enables their flag, and database session flags remain the submission-policy authority.
- Attendees read other attendees' questions only through the `session_questions` security-definer RPC, which omits author identity; base `questions` RLS stays own-or-admin.
- Vote eligibility uses the identity-scoped `can_upvote_question` security-definer predicate in vote INSERT RLS; direct question subqueries cannot see other attendees' rows and incorrectly reject their votes.

- Staff access comes from `public.moderator_emails.role` (`admin` = super admin, `moderator` = Q&A only) synced to `user_roles` by `sync_staff_role`; moderator session scope is `moderator_assignments` plus `sessions.open_to_all_moderators`, enforced by `can_moderate_session` in questions RLS and the grouping server function. Change access by editing those rows, never app code.
- AI theme grouping runs in the `groupSessionQuestions` server function (checked with `can_moderate_session`) with gateway code in `src/lib/themes.server.ts`; results are cached per session in `question_themes` and reused while the visible question set is unchanged, to avoid repeat AI calls.
- Attendee Q&A lists poll (`QUESTION_REFRESH_MS`) instead of using realtime; only the moderator desk subscribes to realtime, which keeps upvote bursts from fanning out to every attendee.
