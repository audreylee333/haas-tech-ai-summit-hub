import { Captions } from "lucide-react";
import { cn } from "@/lib/utils";

export const CAPTIONS_URL =
  "https://aberdeen-qr-codes.s3.amazonaws.com/AberLive/UCBerkeley_BAV/VariousEvent/Captions-SinglePage.html";

export function CaptionsLink({ className, variant = "pill" }: { className?: string; variant?: "pill" | "text" }) {
  if (variant === "text") {
    return (
      <p className={cn("text-sm text-muted-foreground", className)}>
        Need live captions?{" "}
        <a href={CAPTIONS_URL} target="_blank" rel="noopener noreferrer" aria-label="Open live captions in a new tab" className="inline-flex items-center gap-1 font-semibold text-signal underline underline-offset-4 hover:text-foreground">
          <Captions className="size-4" aria-hidden="true" />Open live captions
        </a>
      </p>
    );
  }
  return (
    <a href={CAPTIONS_URL} target="_blank" rel="noopener noreferrer" aria-label="Open live captions in a new tab"
      className={cn("inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-muted-foreground/60 px-3 font-mono text-xs uppercase text-foreground transition-colors hover:border-signal hover:text-signal", className)}>
      <Captions className="size-4" aria-hidden="true" />Live captions
    </a>
  );
}
