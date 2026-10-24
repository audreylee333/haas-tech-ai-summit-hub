import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SignInButton } from "@/components/SignInButton";

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>) => ({
    redirect: typeof s['redirect'] === "string" ? s['redirect'] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Sign in — Haas Tech Summit Live" },
      { name: "description", content: "Sign in with Google to rate sessions and enter the summit raffle." },
      { property: "og:title", content: "Sign in — Haas Tech Summit Live" },
      { property: "og:description", content: "Sign in with Google to rate sessions and enter the raffle." },
    ],
  }),
  component: AuthPage,
});

function safePath(p?: string | null) {
  if (!p) return null;
  try {
    const u = new URL(p, window.location.origin);
    if (u.origin !== window.location.origin) return null;
    return u.pathname + u.search;
  } catch {
    return null;
  }
}

function AuthPage() {
  const { redirect } = Route.useSearch();
  const navigate = useNavigate();

  useEffect(() => {
    const go = () => {
      const target = safePath(sessionStorage.getItem("post-auth-redirect")) ?? safePath(redirect) ?? "/sessions";
      sessionStorage.removeItem("post-auth-redirect");
      navigate({ to: target, replace: true });
    };
    supabase.auth.getSession().then(({ data }) => data.session && go());
    const { data } = supabase.auth.onAuthStateChange((e, s) => {
      if (e === "SIGNED_IN" && s) go();
    });
    return () => data.subscription.unsubscribe();
  }, [redirect, navigate]);

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
      <p className="eyebrow">Haas Tech Summit · Live</p>
      <h1 className="display mt-3 text-5xl">Sign in to join the raffle.</h1>
      <p className="mt-4 text-muted-foreground">
        We use your Google email to count your raffle entries and contact you if you win.
      </p>
      <div className="mt-8">
        <SignInButton redirect={safePath(redirect) ?? "/sessions"} />
      </div>
    </main>
  );
}
