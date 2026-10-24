import { createFileRoute, Link } from "@tanstack/react-router";
import { SignInButton } from "@/components/SignInButton";
import { Button } from "@/components/ui/button";
import { useUser } from "@/lib/data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Haas Tech Summit Live — Rate sessions, ask questions, win" },
      { name: "description", content: "Your companion for the Haas Tech Summit: rate every session, ask the speakers questions, and earn raffle entries." },
      { property: "og:title", content: "Haas Tech Summit Live" },
      { property: "og:description", content: "Rate sessions, ask speakers questions, and earn raffle entries all day." },
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

      <section className="rule mt-6 flex flex-1 flex-col justify-center py-12">
        <p className="eyebrow">(Live)·audience desk◆</p>
        <h1 className="display mt-4 text-6xl sm:text-8xl">
          Tell us how <em className="text-signal">it went.</em>
        </h1>
        <p className="mt-6 max-w-md text-lg text-muted-foreground">
          Rate sessions as you go, ask the speakers questions live, and every review earns you a raffle ticket for the end of the day.
        </p>
        <div className="mt-10">
          {user ? (
            <Button asChild variant="signal" size="lg" className="h-12 text-base">
              <Link to="/sessions">Go to sessions →</Link>
            </Button>
          ) : (
            <SignInButton />
          )}
        </div>
      </section>

      <section className="rule grid gap-6 pt-6 sm:grid-cols-3">
        {[
          ["01", "Rate", "A 1–5 score and an optional note. Ten seconds."],
          ["02", "Ask", "Post questions to the stage and upvote the best ones."],
          ["03", "Win", "One ticket per session reviewed, plus more for rating the day."],
        ].map(([n, t, d]) => (
          <div key={n}>
            <p className="eyebrow">{n}</p>
            <p className="display mt-1 text-3xl">{t}</p>
            <p className="mt-1 text-sm text-muted-foreground">{d}</p>
          </div>
        ))}
      </section>
    </main>
  );
}
