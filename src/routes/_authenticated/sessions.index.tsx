import { createFileRoute, Link } from "@tanstack/react-router";
import { useMyFeedback, useSessions } from "@/lib/data";

export const Route = createFileRoute("/_authenticated/sessions/")({
  head: () => ({ meta: [{ title: "Sessions · Haas Tech & AI Summit 2026" }] }),
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
            <Link
              to="/sessions/$id"
              params={{ id: s.id }}
              className="grid grid-cols-[4.5rem_1fr_auto] items-start gap-3 py-4 transition-colors hover:bg-card"
            >
              <span className="font-mono text-xs pt-1">{s.start_time}</span>
              <span>
                <span className="eyebrow">{s.kind}{s.location !== "Spieker Forum" && ` · ${s.location}`}</span>
                <span className="display block text-2xl">{s.title}</span>
                {s.speakers && <span className="block text-sm text-muted-foreground">{s.speakers}</span>}
              </span>
              <span className="flex flex-col items-end gap-1 pt-1">
                {reviewed.has(s.id) ? (
                  <span className="font-mono text-xs text-success">✓ Rated</span>
                ) : (
                  <span className="font-mono text-xs text-signal">Rate →</span>
                )}
                {s.qa_enabled && <span className="eyebrow">Q&amp;A</span>}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
