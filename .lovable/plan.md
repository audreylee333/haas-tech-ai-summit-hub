# Rate the day: 3 themed sections, 1 ticket each

Today there are 7 separate categories, and each one earns a ticket. They become 3 sections, and each section earns 1 ticket, so the day can earn at most 3:

```text
1. The day overall     overall rating + "one thing you'd change"
2. Program             pacing & schedule, topics covered, speaker lineup
3. Venue & logistics   food & coffee, venue, registration & signage
```

## What attendees see
- Three cards instead of seven. Opening a card shows a star rating for each topic in it, plus one optional comment box.
- One Submit button per card. The first submit earns 1 ticket. Later edits never add tickets.
- They can rate just one topic in a section and still earn that section's ticket.
- On the moderator desk, Feedback shows the same 3 sections, with the average for each topic inside them.

## Technical details
- `DAY_CATEGORIES` gets a `group` field (`overall`, `program`, `venue`) and a `DAY_GROUPS` list. Rows still save one per category in `general_feedback` (no schema change). The section comment is stored on the section's first rated category.
- Raffle counts distinct groups, not categories: update `countRaffleEntries` / `data.ts`, plus `raffle_leaderboard()` and `draw_raffle_winner()` with a SQL CASE mapping category to group. Existing ratings convert automatically.
- Rework `day.tsx` into grouped cards and `admin.tsx` feedback into grouped sections.
- Tests: rating 3 topics in one section = 1 ticket; one topic in each of the 3 sections = 3 tickets.
- Update the raffle memory ("1 per category" becomes "1 per day section, 3 max") and the AGENTS.md rule.
