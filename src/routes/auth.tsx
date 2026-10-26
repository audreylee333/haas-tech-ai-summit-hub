import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SignInButton } from "@/components/SignInButton";
import summitLockupAsset from "@/assets/summit-lockup.png.asset.json";

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
        const { data: isMod } = uid ? await supabase.rpc("has_role", { _user_id: uid, _role: "admin" }) : { data: false };
        target = isMod ? "/admin" : "/sessions";
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
      <img src={summitLockupAsset.url} alt="Haas Tech & AI Summit 2026" className="w-full max-w-[14rem]" />
      <p className="mt-8"><span className="banner-tag">You shape the summit</span></p>
      <h1 className="display mt-4 text-4xl">Sign in to access the audience engagement center.</h1>
      <span className="mt-5 block h-1 w-16 bg-signal" aria-hidden="true" />
      <p className="mt-4 text-muted-foreground">
        Your Google email is how we keep track of your tickets. Once you're in, rate sessions, send questions to the speakers, and help shape what gets asked on stage today and what we build next year.
      </p>
      <div className="mt-8 border-t border-signal/40 pt-6">
        <p className="eyebrow text-signal">Step 1 · Takes 5 seconds</p>
        <div className="mt-4">
          <SignInButton redirect={safePath(redirect) ?? undefined} />
        </div>
      </div>
    </main>
  );
}
