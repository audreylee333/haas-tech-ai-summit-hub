import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin, useSessions } from "@/lib/data";
import { DAY_CATEGORIES } from "@/lib/raffle";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Organizers — Haas Tech Summit Live" }, { name: "robots", content: "noindex" }] }),
  component: AdminPage,
});

function AdminPage() {
  const { data: isAdmin, isLoading } = useIsAdmin();
  if (isLoading) return <p className="eyebrow">Loading…</p>;
  if (!isAdmin) return <p className="text-muted-foreground">This page is for organizers only.</p>;
  return (
    <div>
      <h1 className="display text-5xl">Organizer desk.</h1>
      <Tabs defaultValue="qa" className="mt-6">
        <TabsList>
          <TabsTrigger value="qa">Q&amp;A</TabsTrigger>
          <TabsTrigger value="feedback">Feedback</TabsTrigger>
          <TabsTrigger value="raffle">Raffle</TabsTrigger>
        </TabsList>
        <TabsContent value="qa"><QAModeration /></TabsContent>
        <TabsContent value="feedback"><FeedbackDashboard /></TabsContent>
        <TabsContent value="raffle"><Raffle /></TabsContent>
      </Tabs>
    </div>
  );
}

function QAModeration() {
  const qc = useQueryClient();
  const { data: sessions } = useSessions();
  const [sessionId, setSessionId] = useState<string>("all");
  const [filter, setFilter] = useState<"open" | "answered" | "hidden" | "all">("open");
  const [search, setSearch] = useState("");

  const questions = useQuery({
    queryKey: ["admin-questions"],
    queryFn: async () => {
      const { data, error } = await supabase.from("questions").select("*").order("vote_count", { ascending: false }).order("created_at");
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    const ch = supabase
      .channel(`admin-qa-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "questions" }, () => qc.invalidateQueries({ queryKey: ["admin-questions"] }))
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [qc]);

  const list = useMemo(
    () =>
      (questions.data ?? []).filter((q) => {
        if (sessionId !== "all" && q.session_id !== sessionId) return false;
        if (filter === "open" && (q.answered || q.hidden)) return false;
        if (filter === "answered" && !q.answered) return false;
        if (filter === "hidden" && !q.hidden) return false;
        return !search || q.body.toLowerCase().includes(search.toLowerCase());
      }),
    [questions.data, sessionId, filter, search],
  );

  const update = async (id: string, patch: { answered?: boolean; hidden?: boolean }) => {
    const { error } = await supabase.from("questions").update(patch).eq("id", id);
    if (error) toast.error("Update failed");
    qc.invalidateQueries({ queryKey: ["admin-questions"] });
  };
  const toggleQa = async (id: string, qa_enabled: boolean) => {
    const { error } = await supabase.from("sessions").update({ qa_enabled }).eq("id", id);
    if (error) toast.error("Update failed");
    qc.invalidateQueries({ queryKey: ["sessions"] });
  };
  const current = sessions?.find((s) => s.id === sessionId);

  return (
    <div className="space-y-4 pt-4">
      <div className="flex flex-wrap gap-2">
        <select value={sessionId} onChange={(e) => setSessionId(e.target.value)} className="h-9 rounded-sm border border-input bg-card px-2 text-sm">
          <option value="all">All sessions</option>
          {sessions?.map((s) => (
            <option key={s.id} value={s.id}>{s.start_time} · {s.title}</option>
          ))}
        </select>
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search…" className="h-9 max-w-48 bg-card" />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {(["open", "answered", "hidden", "all"] as const).map((f) => (
          <Button key={f} size="sm" variant={filter === f ? "default" : "outline"} onClick={() => setFilter(f)} className="capitalize">{f}</Button>
        ))}
        {current && (
          <label className="ml-auto flex items-center gap-2 text-sm">
            Q&amp;A open <Switch checked={current.qa_enabled} onCheckedChange={(v) => toggleQa(current.id, v)} />
          </label>
        )}
      </div>
      <p className="eyebrow">{list.length} questions</p>
      <ul className="space-y-2">
        {list.map((q) => {
          const s = sessions?.find((x) => x.id === q.session_id);
          return (
            <li key={q.id} className={cn("flex gap-3 rounded-sm border bg-card p-3", q.hidden && "opacity-50")}>
              <span className="w-10 shrink-0 text-center font-mono text-lg">▲{q.vote_count}</span>
              <div className="min-w-0 flex-1">
                <p className="break-words">{q.body}</p>
                <p className="eyebrow mt-1">{q.author_name ?? "Attendee"}{sessionId === "all" && s && ` · ${s.title}`}</p>
              </div>
              <div className="flex shrink-0 flex-col gap-1">
                <Button size="sm" variant={q.answered ? "outline" : "signal"} onClick={() => update(q.id, { answered: !q.answered })}>
                  {q.answered ? "Reopen" : "Answered"}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => update(q.id, { hidden: !q.hidden })}>
                  {q.hidden ? "Unhide" : "Hide"}
                </Button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function FeedbackDashboard() {
  const { data: sessions } = useSessions();
  const [openId, setOpenId] = useState<string | null>(null);
  const fb = useQuery({
    queryKey: ["admin-feedback"],
    queryFn: async () => {
      const [s, g] = await Promise.all([
        supabase.from("session_feedback").select("*").order("created_at", { ascending: false }),
        supabase.from("general_feedback").select("*").order("created_at", { ascending: false }),
      ]);
      if (s.error) throw s.error;
      if (g.error) throw g.error;
      return { sessions: s.data, general: g.data };
    },
    refetchInterval: 30_000,
  });

  const rows = [
    ...(sessions ?? []).map((s) => ({ key: s.id, label: s.title, sub: `${s.start_time} · ${s.kind}`, items: fb.data?.sessions.filter((f) => f.session_id === s.id) ?? [] })),
    ...DAY_CATEGORIES.map((c) => ({ key: c.id, label: c.label, sub: "Rest of the day", items: fb.data?.general.filter((f) => f.category === c.id) ?? [] })),
  ];

  return (
    <div className="pt-4">
      <p className="eyebrow">{(fb.data?.sessions.length ?? 0) + (fb.data?.general.length ?? 0)} responses total</p>
      <ul className="mt-3">
        {rows.map((r) => {
          const avg = r.items.length ? r.items.reduce((a, b) => a + b.rating, 0) / r.items.length : null;
          const comments = r.items.filter((i) => i.comment);
          return (
            <li key={r.key} className="rule">
              <button onClick={() => setOpenId(openId === r.key ? null : r.key)} className="grid w-full grid-cols-[1fr_auto_auto] items-center gap-4 py-3 text-left">
                <span>
                  <span className="eyebrow">{r.sub}</span>
                  <span className="block font-medium">{r.label}</span>
                </span>
                <span className="font-mono text-sm text-muted-foreground">{r.items.length} · 💬{comments.length}</span>
                <span className="display w-14 text-right text-3xl">{avg ? avg.toFixed(1) : "–"}</span>
              </button>
              {openId === r.key && (
                <div className="space-y-2 pb-4">
                  {comments.length === 0 && <p className="text-sm text-muted-foreground">No comments yet.</p>}
                  {comments.map((c) => (
                    <p key={c.id} className="rounded-sm border bg-card p-3 text-sm">
                      <span className="mr-2 font-mono text-signal">{c.rating}/5</span>{c.comment}
                    </p>
                  ))}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function Raffle() {
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const board = useQuery({
    queryKey: ["raffle-board"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("raffle_leaderboard");
      if (error) throw error;
      return data;
    },
  });
  const draws = useQuery({
    queryKey: ["raffle-draws"],
    queryFn: async () => {
      const { data, error } = await supabase.from("raffle_draws").select("*").order("drawn_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
  const total = board.data?.reduce((a, b) => a + Number(b.entries), 0) ?? 0;
  const latest = draws.data?.[0];

  return (
    <div className="space-y-6 pt-4">
      <div className="rounded-sm border bg-card p-6 text-center">
        <p className="eyebrow">{board.data?.length ?? 0} attendees · {total} tickets</p>
        {latest && (
          <div className="mt-4">
            <p className="eyebrow">Latest winner</p>
            <p className="display text-5xl text-signal">{latest.display_name ?? "Attendee"}</p>
            <p className="font-mono text-sm">{latest.email} · {latest.entries} entries</p>
          </div>
        )}
        <Button
          variant="signal"
          size="lg"
          className="mt-6 h-12"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            const { error } = await supabase.rpc("draw_raffle_winner");
            setBusy(false);
            if (error) toast.error(error.message.includes("No eligible") ? "No eligible entries left" : "Draw failed");
            qc.invalidateQueries({ queryKey: ["raffle-draws"] });
          }}
        >
          {latest ? "Draw another winner" : "Draw a winner"}
        </Button>
        <p className="mt-2 text-xs text-muted-foreground">Weighted by tickets. Previous winners are excluded.</p>
      </div>

      {draws.data && draws.data.length > 1 && (
        <div>
          <p className="eyebrow mb-2">All winners</p>
          {draws.data.map((d, i) => (
            <p key={d.id} className="rule py-2 text-sm">#{draws.data.length - i} · {d.display_name} · {d.email}</p>
          ))}
        </div>
      )}

      <div>
        <p className="eyebrow mb-2">Entries by attendee</p>
        {board.data?.map((b) => (
          <div key={b.user_id} className="rule flex justify-between py-2 text-sm">
            <span>{b.display_name} <span className="text-muted-foreground">{b.email}</span></span>
            <span className="font-mono">{b.entries}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
