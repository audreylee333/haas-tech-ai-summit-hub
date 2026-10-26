import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useModeratedSessionIds, useSessions, useStaffRole } from "@/lib/data";
import { deskTabsFor } from "@/lib/access";
import { DAY_CATEGORIES, DAY_GROUPS } from "@/lib/raffle";
import { useServerFn } from "@tanstack/react-start";
import { groupSessionQuestions } from "@/lib/themes.functions";
import { applyThemes, type Theme } from "@/lib/themes";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { MessagesSquare, BarChart3, Trophy, Star, Download } from "lucide-react";
import { toCsv, downloadCsv } from "@/lib/csv";

const deskTab =
  "flex items-center gap-2 rounded-sm border border-border bg-card px-4 py-2.5 text-sm font-semibold text-muted-foreground hover:text-foreground data-[state=active]:border-signal data-[state=active]:bg-signal data-[state=active]:text-signal-foreground";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [
    { title: "Organizers · Haas Tech & AI Summit 2026" },
    { name: "robots", content: "noindex" },
    { name: "description", content: "Organizer desk for summit feedback, private audience questions, and the raffle." },
    { property: "og:title", content: "Organizers · Haas Tech & AI Summit 2026" },
    { property: "og:description", content: "Manage audience engagement at the Haas Tech & AI Summit 2026." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: AdminPage,
});

function AdminPage() {
  const { data: role, isLoading } = useStaffRole();
  if (isLoading) return <p className="eyebrow">Loading…</p>;
  if (!role) return <p className="text-muted-foreground">This page is for moderators only.</p>;
  const tabs = deskTabsFor(role);
  return (
    <div>
      <h1 className="display text-5xl">Moderator desk.</h1>
      <p className="mt-2 text-sm text-muted-foreground">You can also rate sessions and send questions from the Sessions tab, and they count toward your raffle tickets.</p>
      <Tabs defaultValue="qa" className="mt-6">
        <TabsList className="h-auto w-full justify-start gap-2 rounded-none bg-transparent p-0">
          <TabsTrigger value="qa" className={deskTab}><MessagesSquare className="size-4" />Q&amp;A</TabsTrigger>
          {tabs.includes("feedback") && <TabsTrigger value="feedback" className={deskTab}><BarChart3 className="size-4" />Feedback</TabsTrigger>}
          {tabs.includes("raffle") && <TabsTrigger value="raffle" className={deskTab}><Trophy className="size-4" />Raffle &amp; totals</TabsTrigger>}
        </TabsList>
        <TabsContent value="qa"><QAModeration /></TabsContent>
        {tabs.includes("feedback") && <TabsContent value="feedback"><FeedbackDashboard /></TabsContent>}
        {tabs.includes("raffle") && <TabsContent value="raffle"><Raffle /></TabsContent>}
      </Tabs>
    </div>
  );
}

function QAModeration() {
  const qc = useQueryClient();
  const { data: allSessions } = useSessions();
  const { data: mine } = useModeratedSessionIds();
  const sessions = useMemo(() => allSessions?.filter((s) => mine?.has(s.id)), [allSessions, mine]);
  const [sessionId, setSessionId] = useState<string>("all");
  const [filter, setFilter] = useState<"open" | "answered" | "hidden" | "all">("open");
  const [search, setSearch] = useState("");

  const questions = useQuery({
    queryKey: ["admin-questions"],
    queryFn: async () => {
      const { data, error } = await supabase.from("questions").select("*").order("created_at", { ascending: true });
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
        if (!mine?.has(q.session_id)) return false;
        if (sessionId !== "all" && q.session_id !== sessionId) return false;
        if (filter === "open" && (q.answered || q.hidden)) return false;
        if (filter === "answered" && !q.answered) return false;
        if (filter === "hidden" && !q.hidden) return false;
        return !search || q.body.toLowerCase().includes(search.toLowerCase());
      }),
    [questions.data, mine, sessionId, filter, search],
  );

  const update = async (id: string, patch: { answered?: boolean; hidden?: boolean }) => {
    const { error } = await supabase.from("questions").update(patch).eq("id", id);
    if (error) toast.error("Update failed");
    qc.invalidateQueries({ queryKey: ["admin-questions"] });
  };
  const [themes, setThemes] = useState<Record<string, Theme[]>>({});
  const [grouping, setGrouping] = useState(false);
  const groupFn = useServerFn(groupSessionQuestions);
  const runGrouping = async () => {
    setGrouping(true);
    try {
      const res = await groupFn({ data: { sessionId } });
      if (res.error) toast.error(res.error);
      else setThemes((t) => ({ ...t, [sessionId]: res.themes }));
    } catch {
      toast.error("Grouping failed. Try again.");
    } finally {
      setGrouping(false);
    }
  };
  const sorted = [...list].sort((a, b) => b.vote_count - a.vote_count);
  const groups = sessionId !== "all" && themes[sessionId] ? applyThemes(themes[sessionId], sorted) : [{ label: "All", questions: sorted }];

  return (
    <div className="space-y-4 pt-4">
      <div className="flex flex-wrap gap-2">
        <Select value={sessionId} onValueChange={setSessionId}>
          <SelectTrigger className="h-9 w-auto min-w-56 rounded-sm border-input bg-card text-sm">
            <SelectValue placeholder="All sessions" />
          </SelectTrigger>
          <SelectContent className="rounded-sm bg-card">
            <SelectItem value="all">All sessions</SelectItem>
            {sessions?.map((s) => (
              <SelectItem key={s.id} value={s.id}>{s.start_time} · {s.title}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search…" className="h-9 max-w-48 bg-card" />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {(["open", "answered", "hidden", "all"] as const).map((f) => (
          <Button key={f} size="sm" variant={filter === f ? "default" : "outline"} onClick={() => setFilter(f)} className="capitalize">{f}</Button>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <p className="eyebrow">{list.length} questions</p>
        {sessionId !== "all" && (
          <div className="ml-auto flex gap-2">
            {themes[sessionId] && <Button size="sm" variant="ghost" onClick={() => setThemes((t) => { const n = { ...t }; delete n[sessionId]; return n; })}>All questions</Button>}
            <Button size="sm" variant="signal" disabled={grouping} onClick={runGrouping}>
              {grouping ? "Grouping…" : themes[sessionId] ? "Regroup by theme" : "Group by theme"}
            </Button>
          </div>
        )}
      </div>
      {groups.map((g) => (
        <div key={g.label}>
          {groups.length > 1 || themes[sessionId] ? <p className="eyebrow mb-2 mt-4 text-signal">{g.label} · {g.questions.length}</p> : null}
          <ul className="space-y-2">
            {g.questions.map((q) => {
              const s = sessions?.find((x) => x.id === q.session_id);
              return (
                <li key={q.id} className={cn("flex gap-3 rounded-sm border bg-card p-3", q.hidden && "opacity-50")}>
                  <span className="w-14 shrink-0 font-mono text-sm text-signal">▲ {q.vote_count}</span>
                  <div className="min-w-0 flex-1">
                    <p className="break-words">{q.body}</p>
                    <p className="eyebrow mt-1">{q.author_name ?? "Attendee"} · {new Date(q.created_at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}{sessionId === "all" && s && ` · ${s.title}`}</p>
                  </div>
                  <div className="flex shrink-0 flex-col gap-1">
                    <Button size="sm" variant={q.answered ? "outline" : "signal"} onClick={() => update(q.id, { answered: !q.answered })}>
                      {q.answered ? "Undo" : "Asked"}
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
      ))}
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
    ...DAY_CATEGORIES.map((c) => ({ key: c.id, label: c.label, sub: `Rate the day · ${DAY_GROUPS.find((g) => g.id === c.group)?.label}`, items: fb.data?.general.filter((f) => f.category === c.id) ?? [] })),
  ];

  const exportCsv = () => {
    const data: (string | number | null)[][] = [["Type", "Section", "Item", "Rating", "Comment", "Submitted"]];
    for (const f of fb.data?.sessions ?? []) {
      const s = sessions?.find((x) => x.id === f.session_id);
      data.push(["Session", s?.start_time ?? "", s?.title ?? "", f.rating, f.comment, f.created_at]);
    }
    for (const g of fb.data?.general ?? []) {
      const c = DAY_CATEGORIES.find((x) => x.id === g.category);
      data.push(["Rate the day", DAY_GROUPS.find((x) => x.id === c?.group)?.label ?? "", c?.label ?? g.category, g.rating, g.comment, g.created_at]);
    }
    downloadCsv(toCsv(data), "summit-feedback.csv");
  };

  return (
    <div className="pt-4">
      <div className="flex items-center justify-between gap-4">
        <p className="eyebrow">{(fb.data?.sessions.length ?? 0) + (fb.data?.general.length ?? 0)} responses total</p>
        <Button variant="outline" size="sm" onClick={exportCsv} disabled={!fb.data}>
          <Download className="size-4" /> Download results as csv
        </Button>
      </div>
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
                <span className="flex items-center gap-4 font-mono text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5"><Star className="size-3.5 -translate-y-px" />{r.items.length}</span>
                  <span className="flex items-center gap-1.5"><MessagesSquare className="size-3.5 -translate-y-px" />{comments.length}</span>
                </span>
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
    refetchInterval: 15_000,
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
          <div className="mt-6 space-y-3">
            <p className="eyebrow">Latest winner</p>
            <p className="display text-5xl leading-tight text-signal">{latest.display_name ?? "Attendee"}</p>
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
        <p className="eyebrow mb-2">Running raffle totals by attendee · updates live</p>
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
