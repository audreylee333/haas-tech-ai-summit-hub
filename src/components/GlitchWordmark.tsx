const LINES = ["Where", "Intelligence", "Goes Next"];

/**
 * Live-text version of the poster wordmark: Anton condensed uppercase with a
 * soft ghost blur and intermittent glitch slices, plus the summit name in gold.
 */
export function GlitchWordmark() {
  return (
    <div className="wm">
      {LINES.map((line, i) => (
        <span
          key={line}
          className="wm-line"
          data-text={line}
          style={{ ["--wm-delay" as string]: `${i * 0.4}s` }}
        >
          {line}
        </span>
      ))}
      <span className="wm-summit">Haas Tech & AI Summit 2026</span>
    </div>
  );
}
