import { createFileRoute, Link } from "@tanstack/react-router";
import { SignInButton } from "@/components/SignInButton";
import { Button } from "@/components/ui/button";
import { useUser } from "@/lib/data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Haas Tech & AI Summit 2026 Engagement Center: rate, ask, win" },
      { name: "description", content: "The Haas Tech & AI Summit 2026 engagement center: rate sessions, ask speakers questions, and earn raffle entries for prizes revealed at the end of the day." },
      { property: "og:title", content: "Haas Tech & AI Summit 2026 Engagement Center" },
      { property: "og:description", content: "Rate sessions, ask speakers questions, and earn raffle entries for end-of-day prizes." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const { data: user } = useUser();
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col px-5 py-8 sm:px-8">
      <header className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <span className="eyebrow">Haas Tech &amp; AI Summit 2026: <span className="text-signal">Where Intelligence Goes Next</span></span>
        <span className="eyebrow">Oct 30 · Spieker Forum</span>
      </header>

      <section className="rule mt-6 py-12">
        <p className="eyebrow text-signal">(Live)·engagement center◆</p>
        <h1 className="display mt-4 text-6xl sm:text-8xl">
          Tell us how it went. <em className="text-signal">Win something.</em>
        </h1>
        <p className="mt-6 max-w-md text-lg text-muted-foreground">
          Rate sessions as you go and send in questions for the speakers. Every review is a ticket in today's raffle, and it helps us make the summit better every year.
        </p>

        <div className="mt-10 rounded-sm border-2 border-dashed border-signal p-6">
          <p className="font-mono text-xs uppercase tracking-[0.14em] text-signal">
            {user ? "✓ You're signed in" : "Step 1 · Start here"}
          </p>
          <p className="display mt-2 text-3xl">
            {user ? "You're in the draw. Keep rating." : "Sign in to start earning tickets."}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {user ? "Head to the sessions to rate and send questions." : "Takes 5 seconds. We use your email to credit each review and question to your raffle tickets."}
          </p>
          <div className="mt-5">
            {user ? (
              <Button asChild variant="start" size="lg" className="h-14 px-6 text-base font-semibold">
                <Link to="/sessions">Go to sessions →</Link>
              </Button>
            ) : (
              <SignInButton />
            )}
          </div>
        </div>

        <div className="bg-prize shadow-prize mt-8 rounded-sm p-6 text-signal-foreground">
          <p className="font-mono text-xs uppercase tracking-[0.14em]">🎟 The raffle · drawn at the close</p>
          <p className="display mt-2 text-4xl sm:text-5xl">Prizes revealed at the end of the day.</p>
          <p className="mt-3 max-w-lg text-sm font-medium">
            One ticket for each session you rate, plus one for each part of the day you review: pacing, topics, food, venue and more. Up to 20 tickets each. More tickets, better odds.
          </p>
          <p className="mt-3 max-w-lg text-sm font-semibold">
            🏆 Winners must be there to claim: stick around until the close. If your name is drawn and you've already headed out, the prize rolls to the next ticket.
          </p>
          <p className="mt-2 max-w-lg text-sm opacity-80">
            And every note you leave goes straight to next year's planning. Your reviews are how we make the summit better each year.
          </p>
        </div>

      </section>

      <section className="rule grid gap-6 pt-6 sm:grid-cols-3">
        {[
          ["01", "Rate", "A 1–5 score and an optional note. Ten seconds, one ticket."],
          ["02", "Ask", "Send questions in; moderators pick what gets asked on stage."],
          ["03", "Win", "Stack tickets all day. Winners are drawn at the close, so stay to claim yours."],
        ].map(([n, t, d]) => (
          <div key={n}>
            <p className="eyebrow text-signal">{n}</p>
            <p className="display mt-1 text-3xl">{t}</p>
            <p className="mt-1 text-sm text-muted-foreground">{d}</p>
          </div>
        ))}
      </section>
    </main>
  );
}
