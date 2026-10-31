import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SigningIn, hasAuthReturnInUrl } from "@/components/SigningIn";
import { SignInButton } from "@/components/SignInButton";
import { Button } from "@/components/ui/button";
import { useIsStaff as useIsAdmin, useUser } from "@/lib/data";
import { GlitchWordmark } from "@/components/GlitchWordmark";
import { CaptionsLink } from "@/components/CaptionsLink";
import { EventClosed } from "@/components/EventClosed";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "The Hub for Conference Day · Haas Tech & AI Summit 2026" },
      { name: "description", content: "The Haas Tech & AI Summit 2026 has ended. Submissions are closed. Stay tuned for next year!" },
      { property: "og:title", content: "Haas Tech & AI Summit 2026" },
      { property: "og:description", content: "The summit has ended. Stay tuned for next year!" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const { data: user } = useUser();
  const { data: isAdmin } = useIsAdmin();
  const navigate = useNavigate();
  // If Google sent the person back here instead of the sign-in page, finish the trip.
  useEffect(() => {
    if (!user) return;
    const next = sessionStorage.getItem("post-auth-redirect");
    if (next === null) return;
    sessionStorage.removeItem("post-auth-redirect");
    navigate({ to: next.startsWith("/") && !next.startsWith("//") ? next : "/sessions", replace: true });
  }, [user, navigate]);
  const [returning, setReturning] = useState(false);
  useEffect(() => {
    if (hasAuthReturnInUrl() || sessionStorage.getItem("post-auth-redirect") !== null) setReturning(true);
    const t = window.setTimeout(() => setReturning(false), 8000);
    return () => window.clearTimeout(t);
  }, []);
  if (returning && !user) return <SigningIn />;
  if (returning && user && sessionStorage.getItem("post-auth-redirect") !== null) return <SigningIn />;
  return (
    <main className="dotgrid mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-10">
      <GlitchWordmark />
      <p className="eyebrow mt-6 text-signal">Oct 30 · Spieker Forum</p>
      <span className="banner-tag mt-3 self-start">The Hub for Conference Day</span>
      <EventClosed />
      <div className="mt-2">
        {user ? (
          <Button asChild variant="start" size="lg" className="h-14 px-6 text-base font-semibold">
            {isAdmin ? <Link to="/admin">Go to moderator desk →</Link> : <Link to="/sessions">Go to sessions →</Link>}
          </Button>
        ) : (
          <SignInButton />
        )}
      </div>
      <CaptionsLink variant="text" className="mt-6" />
    </main>
  );
}
