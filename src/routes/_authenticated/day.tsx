import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMyFeedback } from "@/lib/data";
import { DAY_CATEGORIES } from "@/lib/raffle";
import { FeedbackForm } from "@/components/FeedbackForm";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/day")({
  head: () => ({ meta: [{ title: "Rate the day · Haas Tech & AI Summit 2026" }] }),
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
              <button onClick={() => setOpen(isOpen ? null : c.id)} className="flex w-full items-center justify-between py-4 text-left">
                <span>
                  <span className="display block text-2xl">{c.label}</span>
                  <span className="text-sm text-muted-foreground">{c.hint}</span>
                </span>
                <span className={cn("font-mono text-xs", existing ? "text-success" : "text-signal")}>
                  {existing ? `✓ ${existing.rating}/5` : "+1 🎟"}
                </span>
              </button>
              {isOpen && (
                <div className="pb-6">
                  <FeedbackForm
                    isNew={!existing}
                    initialRating={existing?.rating}
                    initialComment={existing?.comment}
                    placeholder="Anything we should know? (optional)"
                    onSubmit={async (rating, comment) => {
                      const { error } = await supabase.from("general_feedback").upsert(
                        { category: c.id, rating, comment, user_id: (await supabase.auth.getUser()).data.user!.id, updated_at: new Date().toISOString() },
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
