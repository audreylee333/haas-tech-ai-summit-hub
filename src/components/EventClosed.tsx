export function EventClosed() {
  return (
    <section aria-label="Event ended" className="py-8">
      <p className="eyebrow text-signal">Thank you for joining us</p>
      <h1 className="display mt-3 text-5xl">The event is over.</h1>
      <p className="mt-4 text-lg text-muted-foreground">Stay tuned for next year!</p>
      <p className="mt-2 text-sm text-muted-foreground">Questions and feedback submissions are now closed.</p>
    </section>
  );
}