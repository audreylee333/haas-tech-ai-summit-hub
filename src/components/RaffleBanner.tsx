import { Link } from "@tanstack/react-router";
import { Ticket } from "lucide-react";
import { DAY_GROUPS } from "@/lib/raffle";

export function RaffleBanner({ entries, dayRemaining, onDayPage }: { entries: number; dayRemaining: number; onDayPage: boolean }) {
  const total = DAY_GROUPS.length;
  return (
    <div className="bg-prize shadow-prize flex flex-wrap items-center gap-4 rounded-sm p-4 text-signal-foreground">
      <div className="flex items-center gap-2">
        <Ticket className="size-9 shrink-0" aria-hidden />
        <div className="display text-5xl leading-none">{entries}</div>
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-mono text-[0.65rem] uppercase tracking-[0.14em]">
          Raffle {entries === 1 ? "entry" : "entries"}
        </p>
        <p className="text-sm font-medium">
          {entries === 0
            ? "Submit a review or questions to get in the draw."
            : "Each review, each Rate the day section, and your questions for each session add one ticket."}{" "}
          <span className="font-semibold">Be there at the close to win.</span>
        </p>
      </div>
      {onDayPage ? (
        <p className="font-mono text-xs">
          {dayRemaining > 0 ? `${dayRemaining} of ${total} day tickets left` : "All day tickets earned ✓"}
        </p>
      ) : (
        dayRemaining > 0 && (
          <Link to="/day" className="font-mono text-xs underline underline-offset-4">
            +{dayRemaining} on Rate the day →
          </Link>
        )
      )}
    </div>
  );
}
