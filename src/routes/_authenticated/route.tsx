import { createFileRoute, Link, Outlet, redirect, useLocation, useNavigate } from "@tanstack/react-router";
import { RaffleBanner } from "@/components/RaffleBanner";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin, useMyFeedback } from "@/lib/data";
import { cn } from "@/lib/utils";
import { LayoutDashboard, CalendarDays, Star } from "lucide-react";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/auth", search: { redirect: location.href } });
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

  const signOut = async () => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", search: { redirect: undefined }, replace: true });
  };

  const tab = "eyebrow flex items-center gap-1.5 px-1 pb-2 border-b-2 border-transparent hover:text-foreground";
  const active = { className: cn(tab, "border-signal text-foreground") };

  return (
    <div className="mx-auto min-h-screen max-w-3xl px-5 pb-20 sm:px-8">
      <header className="sticky top-0 z-10 bg-background pt-5">
        <div className="flex items-center justify-between">
          <Link to="/" className="display text-xl leading-tight sm:text-2xl">Haas Tech &amp; AI Summit 2026<span className="text-signal">: Where Intelligence Goes Next</span></Link>
          <div className="flex items-center gap-3">
            <button onClick={signOut} className="eyebrow hover:text-foreground">Sign out</button>
          </div>
        </div>
        <nav className="rule mt-4 flex gap-5 pt-3">
          {isAdmin && <Link to="/admin" className={tab} activeProps={active}><LayoutDashboard className="size-3.5" />Moderator desk</Link>}
          <Link to="/sessions" className={tab} activeProps={active}><CalendarDays className="size-3.5" />Sessions</Link>
          <Link to="/day" className={tab} activeProps={active}><Star className="size-3.5" />Rate the day</Link>
        </nav>
      </header>
      <div className="pt-6">
        {!isDesk && (
          <div className="mb-8">
            <RaffleBanner entries={data?.entries ?? 0} />
          </div>
        )}
        <Outlet />
      </div>
    </div>
  );
}
