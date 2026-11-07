# 2026 Haas Tech & AI Summit Hub 

**The problem**
The problem I wanted to solve was two fold: 1) nobody likes giving feedback on events even though it's critical for organizers, and 2) taking live audience Q&A drags on sessions and introduces more logistical overhead. 

**The proposed solution**
For this conference, I want to give attendees a single place where they can go to submit feedback on sessions throughout the day. This should be lightweight to gather as much valuable feedback as we can, and besides feedback on sessions we should also be collecting live audience Q&A for the sessions we're enabling that for. With every feedback submission, I want it to contribute an entry into a raffle we're doing at the end of the day to create an incentive for people to engage, so we'll need some way to identify users, like an email address via auth mechanism.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://haas-tech-ai-summit-hub.lovable.app

## By the numbers (Oct 30, 2026)

| | |
|---|---|
| People who signed in | 86 (76 attendees, 10 staff) |
| Attendees who took part (rated, gave day feedback, or asked) | 59 |
| Session reviews submitted | 248, covering all 13 sessions |
| Average session rating | 4.45 / 5 |
| "Rate the day" answers | 264 from 41 people |
| Questions submitted for live Q&A | 90 |
| Upvotes on questions | 43 |
| Staff on the allowlist (super admins + moderators) | 13 |
| Raffle draws | 2 |

## What it does

- Google sign-in; every attendee is identified by email for the raffle.
- Session ratings and comments, plus a three-section "Rate the day" form.
- Live Q&A: attendees see each other's questions anonymously and upvote them; moderators hide questions, star favorites, and group questions by theme with AI.
- Raffle: 1 ticket per session reviewed, 1 per session with a question, 1 per day-feedback section. Weighted draw that excludes past winners.
- Three access levels (super admin, session-scoped moderator, attendee), all enforced by database rules.
- Analytics page for super admins: turnout and per-attendee activity.

## Getting ready for ~200 people on the day

- **Polling instead of live connections for attendees.** Attendee question lists refresh every 30 seconds; only the moderator desk uses live updates (debounced 500 ms), so upvote bursts don't fan out to every phone.
- **Database indexes** on the busiest lookups (feedback by user and session, questions by session, votes by question).
- **Authorization in the database.** Row-level security plus a few security-definer functions (raffle draw, leaderboard, anonymous question list, vote eligibility), so there are no extra server hops per request.
- **Sensible caching.** Shared query defaults, raffle totals refresh once a minute, and the role lookup is cached after sign-in.
- **Cheaper AI grouping.** Theme results are cached per session and reused until a new question arrives; the regroup button is disabled ("Up to date") until then, with a 30-second cooldown, and prompts use short question numbers instead of IDs.
- **Faster sign-in.** Session checks read the local session instead of calling the server at every step, the logo preloads, and a "Signing you in…" screen hides the hand-off from Google.
- **Double-tap protection** on upvotes and submit buttons.
- **Load rehearsal.** 600 concurrent requests before the event, 0 failures.

## After the event

Submissions are closed and attendee pages show an "event is over, stay tuned for next year" message. Results, staff access, and the CSV export on the organizer desk remain available.

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/f9093140-c5f7-40ee-8c49-f090b2c24cf8).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
