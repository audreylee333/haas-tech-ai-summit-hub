# Test as both moderator and attendee

Yes. Sign in with one Google account as the moderator and a different one as the attendee.

## Steps
1. Add the lead super admin account to the moderator list. If that account has already signed in, it becomes a moderator right away. If not, it becomes one the first time it signs in.
2. Moderator: in your normal browser window, sign in with the lead super admin account. The "Organizers" tab will appear.
3. Attendee: open a private or incognito window and sign in with a different Google account, such as a personal Gmail. That account sees only the attendee view.
4. Try this flow:
   - As the attendee, send a question on a session.
   - As the moderator, check that it shows up, then use "Group by theme".
   - With a third account, or a teammate's, upvote it. You can't upvote your own question.
   - Check the moderator's "Raffle & totals" tab for the attendee's ticket count.

## Technical details
- One data insert into `moderator_emails` for `the lead super admin account`. The existing trigger grants the `admin` role if a profile with that email exists.
- Check that the `user_roles` row was created.
