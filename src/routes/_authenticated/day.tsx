import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useMyFeedback } from "@/lib/data";
import { DAY_CATEGORIES, DAY_GROUPS } from "@/lib/raffle";
import { StarRating } from "@/components/StarRating";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";

export const Route = createFileRoute("/_authenticated/day")({
  head: () => ({ meta: [
    { title: "Rate the day · Haas Tech & AI Summit 2026" },
    { name: "description", content: "Rate your overall summit experience and share what you would change for next year." },
    { property: "og:title", content: "Rate the day · Haas Tech & AI Summit 2026" },
    { property: "og:description", content: "Share feedback on the summit experience and earn raffle entries." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: DayPage,
});

type Row = { category: string; rating: number; comment: string | null };

function DayPage() {
  const { data: mine } = useMyFeedback();
  const [open, setOpen] = useState<string | null>(DAY_GROUPS[0].id);

  return (
    <div>
      <p className="eyebrow">Beyond the stage</p>
      <h1 className="display mt-2 text-5xl">Rate the day.</h1>
      <p className="mt-2 text-muted-foreground">Three sections, one raffle ticket each. Rate any topic in a section to earn its ticket.</p>
      <ul className="mt-6">
        {DAY_GROUPS.map((g, gi) => {
          const cats = DAY_CATEGORIES.filter((c) => c.group === g.id);
          const existing = (mine?.general ?? []).filter((r) => cats.some((c) => c.id === r.category));
          const done = existing.length > 0;
          const isOpen = open === g.id;
          return (
            <li key={g.id} className="rule">
              <Button variant="ghost" type="button" onClick={() => setOpen(isOpen ? null : g.id)} aria-expanded={isOpen} aria-controls={`feedback-${g.id}`} className={cn("h-auto w-full justify-between gap-4 whitespace-normal px-3 py-5 text-left", isOpen && "bg-card")}>
                <span className="min-w-0 flex-1">
                  <span className="display block text-2xl">{g.label}</span>
                  <span className="mt-1 block text-sm font-normal text-muted-foreground">{g.hint}</span>
                  <span className={cn("mt-2 block font-mono text-xs", done ? "text-success" : "text-signal")}>
                    {done ? `✓ ${existing.length}/${cats.length} rated` : "+1 🎟"}
                  </span>
                </span>
                <span className={cn(buttonVariants({ variant: isOpen || done ? "outline" : "signal", size: "sm" }), "h-10 min-w-24 shrink-0")}>
                  {isOpen ? "Close" : done ? "Edit" : "Submit"}
                  <ChevronDown className={cn("transition-transform", isOpen && "rotate-180")} />
                </span>
              </Button>
              {isOpen && (
                <div id={`feedback-${g.id}`} className="bg-card px-3 pb-6">
                  <GroupForm
                    groupId={g.id}
                    cats={cats}
                    existing={existing}
                    onDone={() => setOpen(DAY_GROUPS[gi + 1]?.id ?? null)}
                  />
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function GroupForm({ groupId, cats, existing, onDone }: {
  groupId: string;
  cats: ReadonlyArray<{ id: string; label: string; hint: string }>;
  existing: Row[];
  onDone: () => void;
}) {
  const qc = useQueryClient();
  const isOverall = groupId === "overall";
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setRatings(Object.fromEntries(existing.map((r) => [r.category, r.rating])));
    setComment(existing.find((r) => r.comment)?.comment ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existing.length]);

  const rated = cats.filter((c) => (ratings[c.id] ?? 0) > 0);
  const isNew = existing.length === 0;

  return (
    <form
      className="space-y-6 pt-2"
      onSubmit={async (e) => {
        e.preventDefault();
        if (busy) return;
        if (rated.length === 0) { toast.error("Pick a rating for at least one topic"); return; }
        setBusy(true);
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) throw new Error("Sign in to submit feedback");
          const text = comment.trim() || null;
          const now = new Date().toISOString();
          const rows = rated.map((c, i) => ({ category: c.id, rating: ratings[c.id] ?? 0, comment: i === 0 ? text : null, user_id: user.id, updated_at: now }));
          const { error } = await supabase.from("general_feedback").upsert(rows, { onConflict: "user_id,category" });
          if (error) throw error;
          await qc.invalidateQueries({ queryKey: ["my-feedback"] });
          toast.success(isNew ? "Thanks! +1 raffle ticket" : "Feedback updated");
          onDone();
        } catch (err) {
          toast.error(err instanceof Error ? err.message : "Could not save feedback");
        } finally {
          setBusy(false);
        }
      }}
    >
      {cats.map((c) => (
        <div key={c.id}>
          {!isOverall && <p className="font-medium">{c.label}</p>}
          {!isOverall && <p className="mb-2 text-sm text-muted-foreground">{c.hint}</p>}
          <StarRating value={ratings[c.id] ?? 0} onChange={(v) => setRatings((r) => ({ ...r, [c.id]: v }))} />
        </div>
      ))}
      <div>
        <label htmlFor={`comment-${groupId}`} className="eyebrow mb-2 block">
          {isOverall ? "If there's one thing you would change, what would it be?" : "Anything we should know? (optional)"}
        </label>
        <Textarea id={`comment-${groupId}`} value={comment} onChange={(e) => setComment(e.target.value)} maxLength={1000}
          placeholder={isOverall ? "One thing you would change…" : "Optional comment"} className="bg-background" />
      </div>
      <Button type="submit" disabled={busy} className="w-full">{busy ? "Saving…" : isNew ? "Submit" : "Update"}</Button>
    </form>
  );
}
