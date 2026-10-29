import { Link } from "@tanstack/react-router";
import { DAY_GROUPS } from "@/lib/raffle";

function sparklePath(cx: number, cy: number, r: number) {
  return `M ${cx} ${cy - r} Q ${cx} ${cy} ${cx + r} ${cy} Q ${cx} ${cy} ${cx} ${cy + r} Q ${cx} ${cy} ${cx - r} ${cy} Q ${cx} ${cy} ${cx} ${cy - r} Z`;
}

function FlashyTicket({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="raffleGold" x1="5" y1="5" x2="43" y2="43" gradientUnits="userSpaceOnUse">
          <stop stopColor="oklch(0.95 0.06 88)" />
          <stop offset="1" stopColor="oklch(0.82 0.15 78)" />
        </linearGradient>
        <mask id="raffleTicketMask">
          <rect width="48" height="48" fill="black" />
          <rect x="5" y="14" width="38" height="20" rx="4" fill="white" />
          <circle cx="5" cy="24" r="3.4" fill="black" />
          <circle cx="43" cy="24" r="3.4" fill="black" />
        </mask>
      </defs>

      {/* twinkling sparkles */}
      <g fill="currentColor" className="raffle-sparkles">
        <path className="sparkle" d={sparklePath(41, 7, 6)} />
        <path className="sparkle sparkle-b" d={sparklePath(8, 41, 4.6)} />
        <path className="sparkle sparkle-c" d={sparklePath(12, 6.5, 3)} />
        <path className="sparkle sparkle-d" d={sparklePath(44, 40, 2.6)} />
      </g>

      {/* ticket body with a slow shine sweep */}
      <g mask="url(#raffleTicketMask)">
        <rect x="5" y="14" width="38" height="20" rx="4" fill="currentColor" />
        <rect x="6" y="15" width="36" height="18" rx="3.2" fill="none" stroke="url(#raffleGold)" strokeWidth="1" opacity="0.6" />
        <g className="raffle-shine">
          <rect x="-16" y="8" width="8" height="32" fill="oklch(0.97 0.02 85)" opacity="0.45" transform="rotate(-18 -12 24)" />
        </g>
      </g>

      {/* gold star + perforated stub line */}
      <path
        d="M16 17.5 L17.65 21.73 L22.18 21.99 L18.66 24.87 L19.82 29.26 L16 26.8 L12.18 29.26 L13.34 24.87 L9.82 21.99 L14.35 21.73 Z"
        fill="url(#raffleGold)"
      />
      <path
        d="M30 17 V31"
        stroke="url(#raffleGold)"
        strokeWidth="1.5"
        strokeDasharray="2 2.6"
        strokeLinecap="round"
        opacity="0.9"
      />
    </svg>
  );
}

export function RaffleBanner({ entries, dayRemaining, onDayPage }: { entries: number; dayRemaining: number; onDayPage: boolean }) {
  const total = DAY_GROUPS.length;
  return (
    <div className="bg-prize shadow-prize flex flex-wrap items-center gap-4 rounded-sm p-4 text-signal-foreground">
      <div className="flex items-center gap-2">
        <FlashyTicket className="size-12 shrink-0" />
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
        <p className="mt-1 font-mono text-[0.65rem] uppercase tracking-[0.14em]">
          Prizes: Apple iPad · Fujifilm Instax Mini camera
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
