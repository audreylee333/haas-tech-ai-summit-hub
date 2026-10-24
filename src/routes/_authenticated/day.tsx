import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMyFeedback } from "@/lib/data";
import { DAY_CATEGORIES } from "@/lib/raffle";
import { FeedbackForm } from "@/components/FeedbackForm";
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

function DayPage() {
  const qc = useQueryClient();
  const { data: mine } = useMyFeedback();
  const [open, setOpen] = useState<string | null>(DAY_CATEGORIES[0].id);

  return (
    <div>
      <p className="eyebrow">Beyond the stage</p>
      <h1 className="display mt-2 text-5xl">Rate the day.</h1>
      <p className="mt-2 text-muted-foreground">Each topic you rate is another raffle ticket.</p>
      <ul className="mt-6">
        {DAY_CATEGORIES.map((c) => {
          const existing = mine?.general.find((g) => g.category === c.id);
          const isOpen = open === c.id;
          return (
            <li key={c.id} className="rule">
              <Button variant="ghost" type="button" onClick={() => setOpen(isOpen ? null : c.id)} aria-expanded={isOpen} aria-controls={`feedback-${c.id}`} className={cn("h-auto w-full justify-between gap-4 whitespace-normal px-3 py-5 text-left", isOpen && "bg-card")}>
                <span className="min-w-0 flex-1">
                  <span className="display block text-2xl">{c.label}</span>
                  <span className="mt-1 block text-sm font-normal text-muted-foreground">{c.hint}</span>
                  <span className={cn("mt-2 block font-mono text-xs", existing ? "text-success" : "text-signal")}>
                    {existing ? `✓ ${existing.rating}/5` : "+1 🎟"}
                  </span>
                </span>
                <span className={cn(buttonVariants({ variant: isOpen || existing ? "outline" : "signal", size: "sm" }), "h-10 min-w-24 shrink-0")}>
                  {isOpen ? "Close" : existing ? "Edit" : "Submit"}
                  <ChevronDown className={cn("transition-transform", isOpen && "rotate-180")} />
                </span>
              </Button>
              {isOpen && (
                <div id={`feedback-${c.id}`} className="bg-card px-3 pb-6">
                  <FeedbackForm
                    isNew={!existing}
                    initialRating={existing?.rating}
                    initialComment={existing?.comment}
                    commentLabel={c.id === "overall" ? "If there's one thing you would change, what would it be?" : undefined}
                    placeholder={c.id === "overall" ? "One thing you would change…" : "Anything we should know? (optional)"}
                    onSubmit={async (rating, comment) => {
                      const { data: { user } } = await supabase.auth.getUser();
                      if (!user) throw new Error("Sign in to submit feedback");
                      const { error } = await supabase.from("general_feedback").upsert(
                        { category: c.id, rating, comment, user_id: user.id, updated_at: new Date().toISOString() },
                        { onConflict: "user_id,category" },
                      );
                      if (error) throw error;
                      await qc.invalidateQueries({ queryKey: ["my-feedback"] });
                      const idx = DAY_CATEGORIES.findIndex((x) => x.id === c.id);
                      setOpen(DAY_CATEGORIES[idx + 1]?.id ?? null);
                    }}
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
