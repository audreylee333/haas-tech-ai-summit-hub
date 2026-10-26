# Make the "+ more tickets" hint useful on every page

The gold raffle band's "+7 more" link becomes a live hint that depends on the page you're on:

```text
Sessions page      "+2 on Rate the day ->"     (links there; counts the sections you haven't rated)
                   when all 3 are done: link hidden
Rate the day page  "2 of 3 day tickets left"   (plain text, no link)
                   when all 3 are done: "All day tickets earned ✓"
Session page       "+2 on Rate the day ->"     (same as Sessions)
```

- The number counts down as sections are rated, so it's always accurate.
- Also fix the band's outdated line "each question submission adds one ticket". It becomes: "Each review, each Rate the day section, and your questions for each session add one ticket."

## Technical details
- `RaffleBanner` gets `dayRemaining` (3 minus distinct day groups rated, computed from `useMyFeedback().general` via `dayGroupOf`) and `onDayPage` (from `useLocation` in the shell).
- Show the hint on mobile too (currently `hidden sm:block`).
