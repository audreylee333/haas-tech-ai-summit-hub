import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useMyFeedback, useSessions, useUser } from "@/lib/data";
import { FeedbackForm } from "@/components/FeedbackForm";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";


export const Route = createFileRoute("/_authenticated/sessions/$id")({
  head: () => ({ meta: [
    { title: "Session review & Q&A · Haas Tech & AI Summit 2026" },
    { name: "description", content: "Review a summit session and send private questions to its moderators." },
    { property: "og:title", content: "Session review & Q&A · Haas Tech & AI Summit 2026" },
    { property: "og:description", content: "Share session feedback and questions with the summit organizers." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: SessionPage,
});

function SessionPage() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const { data: sessions } = useSessions();
  const { data: mine } = useMyFeedback();
  const session = sessions?.find((s) => s.id === id);
  const existing = mine?.sessions.find((f) => f.session_id === id);

  if (!sessions) return <p className="eyebrow">Loading…</p>;
  if (!session) return <p>Session not found. <Link to="/sessions" className="underline">Back</Link></p>;

  return (
    <div>
      <Link to="/sessions" className="eyebrow hover:text-foreground">← All sessions</Link>
      <p className="eyebrow mt-6">{session.start_time} · {session.kind} · {session.location}</p>
      <h1 className="display mt-2 text-5xl">{session.title}</h1>
      {session.subtitle && <p className="mt-2 text-lg text-muted-foreground">{session.subtitle}</p>}
      {session.speakers && <p className="mt-2 text-sm">{session.speakers}</p>}

      <section className="rule mt-8 pt-5">
        <p className="eyebrow mb-3">{existing ? "Your rating · edit anytime" : "Rate this session"}</p>
        <FeedbackForm
          isNew={!existing}
          initialRating={existing?.rating}
          initialComment={existing?.comment}
          placeholder="What stood out? What could be better? (optional)"
          onSubmit={async (rating, comment) => {
            const { error } = await supabase
              .from("session_feedback")
              .upsert(
                { session_id: id, rating, comment, user_id: (await supabase.auth.getUser()).data.user!.id, updated_at: new Date().toISOString() },
                { onConflict: "user_id,session_id" },
              );
            if (error) throw error;
            await qc.invalidateQueries({ queryKey: ["my-feedback"] });
          }}
        />
      </section>

      {session.qa_enabled && <QA sessionId={id} />}
    </div>
  );
}

function QA({ sessionId }: { sessionId: string }) {
  const qc = useQueryClient();
  const { data: user } = useUser();
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);

  const mine = useQuery({
    queryKey: ["my-questions", sessionId],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("questions")
        .select("id, body, answered, created_at")
        .eq("session_id", sessionId)
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  return (
    <section className="rule mt-10 pt-5">
      <p className="eyebrow">Q&amp;A</p>
      <h2 className="display mt-1 text-3xl">Have a question for the speakers?</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Send it in and our moderators will pick questions to put to the stage.
      </p>
      <form
        className="mt-4 space-y-3"
        onSubmit={async (e) => {
          e.preventDefault();
          const text = body.trim();
          if (text.length < 3) { toast.error("Question is too short"); return; }
          setBusy(true);
          const { error } = await supabase.from("questions").insert({ session_id: sessionId, body: text.slice(0, 500), user_id: user!.id });
          setBusy(false);
          if (error) { toast.error("Could not send your question"); return; }
          setBody("");
          toast.success("Sent to the moderators");
          qc.invalidateQueries({ queryKey: ["my-questions", sessionId] });
        }}
      >
        <Textarea value={body} onChange={(e) => setBody(e.target.value)} maxLength={500} placeholder="Your question for the speakers…" className="bg-card" />
        <Button type="submit" disabled={busy} className="w-full">Send question</Button>
      </form>

      {mine.data && mine.data.length > 0 && (
        <div className="mt-6">
          <p className="eyebrow mb-2">You sent</p>
          <ul className="space-y-2">
            {mine.data.map((q) => (
              <li key={q.id} className="rounded-sm border bg-card p-3">
                <p className="break-words">{q.body}</p>
                {q.answered && <p className="eyebrow mt-1 text-signal">Asked on stage</p>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
