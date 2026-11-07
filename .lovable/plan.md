# Prepare the project for a public GitHub repo

## What goes to GitHub
Only the app's code and notes go to GitHub. The database does not, so attendee emails, ratings, comments, questions, votes and raffle results never leave Lovable Cloud. You don't need to wipe attendee data to make the repo public.

## What I found in the files
- No attendee data and no private keys. The one key in the files is a public key that's meant to be visible, and the database rules still protect everything.
- Staff emails and first names show up in a few old planning notes and the task list (audrey.lee@berkeley.edu, audrey.yupei.lee@gmail.com, audreylee911@gmail.com, plus Yu Jin, Moe, Tony, Joan, Jonathan, Bhavya, Ayushman).

## Change
- Take the emails and names out of the old planning notes and the task list. Use role words like "super admin", "test moderator" and "attendee test account" instead.
- No changes to the app, the database, or anyone's access.

## Worth knowing
- GitHub keeps the full history, so older versions of those notes stay visible unless you start a fresh repo. The emails are staff work addresses, so the risk is low.
- If you also want attendee data deleted from the database, that's a separate decision. It would also erase the results and your CSV export, so download the CSV first.
