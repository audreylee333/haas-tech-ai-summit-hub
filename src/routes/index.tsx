import { createFileRoute, Link } from "@tanstack/react-router";
import { SignInButton } from "@/components/SignInButton";
import { Button } from "@/components/ui/button";
import { useIsStaff as useIsAdmin, useUser } from "@/lib/data";
import wordmarkAsset from "@/assets/wordmark.png.asset.json";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Haas Tech & AI Summit 2026: rate, ask, win" },
      { name: "description", content: "Sign in to rate sessions, send questions to the speakers, and earn raffle tickets at the Haas Tech & AI Summit 2026." },
      { property: "og:title", content: "Haas Tech & AI Summit 2026" },
      { property: "og:description", content: "Rate sessions, send questions to the speakers, and earn raffle tickets." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const { data: user } = useUser();
  const { data: isAdmin } = useIsAdmin();
  return (
    <main className="dotgrid mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-10">
      <img src={wordmarkAsset.url} alt="Where Intelligence Goes Next" className="w-full max-w-[15rem]" />
      <p className="eyebrow mt-7 text-signal">Haas Tech &amp; AI Summit 2026 · Oct 30</p>
      <h1 className="display mt-2 text-5xl">{user ? "You're in." : "Sign in to get started."}</h1>
      <span className="mt-4 block h-1 w-16 bg-signal" aria-hidden="true" />
      <p className="mt-4 text-muted-foreground">
        {user
          ? isAdmin
            ? "Head to the moderator desk, or rate sessions and send questions yourself."
            : "Head to the sessions to rate talks and send questions."
          : "Rate sessions, send questions to the speakers, and help shape the summit. Every rating and question earns a raffle ticket for the end-of-day draw."}
      </p>
      <div className="mt-9">
        {user ? (
          <Button asChild variant="start" size="lg" className="h-14 px-6 text-base font-semibold">
            {isAdmin ? <Link to="/admin">Go to moderator desk →</Link> : <Link to="/sessions">Go to sessions →</Link>}
          </Button>
        ) : (
          <SignInButton />
        )}
      </div>
    </main>
  );
}
