import { cn } from "@/lib/utils";

const LABELS = ["", "Poor", "Meh", "Good", "Great", "Outstanding"];

export function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div>
      <div className="flex gap-2" role="radiogroup" aria-label="Rating">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={value === n}
            aria-label={`${n} – ${LABELS[n]}`}
            onClick={() => onChange(n)}
            className={cn(
              "h-12 flex-1 rounded-sm border font-mono text-lg transition-colors",
              n <= value
                ? "border-signal bg-signal text-signal-foreground"
                : "border-input bg-card hover:border-foreground",
            )}
          >
            {n}
          </button>
        ))}
      </div>
      <p className="eyebrow mt-2 h-4">{LABELS[value]}</p>
    </div>
  );
}
