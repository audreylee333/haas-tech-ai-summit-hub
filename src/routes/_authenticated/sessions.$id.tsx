import { QUESTION_REFRESH_MS } from "@/lib/refresh";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useMyFeedback, useSessions, useUser } from "@/lib/data";
import { FeedbackForm } from "@/components/FeedbackForm";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { canSubmitQuestions } from "@/lib/questions";


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

      {canSubmitQuestions(session) && <QA sessionId={id} />}

      <section className="rule mt-10 pt-5">
        <p className="eyebrow mb-1">{existing ? "Your rating · edit anytime" : "Rate this session"}</p>
        <p className="mb-3 text-xs text-muted-foreground">Your ratings and comments are shared with organizers without your name. Only your questions and ticket count are linked to you.</p>
        <FeedbackForm
          isNew={!existing}
          initialRating={existing?.rating}
          initialComment={existing?.comment}
          placeholder="What stood out? What could be better? (optional)"
          onSubmit={async (rating, comment) => {
            const user = (await supabase.auth.getUser()).data.user;
            if (!user) throw new Error("Please sign in to submit feedback");
            const { error } = await supabase
              .from("session_feedback")
              .upsert(
                { session_id: id, rating, comment, user_id: user.id, updated_at: new Date().toISOString() },
                { onConflict: "user_id,session_id" },
              );
            if (error) throw error;
            await qc.invalidateQueries({ queryKey: ["my-feedback"] });
          }}
        />
      </section>

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
      if (!user) return [];
      const { data, error } = await supabase
        .from("questions")
        .select("id, body, answered, created_at")
        .eq("session_id", sessionId)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const everyone = useQuery({
    queryKey: ["session-questions", sessionId],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("session_questions", { _session_id: sessionId });
      if (error) throw error;
      return data;
    },
    refetchInterval: QUESTION_REFRESH_MS,
    refetchIntervalInBackground: false,
  });

  // Attendees don't need instant updates: refresh every 30s while visible, and after their own actions.
  const [voting, setVoting] = useState<string | null>(null);
  const vote = async (questionId: string, voted: boolean) => {
    if (!user || voting) return;
    setVoting(questionId);
    const { error } = voted
      ? await supabase.from("question_votes").delete().eq("question_id", questionId).eq("user_id", user.id)
      : await supabase.from("question_votes").insert({ question_id: questionId, user_id: user.id });
    if (error) toast.error("Could not update your vote");
    await qc.invalidateQueries({ queryKey: ["session-questions", sessionId] });
    setVoting(null);
  };

  return (
    <section className="rule mt-10 pt-5">
      <p className="eyebrow">Q&amp;A</p>
      <h2 className="display mt-1 text-3xl">Have questions for the speakers?</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        See what others are asking. Upvote the questions you want to hear. Moderators pick what gets asked on stage.
      </p>
      <p className="mt-2 text-sm font-medium text-signal">Your first submission for this session earns one raffle ticket. Send as many more as you like.</p>
      <form
        className="mt-4 space-y-3"
        onSubmit={async (e) => {
          e.preventDefault();
          if (busy || !user) return;
          const text = body.replace(/\s+/g, " ").trim();
          if (text.length < 3) { toast.error("Please add your questions"); return; }
          setBusy(true);
          const { error } = await supabase.from("questions").insert({ session_id: sessionId, body: text.slice(0, 500), user_id: user.id });
          setBusy(false);
          if (error) { toast.error("Could not send your questions"); return; }
          setBody("");
          const hadTicket = (mine.data?.length ?? 0) > 0;
          toast.success(hadTicket
            ? "Questions sent. You've already earned your question ticket for this session, and more questions are always welcome."
            : "Questions sent to the moderators. +1 raffle ticket!");
          qc.invalidateQueries({ queryKey: ["my-questions", sessionId] });
          qc.invalidateQueries({ queryKey: ["session-questions", sessionId] });
          qc.invalidateQueries({ queryKey: ["my-feedback"] });
        }}
      >
        <Textarea aria-label="Your questions for the speakers" value={body} onChange={(e) => setBody(e.target.value)} maxLength={500} placeholder="Your questions for the speakers…" className="bg-card" />
        <Button type="submit" disabled={busy || !user} className="w-full">{busy ? "Sending…" : "Send questions"}</Button>
      </form>

      {mine.data && mine.data.some((q) => q.answered) && (
        <p className="eyebrow mt-4 text-signal">One of your submissions was asked on stage 🎤</p>
      )}

      <div className="mt-8">
        <p className="eyebrow mb-2">What others are asking · {everyone.data?.length ?? 0}</p>
        {everyone.data?.length === 0 && <p className="text-sm text-muted-foreground">No questions yet. Be the first!</p>}
        <ul className="space-y-2">
          {everyone.data?.map((q) => (
            <li key={q.id} className="flex gap-3 rounded-sm border bg-card p-3">
              <button
                type="button"
                disabled={q.is_mine || voting !== null}
                aria-pressed={q.voted_by_me}
                aria-label={q.voted_by_me ? "Remove upvote" : "Upvote"}
                onClick={() => vote(q.id, q.voted_by_me)}
                className={cn(
                  "flex w-12 shrink-0 flex-col items-center rounded-sm border py-1 font-mono text-sm",
                  q.voted_by_me ? "border-signal bg-signal text-signal-foreground" : "border-input hover:border-signal",
                  q.is_mine && "cursor-default opacity-60",
                )}
              >
                <span aria-hidden>▲</span>
                {q.vote_count}
              </button>
              <div className="min-w-0 flex-1">
                <p className="break-words">{q.body}</p>
                {q.is_mine && <p className="eyebrow mt-1">Yours</p>}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
