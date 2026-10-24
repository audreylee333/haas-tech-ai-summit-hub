import { createFileRoute, Link } from "@tanstack/react-router";
import { useMyFeedback, useSessions } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export const Route = createFileRoute("/_authenticated/sessions/")({
  head: () => ({ meta: [
    { title: "Session feedback · Haas Tech & AI Summit 2026" },
    { name: "description", content: "Submit session feedback and private questions at the Haas Tech & AI Summit 2026." },
    { property: "og:title", content: "Session feedback · Haas Tech & AI Summit 2026" },
    { property: "og:description", content: "Share your session reviews and earn raffle entries at the summit." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: SessionsPage,
});

function SessionsPage() {
  const { data: sessions, isLoading } = useSessions();
  const { data: mine } = useMyFeedback();
  const reviewed = new Set(mine?.sessions.map((s) => s.session_id));

  return (
    <div>
      <p className="eyebrow">Friday, Oct 30 · {sessions?.length ?? "…"} sessions</p>
      <h1 className="display mt-2 text-5xl">Pick a session.</h1>
      <p className="mt-2 text-muted-foreground">
        Each one you rate adds a raffle ticket. {reviewed.size > 0 && `You've rated ${reviewed.size}.`}
      </p>
      {isLoading && <p className="eyebrow mt-8">Loading…</p>}
      <ul className="mt-6">
        {sessions?.map((s) => (
          <li key={s.id} className="rule">
            <div className="grid grid-cols-[3.5rem_minmax(0,1fr)] items-start gap-3 py-5 sm:grid-cols-[4.5rem_minmax(0,1fr)_auto] sm:gap-4">
              <span className="font-mono text-xs pt-1">{s.start_time}</span>
              <span>
                <span className="eyebrow">{s.kind}{s.location !== "Spieker Forum" && ` · ${s.location}`}</span>
                <Link to="/sessions/$id" params={{ id: s.id }} className="display block text-2xl hover:text-signal focus-visible:outline focus-visible:outline-ring">{s.title}</Link>
                {s.speakers && <span className="block text-sm text-muted-foreground">{s.speakers}</span>}
              </span>
              <span className="col-start-2 flex flex-wrap items-center gap-2 sm:col-start-auto sm:flex-col sm:items-end">
                {reviewed.has(s.id) && <span className="font-mono text-xs text-success">✓ Rated</span>}
                <Button asChild variant={reviewed.has(s.id) ? "outline" : "signal"} className="h-10 min-w-28">
                  <Link to="/sessions/$id" params={{ id: s.id }} aria-label={`${reviewed.has(s.id) ? "Edit feedback for" : "Submit feedback for"} ${s.title}`}>
                    {reviewed.has(s.id) ? "Edit review" : "Submit"}<ArrowRight />
                  </Link>
                </Button>
                {s.qa_enabled && <span className="eyebrow">Q&amp;A</span>}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
