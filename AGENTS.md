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
- Raffle entries = distinct sessions reviewed + distinct day categories reviewed, enforced by unique constraints; mirrored in `src/lib/raffle.ts` for display.
- Organizers are granted via rows in `public.user_roles` (role `admin`).
- Day feedback uses the existing category rating and optional comment fields; the overall category labels its comment as a change suggestion to preserve one raffle entry per category.
