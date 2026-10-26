import { Link } from "@tanstack/react-router";
import { DAY_GROUPS } from "@/lib/raffle";

function sparklePath(cx: number, cy: number, r: number) {
  return `M ${cx} ${cy - r} Q ${cx} ${cy} ${cx + r} ${cy} Q ${cx} ${cy} ${cx} ${cy + r} Q ${cx} ${cy} ${cx - r} ${cy} Q ${cx} ${cy} ${cx} ${cy - r} Z`;
}

function FlashyTicket({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="raffleGold" x1="6" y1="6" x2="42" y2="42" gradientUnits="userSpaceOnUse">
          <stop stopColor="oklch(0.93 0.1 90)" />
          <stop offset="1" stopColor="oklch(0.75 0.16 70)" />
        </linearGradient>
        <mask id="raffleTicketMask">
          <rect width="48" height="48" fill="black" />
          <rect x="6" y="15" width="36" height="18" rx="3" fill="white" />
          <circle cx="6" cy="24" r="3.2" fill="black" />
          <circle cx="42" cy="24" r="3.2" fill="black" />
        </mask>
      </defs>

      {/* twinkling sparkles */}
      <g fill="url(#raffleGold)" className="raffle-sparkles">
        <path className="sparkle" d={sparklePath(41, 10, 5)} />
        <path className="sparkle sparkle-b" d={sparklePath(8.5, 38, 3.6)} />
        <path className="sparkle sparkle-c" d={sparklePath(13, 8.5, 2.6)} />
        <path className="sparkle sparkle-d" d={sparklePath(44.5, 34, 2.2)} />
      </g>

      {/* ticket body with a slow shine sweep */}
      <g mask="url(#raffleTicketMask)">
        <rect x="6" y="15" width="36" height="18" rx="3" fill="currentColor" />
        <g className="raffle-shine">
          <rect x="-14" y="8" width="7" height="32" fill="oklch(0.97 0.02 85)" opacity="0.4" transform="rotate(-18 -10 24)" />
        </g>
      </g>

      {/* gold star + perforated stub line */}
      <path
        d="M18 18 L19.53 21.9 L23.71 22.15 L20.47 24.8 L21.53 28.85 L18 26.6 L14.47 28.85 L15.53 24.8 L12.29 22.15 L16.47 21.9 Z"
        fill="url(#raffleGold)"
      />
      <path
        d="M32 17.5 V30.5"
        stroke="url(#raffleGold)"
        strokeWidth="1.4"
        strokeDasharray="2 2.6"
        strokeLinecap="round"
        opacity="0.85"
      />
    </svg>
  );
}

export function RaffleBanner({ entries, dayRemaining, onDayPage }: { entries: number; dayRemaining: number; onDayPage: boolean }) {
  const total = DAY_GROUPS.length;
  return (
    <div className="bg-prize shadow-prize flex flex-wrap items-center gap-4 rounded-sm p-4 text-signal-foreground">
      <div className="flex items-center gap-2">
        <FlashyTicket className="size-11 shrink-0" />
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
