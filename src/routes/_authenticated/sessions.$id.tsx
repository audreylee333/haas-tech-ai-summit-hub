import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useMyFeedback, useSessions, useUser } from "@/lib/data";
import { FeedbackForm } from "@/components/FeedbackForm";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/sessions/$id")({
  head: () => ({ meta: [{ title: "Session — Haas Tech Summit Live" }] }),
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

  const questions = useQuery({
    queryKey: ["questions", sessionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("questions")
        .select("*")
        .eq("session_id", sessionId)
        .eq("hidden", false)
        .order("vote_count", { ascending: false })
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
  });
  const votes = useQuery({
    queryKey: ["my-votes", sessionId],
    queryFn: async () => {
      const { data } = await supabase.from("question_votes").select("question_id");
      return new Set((data ?? []).map((v) => v.question_id));
    },
  });

  useEffect(() => {
    const ch = supabase
      .channel(`qa-${sessionId}-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "questions", filter: `session_id=eq.${sessionId}` }, () =>
        qc.invalidateQueries({ queryKey: ["questions", sessionId] }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [sessionId, qc]);

  const toggleVote = async (qid: string, voted: boolean) => {
    const { error } = voted
      ? await supabase.from("question_votes").delete().eq("question_id", qid).eq("user_id", user!.id)
      : await supabase.from("question_votes").insert({ question_id: qid, user_id: user!.id });
    if (error) toast.error("Couldn't record vote");
    qc.invalidateQueries({ queryKey: ["my-votes", sessionId] });
    qc.invalidateQueries({ queryKey: ["questions", sessionId] });
  };

  return (
    <section className="rule mt-10 pt-5">
      <p className="eyebrow">Live Q&amp;A</p>
      <h2 className="display mt-1 text-3xl">Ask the stage.</h2>
      <form
        className="mt-4 space-y-3"
        onSubmit={async (e) => {
          e.preventDefault();
          const text = body.trim();
          if (text.length < 3) { toast.error("Question is too short"); return; }
          setBusy(true);
          const { error } = await supabase.from("questions").insert({ session_id: sessionId, body: text.slice(0, 500), user_id: user!.id });
          setBusy(false);
          if (error) { toast.error("Could not post your question"); return; }
          setBody("");
          toast.success("Question sent to the moderators");
          qc.invalidateQueries({ queryKey: ["questions", sessionId] });
        }}
      >
        <Textarea value={body} onChange={(e) => setBody(e.target.value)} maxLength={500} placeholder="Your question for the speakers…" className="bg-card" />
        <Button type="submit" disabled={busy} className="w-full">Post question</Button>
      </form>

      <ul className="mt-6 space-y-2">
        {questions.data?.length === 0 && <p className="text-sm text-muted-foreground">No questions yet. Be the first.</p>}
        {questions.data?.map((q) => {
          const voted = votes.data?.has(q.id) ?? false;
          const own = q.user_id === user?.id;
          return (
            <li key={q.id} className={cn("flex gap-3 rounded-sm border bg-card p-3", q.answered && "opacity-60")}>
              <button
                onClick={() => !own && toggleVote(q.id, voted)}
                disabled={own}
                aria-label={voted ? "Remove upvote" : "Upvote"}
                className={cn(
                  "flex w-12 shrink-0 flex-col items-center rounded-sm border py-1 font-mono text-sm",
                  voted ? "border-signal bg-signal text-signal-foreground" : "border-input hover:border-foreground",
                  own && "cursor-default opacity-60",
                )}
              >
                <span>▲</span>
                <span>{q.vote_count}</span>
              </button>
              <div className="min-w-0">
                <p className="break-words">{q.body}</p>
                <p className="eyebrow mt-1">
                  {q.author_name ?? "Attendee"}{own && " · you"}{q.answered && " · answered"}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
