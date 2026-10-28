# Faster "Signing you in" screen

## What's slow today
After Google sends someone back, the app makes several server round trips one after another before showing the page:

```text
check who you are (server) -> look up your role (server) -> go to page
-> check who you are again (server) -> page data, each asking "who are you" again (server)
```
Each "who are you" check goes over the network, even though the browser already holds that answer. On phone data that adds up to a few seconds.

## Changes
1. **Read identity from the browser, not the server.** Swap the network "who are you" check for the instant local session read in the sign-in redirect, the signed-in area's gate, and the data helpers (my feedback, my role, user). The database still enforces permissions on every read, so security doesn't change.
2. **Skip the role lookup when the destination is already known.** If the person was headed somewhere (like the moderator desk link), go straight there. Only look up the role when choosing between moderator desk and sessions.
3. **Save the role lookup for reuse.** When the sign-in step does look up the role, store it so the desk/header doesn't ask again.
4. **Start loading the wordmark early** so the transition screen and header paint without waiting on the image.

## Expected result
Roughly 3-4 fewer sequential server trips; the transition should drop from a few seconds to well under one on a typical phone.

## Verification
- Timing check with a simulated return from Google, before and after.
- Sign in as moderator and attendee test accounts: each lands on the right page.
- Run existing tests.

## Technical details
- `supabase.auth.getUser()` -> `getSession()` in `_authenticated/route.tsx` beforeLoad, `auth.tsx` go(), and `useUser`/`useMyFeedback`/`useStaffRole` in `src/lib/data.ts`.
- `auth.tsx`: when `redirect` is safe, navigate immediately; otherwise query `user_roles` and `queryClient.setQueryData(["staff-role"], pickStaffRole(...))`.
- Add `<link rel="preload" as="image">` for the wordmark in root head.
