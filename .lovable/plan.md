# Three access levels: super admin, moderator, attendee

## Who gets what

| Level | People | Sees |
|---|---|---|
| Super admin | audrey.lee@berkeley.edu, Yu Jin, Moe (alhassan), Tony | Everything: all Q&A, all feedback, CSV download, raffle totals and draws |
| Moderator | Joan, Jonathan, Bhavya, audrey.yupei.lee@gmail.com (test) | Q&A desk only, for their own sessions plus the opening and closing keynotes. No feedback, no raffle |
| Attendee | Everyone else, including Ayushman and audreylee911@gmail.com | Same as today |

Everyone, including super admins and moderators, can still rate sessions and send questions for tickets.

## Session assignments (moderators)

- Joan: Fintech, Rewritten
- Bhavya: When Your Agent Can't Afford to Fail (Brooke Hopkins spotlight)
- Jonathan: Cybersecurity, Rewritten
- audrey.yupei.lee@gmail.com (test): Fintech, Rewritten, so you can see exactly what Joan sees
- All moderators: The Reinvention Mandate (opening keynote) and Where Intelligence Goes Next (closing keynote)

Yu Jin and Tony are super admins, so they already see every session.

## What changes on screen

- Moderators land on the Moderator desk but only see the Q&A tab, and the session picker lists only their sessions.
- The Feedback and Raffle tabs appear only for super admins.

## Technical details

- Add `moderator` to the `app_role` enum; keep `admin` as super admin.
- Add a `role` column to `moderator_emails` (default `moderator`) and update the triggers to grant the matching role and remove stale roles. Set the four super admins to `admin`; insert the moderator emails. If audrey.yupei.lee@gmail.com already has a profile, the trigger grants the role immediately.
- New `moderator_assignments(email, session_id)` table plus an "all moderators" flag on the two keynotes; security-definer `can_moderate_session(session_id)` = admin OR assigned.
- Questions SELECT and moderation UPDATE policies use `can_moderate_session`; feedback, leaderboard and draw stay admin-only.
- `groupSessionQuestions` server function checks `can_moderate_session` instead of admin.
- Frontend: role hook returns `admin | moderator | attendee`; admin.tsx hides Feedback/Raffle tabs and filters the session picker.
- Update AGENTS.md and the moderator memory; add tests for tab visibility and session filtering, plus a live check signed in as the test moderator that feedback rows and raffle totals are refused.
