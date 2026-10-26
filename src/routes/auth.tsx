import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SignInButton } from "@/components/SignInButton";
import wordmarkAsset from "@/assets/wordmark.png.asset.json";

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>) => ({
    redirect: typeof s['redirect'] === "string" ? s['redirect'] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Sign in · Haas Tech & AI Summit 2026" },
      { name: "description", content: "Sign in with Google to rate sessions, send questions to the speakers, and help shape the summit." },
      { property: "og:title", content: "Sign in · Haas Tech & AI Summit 2026" },
      { property: "og:description", content: "Sign in with Google to rate sessions, send questions to the speakers, and help shape the summit." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
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
    const go = async () => {
      let target = safePath(sessionStorage.getItem("post-auth-redirect")) ?? safePath(redirect);
      sessionStorage.removeItem("post-auth-redirect");
      if (!target) {
        const uid = (await supabase.auth.getUser()).data.user?.id;
        const { data: roles } = uid ? await supabase.from("user_roles").select("role").eq("user_id", uid) : { data: [] };
        target = (roles ?? []).length ? "/admin" : "/sessions";
      }
      navigate({ to: target, replace: true });
    };
    supabase.auth.getSession().then(({ data }) => data.session && void go());
    const { data } = supabase.auth.onAuthStateChange((e, s) => {
      if (e === "SIGNED_IN" && s) void go();
    });
    return () => data.subscription.unsubscribe();
  }, [redirect, navigate]);

  return (
    <main className="dotgrid mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
      <img src={wordmarkAsset.url} alt="Where Intelligence Goes Next" className="w-full max-w-[15rem]" />
      <p className="eyebrow mt-7 text-signal">Haas Tech &amp; AI Summit 2026</p>
      <h1 className="display mt-2 text-5xl">Sign in to get started.</h1>
      <span className="mt-4 block h-1 w-16 bg-signal" aria-hidden="true" />
      <p className="mt-4 text-muted-foreground">
        Rate sessions, send questions to the speakers, and help shape the summit. Your Google email keeps track of your tickets.
      </p>
      <p className="mt-2 text-sm text-muted-foreground">
        Your ratings and comments are shared with organizers without your name. Only your questions and ticket count are linked to you.
      </p>
      <div className="mt-9">
        <SignInButton redirect={safePath(redirect) ?? undefined} />
      </div>
    </main>
  );
}
