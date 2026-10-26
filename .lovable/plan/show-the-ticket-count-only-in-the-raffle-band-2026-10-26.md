# Show the ticket count only in the raffle band

## What changes
- Remove the small ticket count in the top-right header on Sessions and Rate the day.
- The gold raffle band in the middle of the page stays as it is, with the ticket count and prize details.
- The moderator desk is unchanged: it still has no band and no count.

## Technical details
- In `src/routes/_authenticated/route.tsx`, delete the header ticket pill (the `!isDesk` block around line 42). Keep the `RaffleBanner` block.
