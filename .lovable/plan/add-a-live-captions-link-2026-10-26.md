# Add a "Live captions" link

The QR code opens: https://aberdeen-qr-codes.s3.amazonaws.com/AberLive/UCBerkeley_BAV/VariousEvent/Captions-SinglePage.html

## Where it goes
1. **Signed-in header, on every page.** A small rounded "Live captions" button with a captions icon, next to Sign out. It opens the captions page in a new tab, so people keep their place in the hub. It's always one tap away during any session.
2. **Home and sign-in pages, without signing in.** A short line under the Google button: "Need live captions? Open live captions". Captions shouldn't depend on having an account.
3. **Each session page.** A small "Live captions" link in the session header, since that's where people are while a talk is happening.

The link uses clear text and a label that screen readers can read, plus large enough tap targets for phones. The QR image itself is not shown.

## Technical details
- One shared `CAPTIONS_URL` constant and a `CaptionsLink` component (lucide `Captions` icon, `target="_blank" rel="noopener noreferrer"`, aria-label "Open live captions in a new tab").
- Used in `_authenticated/route.tsx` header, `index.tsx`, `auth.tsx`, and `sessions.$id.tsx`. Styled with existing tokens (outlined pill like Sign out).
- Check in the preview on a phone-sized screen.
