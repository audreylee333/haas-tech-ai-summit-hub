import { Link } from "@tanstack/react-router";

export function RaffleBanner({ entries }: { entries: number }) {
  return (
    <div className="bg-prize shadow-prize flex items-center gap-4 rounded-sm p-4 text-signal-foreground">
      <div className="display text-5xl leading-none">{entries}</div>
      <div className="flex-1">
        <p className="font-mono text-[0.65rem] uppercase tracking-[0.14em]">
          Raffle {entries === 1 ? "entry" : "entries"} · prizes revealed at the close
        </p>
        <p className="text-sm font-medium">
          {entries === 0
            ? "Rate your first session to get in the draw."
            : "Every session and every day topic you rate adds another ticket."}{" "}
          <span className="font-semibold">Be there at the close to win.</span>
        </p>
      </div>
      <Link to="/day" className="hidden font-mono text-xs underline underline-offset-4 sm:block">
        +7 more →
      </Link>
    </div>
  );
}
