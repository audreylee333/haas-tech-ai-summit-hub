# Make the moderator desk the moderator's home

Moderator access already adds to the attendee view instead of replacing it. Moderators can rate sessions, submit questions, and earn raffle tickets just like attendees. Nothing about that changes.

## Changes
1. **Moderators land on the desk.** After a moderator signs in, they go straight to the moderator desk, on its Q&A tab. Attendees still land on Sessions. If someone followed a specific link, they still go to that link.
2. **Tab order for moderators.** The first tab is **Moderator desk**, renamed from "Organizers". Next come "Sessions" and "Rate the day". Attendees still see only Sessions and Rate the day.
3. **Home page button.** For signed-in moderators, the home page button says "Go to moderator desk →" instead of "Go to sessions →".
4. **Small note on the desk.** One line under the title: "You can also rate sessions and send questions from the Sessions tab, and they count toward your raffle tickets."

## Technical details
- In `auth.tsx`, after sign-in with no explicit redirect, call `has_role` and send moderators to `/admin` and everyone else to `/sessions`. Change the default `SignInButton` redirect so it doesn't force `/sessions`.
- In `_authenticated/route.tsx`, render the moderator link first when `isAdmin`.
- In `index.tsx`, use `useIsAdmin` to pick the CTA link.
- No database or permission changes.
