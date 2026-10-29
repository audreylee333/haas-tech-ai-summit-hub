import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSessions, useStaffRole } from "@/lib/data";
import { countRaffleEntries, dayGroupOf } from "@/lib/raffle";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Users, ShieldCheck } from "lucide-react";

const deskTab =
  "flex items-center gap-2 rounded-sm border border-border bg-card px-4 py-2.5 text-sm font-semibold text-muted-foreground hover:text-foreground data-[state=active]:border-signal data-[state=active]:bg-signal data-[state=active]:text-signal-foreground";

export const Route = createFileRoute("/_authenticated/analytics")({
  head: () => ({ meta: [
    { title: "Analytics · Haas Tech & AI Summit 2026" },
    { name: "robots", content: "noindex" },
    { name: "description", content: "Who has signed in to the summit hub and how they are participating." },
    { property: "og:title", content: "Analytics · Haas Tech & AI Summit 2026" },
    { property: "og:description", content: "Attendee and moderator activity for the Haas Tech & AI Summit 2026." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: AnalyticsPage,
});

function useActivity() {
  return useQuery({
    queryKey: ["admin-attendees"],
    refetchInterval: 60_000,
    refetchIntervalInBackground: false,
    queryFn: async () => {
      const [p, s, g, q, m, a] = await Promise.all([
        supabase.from("profiles").select("*").order("created_at", { ascending: true }),
        supabase.from("session_feedback").select("user_id, session_id"),
        supabase.from("general_feedback").select("user_id, category"),
        supabase.from("questions").select("user_id, session_id"),
        supabase.from("moderator_emails").select("*"),
        supabase.from("moderator_assignments").select("*"),
      ]);
      for (const r of [p, s, g, q, m, a]) if (r.error) throw r.error;
      const activity = new Map<string, { sessions: string[]; categories: string[]; questions: string[] }>();
      const bucket = (uid: string) => {
        let b = activity.get(uid);
        if (!b) activity.set(uid, (b = { sessions: [], categories: [], questions: [] }));
        return b;
      };
      for (const r of s.data ?? []) bucket(r.user_id).sessions.push(r.session_id);
      for (const r of g.data ?? []) bucket(r.user_id).categories.push(r.category);
      for (const r of q.data ?? []) bucket(r.user_id).questions.push(r.session_id);
      const people = (p.data ?? []).map((pr) => {
        const b = activity.get(pr.id) ?? { sessions: [], categories: [], questions: [] };
        return {
          ...pr,
          rated: new Set(b.sessions).size,
          day: new Set(b.categories.map(dayGroupOf).filter(Boolean)).size,
          asked: new Set(b.questions).size,
          tickets: countRaffleEntries(b.sessions, b.categories, b.questions),
        };
      });
      return { people, staff: m.data ?? [], assignments: a.data ?? [] };
    },
  });
}

function AnalyticsPage() {
  const { data: role, isLoading } = useStaffRole();
  if (isLoading) return <p className="eyebrow">Loading…</p>;
  if (role !== "admin") return <p className="text-muted-foreground">This page is for super admins only.</p>;
  return (
    <div>
      <p className="eyebrow">Friday, Oct 30 · live turnout</p>
      <h1 className="display mt-2 text-5xl">See who's showing up.</h1>
      <p className="mt-2 text-sm text-muted-foreground">Refreshes every minute.</p>
      <Tabs defaultValue="attendees" className="mt-6">
        <TabsList className="h-auto w-full justify-start gap-2 rounded-none bg-transparent p-0">
          <TabsTrigger value="attendees" className={deskTab}><Users className="size-4" />Attendees</TabsTrigger>
          <TabsTrigger value="moderators" className={deskTab}><ShieldCheck className="size-4" />Moderators</TabsTrigger>
        </TabsList>
        <TabsContent value="attendees"><AttendeesView /></TabsContent>
        <TabsContent value="moderators"><ModeratorsView /></TabsContent>
      </Tabs>
    </div>
  );
}

const lc = (v: string | null | undefined) => (v ?? "").toLowerCase();

function AttendeesView() {
  const data = useActivity();
  const [search, setSearch] = useState("");
  const rows = useMemo(() => {
    const staff = new Set((data.data?.staff ?? []).map((s) => lc(s.email)));
    return (data.data?.people ?? [])
      .filter((p) => !staff.has(lc(p.email)))
      .sort((a, b) => b.tickets - a.tickets || a.created_at.localeCompare(b.created_at));
  }, [data.data]);
  const term = search.trim().toLowerCase();
  const visible = term ? rows.filter((r) => lc(r.display_name).includes(term) || lc(r.email).includes(term)) : rows;
  const participating = rows.filter((r) => r.tickets > 0).length;
  const totalTickets = rows.reduce((a, b) => a + b.tickets, 0);

  return (
    <div className="pt-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="eyebrow">{rows.length} signed in · {participating} participating · {totalTickets} tickets</p>
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name or email…"
          className="h-10 w-64 border-input bg-card transition-colors hover:border-signal/40 focus-visible:ring-2 focus-visible:ring-signal/50 focus-visible:border-signal/50" />
      </div>
      <div className="eyebrow mt-4 grid grid-cols-[1fr_repeat(4,3.5rem)] items-center gap-4 px-1">
        <span>Attendee</span><span className="text-right">Rated</span><span className="text-right">Day</span><span className="text-right">Q&amp;A</span><span className="text-right">Tickets</span>
      </div>
      <ul>
        {visible.map((r) => (
          <li key={r.id} className="rule grid grid-cols-[1fr_repeat(4,3.5rem)] items-center gap-4 py-3">
            <span className="min-w-0">
              <span className="block truncate font-medium">{r.display_name ?? "Attendee"}</span>
              <span className="eyebrow">{r.email} · joined {new Date(r.created_at).toLocaleDateString([], { month: "short", day: "numeric" })}</span>
            </span>
            <span className="text-right font-mono text-sm">{r.rated}</span>
            <span className="text-right font-mono text-sm">{r.day}</span>
            <span className="text-right font-mono text-sm">{r.asked}</span>
            <span className="text-right font-mono text-sm text-signal">{r.tickets}</span>
          </li>
        ))}
      </ul>
      {visible.length === 0 && <p className="py-6 text-sm text-muted-foreground">No one matches that search.</p>}
    </div>
  );
}

function ModeratorsView() {
  const data = useActivity();
  const { data: sessions } = useSessions();
  const rows = useMemo(() => {
    const byEmail = new Map((data.data?.people ?? []).map((p) => [lc(p.email), p]));
    const title = new Map((sessions ?? []).map((s) => [s.id, s.title]));
    return (data.data?.staff ?? [])
      .map((s) => ({
        ...s,
        profile: byEmail.get(lc(s.email)),
        covers: (data.data?.assignments ?? []).filter((a) => lc(a.email) === lc(s.email)).map((a) => title.get(a.session_id) ?? "Session"),
      }))
      .sort((a, b) => (a.role === b.role ? a.email.localeCompare(b.email) : a.role === "admin" ? -1 : 1));
  }, [data.data, sessions]);
  const signedIn = rows.filter((r) => r.profile).length;

  return (
    <div className="pt-4">
      <p className="eyebrow">{rows.length} staff · {signedIn} signed in</p>
      <div className="eyebrow mt-4 grid grid-cols-[1fr_6rem_5rem] items-center gap-4 px-1">
        <span>Moderator</span><span>Access</span><span className="text-right">Signed in</span>
      </div>
      <ul>
        {rows.map((r) => (
          <li key={r.email} className="rule grid grid-cols-[1fr_6rem_5rem] items-center gap-4 py-3">
            <span className="min-w-0">
              <span className="block truncate font-medium">{r.profile?.display_name ?? r.email}</span>
              <span className="eyebrow block">{r.email}</span>
              <span className="mt-1 block text-xs text-muted-foreground">
                {r.role === "admin" ? "All sessions, feedback and raffle" : [...r.covers, "Opening & closing keynotes"].join(" · ")}
              </span>
            </span>
            <span className={r.role === "admin" ? "eyebrow text-signal" : "eyebrow"}>{r.role === "admin" ? "Super admin" : "Moderator"}</span>
            <span className="text-right font-mono text-sm">{r.profile ? "Yes" : "Not yet"}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
