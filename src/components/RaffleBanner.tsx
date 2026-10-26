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
          <rect x="7" y="17" width="34" height="15" rx="3" fill="white" />
          <circle cx="7" cy="24.5" r="2.8" fill="black" />
          <circle cx="41" cy="24.5" r="2.8" fill="black" />
        </mask>
      </defs>

      {/* twinkling sparkles */}
      <g fill="url(#raffleGold)" className="raffle-sparkles">
        <path className="sparkle" d={sparklePath(40, 8, 6.5)} />
        <path className="sparkle sparkle-b" d={sparklePath(9, 40, 4.6)} />
        <path className="sparkle sparkle-c" d={sparklePath(11.5, 8.5, 3.2)} />
        <path className="sparkle sparkle-d" d={sparklePath(44, 33.5, 2.8)} />
      </g>

      {/* ticket body with a slow shine sweep */}
      <g mask="url(#raffleTicketMask)">
        <rect x="7" y="17" width="34" height="15" rx="3" fill="currentColor" />
        <rect x="7.6" y="17.6" width="32.8" height="13.8" rx="2.6" fill="none" stroke="url(#raffleGold)" strokeWidth="0.9" opacity="0.55" />
        <g className="raffle-shine">
          <rect x="-14" y="10" width="7" height="30" fill="oklch(0.97 0.02 85)" opacity="0.4" transform="rotate(-18 -10 24)" />
        </g>
      </g>

      {/* gold star + perforated stub line */}
      <path
        d="M17.5 19.3 L18.82 22.68 L22.45 22.89 L19.64 25.2 L20.56 28.71 L17.5 26.75 L14.44 28.71 L15.36 25.2 L12.55 22.89 L16.18 22.68 Z"
        fill="url(#raffleGold)"
      />
      <path
        d="M31 19.5 V29.5"
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
