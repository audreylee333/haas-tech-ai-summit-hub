import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { pickStaffRole } from "@/lib/data";
import { useEffect, useState } from "react";
import { SigningIn, hasAuthReturnInUrl, isSigningOut, clearSigningOut } from "@/components/SigningIn";
import { supabase } from "@/integrations/supabase/client";
import { SignInButton } from "@/components/SignInButton";
import { CaptionsLink } from "@/components/CaptionsLink";
import wordmarkAsset from "@/assets/wordmark.png.asset.json";

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>) => ({
    redirect: typeof s['redirect'] === "string" ? s['redirect'] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Sign in · The Hub for Conference Day · Haas Tech & AI Summit 2026" },
      { name: "description", content: "Sign in with Google to rate sessions, send questions to the speakers, and earn raffle tickets at the Haas Tech & AI Summit 2026." },
      { property: "og:title", content: "Sign in · Haas Tech & AI Summit 2026" },
      { property: "og:description", content: "Sign in with Google to rate sessions, send questions to the speakers, and earn raffle tickets." },
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
    if (u.pathname === "/auth") return null;
    return u.pathname + u.search;
  } catch {
    return null;
  }
}

function AuthPage() {
  const { redirect } = Route.useSearch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  // "checking" until we know whether this visitor is already signed in or returning from Google.
  const [phase, setPhase] = useState<"checking" | "signing" | "form">("checking");
  const [message, setMessage] = useState("Signing you in…");

  useEffect(() => {
    let done = false;
    // Someone just clicked Sign out: keep the transition screen, but say what is happening.
    const signingOut = isSigningOut();
    if (signingOut) setMessage("Signing you out…");
    const go = async () => {
      if (done) return;
      done = true;
      setPhase("signing");
      let target = safePath(sessionStorage.getItem("post-auth-redirect")) ?? safePath(redirect);
      sessionStorage.removeItem("post-auth-redirect");
      if (!target) {
        const uid = (await supabase.auth.getSession()).data.session?.user.id;
        const { data: roles } = uid ? await supabase.from("user_roles").select("role").eq("user_id", uid) : { data: [] };
        const role = pickStaffRole((roles ?? []).map((r) => r.role));
        queryClient.setQueryData(["staff-role"], role);
        target = role ? "/admin" : "/sessions";
      }
      navigate({ to: target, replace: true });
    };
    const returning = !signingOut && hasAuthReturnInUrl();
    if (returning) setPhase("signing");
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) void go();
      else if (!returning) {
        clearSigningOut();
        setPhase((p) => (p === "checking" ? "form" : p));
      }
    });
    const { data } = supabase.auth.onAuthStateChange((e, s) => {
      if (e === "SIGNED_IN" && s) void go();
    });
    // Safety net: never leave someone stuck on the transition screen.
    const t = window.setTimeout(() => {
      if (done) return;
      clearSigningOut();
      setPhase("form");
    }, 8000);
    return () => {
      data.subscription.unsubscribe();
      window.clearTimeout(t);
    };
  }, [redirect, navigate, queryClient]);

  if (phase !== "form") return <SigningIn message={message} />;

  return (
    <main className="dotgrid mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
      <img src={wordmarkAsset.url} alt="Where Intelligence Goes Next" className="w-full max-w-[15rem]" />
      <p className="eyebrow mt-7 text-signal">Haas Tech & AI Summit 2026</p>
      <span className="banner-tag mt-3 self-start">The Hub for Conference Day</span>
      <h1 className="display mt-3 text-5xl">Sign in to get started.</h1>
      <span className="mt-4 block h-1 w-16 bg-signal" aria-hidden="true" />
      <p className="mt-4 text-muted-foreground">
        Rate sessions, send questions to the speakers, and help shape the summit. Every rating and question earns a raffle ticket for the end-of-day draw for an Apple iPad or a Fujifilm Instax Mini camera, and your Google email keeps track of yours.
      </p>
      <div className="mt-9">
        <SignInButton redirect={safePath(redirect) ?? undefined} />
      </div>
      <CaptionsLink variant="text" className="mt-6" />
    </main>
  );
}
