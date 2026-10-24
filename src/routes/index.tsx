import { createFileRoute, Link } from "@tanstack/react-router";
import { SignInButton } from "@/components/SignInButton";
import { Button } from "@/components/ui/button";
import { useUser } from "@/lib/data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Haas Tech Summit Engagement Center — Rate, ask, win" },
      { name: "description", content: "The Haas Tech Summit engagement center: rate sessions, ask speakers questions, and earn raffle entries for prizes revealed at the end of the day." },
      { property: "og:title", content: "Haas Tech Summit Engagement Center" },
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
      <header className="flex items-center justify-between">
        <span className="eyebrow">Haas Tech Club · Summit 2026</span>
        <span className="eyebrow">Oct 30 · Spieker Forum</span>
      </header>

      <section className="rule mt-6 py-12">
        <p className="eyebrow text-signal">(Live)·engagement center◆</p>
        <h1 className="display mt-4 text-6xl sm:text-8xl">
          Tell us how it went. <em className="text-signal">Win something.</em>
        </h1>
        <p className="mt-6 max-w-md text-lg text-muted-foreground">
          Rate sessions as you go and ask the speakers questions live. Every review is a ticket in today's raffle.
        </p>

        <div className="bg-prize shadow-prize mt-10 rounded-sm p-6 text-signal-foreground">
          <p className="font-mono text-xs uppercase tracking-[0.14em]">🎟 The raffle · drawn at the close</p>
          <p className="display mt-2 text-4xl sm:text-5xl">Prizes revealed at the end of the day.</p>
          <p className="mt-3 max-w-lg text-sm font-medium">
            One ticket for each session you rate, plus one for each part of the day you review: pacing, topics, food, venue and more. Up to 20 tickets each. More tickets, better odds.
          </p>
        </div>

        <div className="mt-8">
          {user ? (
            <Button asChild variant="signal" size="lg" className="h-12 text-base">
              <Link to="/sessions">Start earning tickets →</Link>
            </Button>
          ) : (
            <SignInButton />
          )}
        </div>
      </section>

      <section className="rule grid gap-6 pt-6 sm:grid-cols-3">
        {[
          ["01", "Rate", "A 1–5 score and an optional note. Ten seconds, one ticket."],
          ["02", "Ask", "Post questions to the stage and upvote the best ones."],
          ["03", "Win", "Stack tickets all day. Winners are drawn at the close."],
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
