import { createFileRoute, Link, Outlet, redirect, useLocation, useNavigate } from "@tanstack/react-router";
import { RaffleBanner } from "@/components/RaffleBanner";
import wordmarkAsset from "@/assets/wordmark.png.asset.json";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useIsStaff as useIsAdmin, useMyFeedback } from "@/lib/data";
import { DAY_GROUPS, dayGroupOf } from "@/lib/raffle";
import { cn } from "@/lib/utils";
import { LayoutDashboard, CalendarDays, Star, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CaptionsLink } from "@/components/CaptionsLink";
import { SigningIn, markSigningOut } from "@/components/SigningIn";
import { useState } from "react";


export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw redirect({ to: "/auth", search: { redirect: location.href } });
  },
  component: Shell,
});

function Shell() {
  const { data } = useMyFeedback();
  const { data: isAdmin } = useIsAdmin();
  const { pathname } = useLocation();
  const isDesk = pathname.startsWith("/admin");
  const qc = useQueryClient();
  const navigate = useNavigate();

  const [signingOut, setSigningOut] = useState(false);

  const signOut = async () => {
    setSigningOut(true);
    markSigningOut();
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", search: { redirect: undefined }, replace: true });
  };


  const tab = "eyebrow flex items-center gap-1.5 rounded-full border border-muted-foreground/40 bg-card px-3 py-1.5 text-muted-foreground transition-colors hover:border-signal hover:text-foreground";
  const active = { className: cn(tab, "border-signal bg-signal text-signal-foreground") };

  if (signingOut) return <SigningIn message="Signing you out…" />;

  return (

    <div className="mx-auto min-h-screen max-w-3xl px-5 pb-20 sm:px-8">
      <header className="sticky top-0 z-10 bg-background pt-5">
        <div className="flex items-start justify-between gap-4">
          <Link to="/" className="flex min-w-0 flex-col gap-2.5" aria-label="Haas Tech & AI Summit 2026: Where Intelligence Goes Next">
            <img src={wordmarkAsset.url} alt="Where Intelligence Goes Next" className="w-44 max-w-full" />
            <span className="eyebrow text-signal">Haas Tech & AI Summit 2026</span>
          </Link>
          <div className="flex shrink-0 flex-wrap justify-end gap-2">
            <CaptionsLink />
            <Button onClick={signOut} variant="outline" size="sm" className="shrink-0 rounded-full border-muted-foreground/60 font-mono uppercase">
              <LogOut aria-hidden="true" />Sign out
            </Button>
          </div>
        </div>
        <nav className="rule mt-2.5 flex gap-5 pt-3">
          {isAdmin && <Link to="/admin" className={tab} activeProps={active}><LayoutDashboard className="size-3.5" />Moderator desk</Link>}
          <Link to="/sessions" className={tab} activeProps={active}><CalendarDays className="size-3.5" />Sessions</Link>
          <Link to="/day" className={tab} activeProps={active}><Star className="size-3.5" />Rate the day</Link>
        </nav>
      </header>
      <div className="pt-6">
        {!isDesk && (
          <div className="mb-8">
            <RaffleBanner entries={data?.entries ?? 0} dayRemaining={DAY_GROUPS.length - new Set((data?.general ?? []).map((g) => dayGroupOf(g.category)).filter(Boolean)).size} onDayPage={pathname.startsWith("/day")} />
          </div>
        )}
        <Outlet />
      </div>
    </div>
  );
}
