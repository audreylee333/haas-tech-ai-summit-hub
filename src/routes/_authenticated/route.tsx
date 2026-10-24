import { createFileRoute, Link, Outlet, redirect, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin, useMyFeedback } from "@/lib/data";
import { cn } from "@/lib/utils";

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
  const qc = useQueryClient();
  const navigate = useNavigate();

  const signOut = async () => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", search: { redirect: undefined }, replace: true });
  };

  const tab = "eyebrow px-1 pb-2 border-b-2 border-transparent hover:text-foreground";
  const active = { className: cn(tab, "border-signal text-foreground") };

  return (
    <div className="mx-auto min-h-screen max-w-3xl px-5 pb-20 sm:px-8">
      <header className="sticky top-0 z-10 bg-background pt-5">
        <div className="flex items-center justify-between">
          <Link to="/" className="display text-2xl">Summit Live</Link>
          <div className="flex items-center gap-3">
            <span className="rounded-sm bg-signal px-2 py-1 font-mono text-xs text-signal-foreground" aria-live="polite">
              🎟 {data?.entries ?? 0} {data?.entries === 1 ? "entry" : "entries"}
            </span>
            <button onClick={signOut} className="eyebrow hover:text-foreground">Sign out</button>
          </div>
        </div>
        <nav className="rule mt-4 flex gap-5 pt-3">
          <Link to="/sessions" className={tab} activeProps={active}>Sessions</Link>
          <Link to="/day" className={tab} activeProps={active}>Rate the day</Link>
          {isAdmin && <Link to="/admin" className={tab} activeProps={active}>Organizers</Link>}
        </nav>
      </header>
      <div className="pt-6">
        <Outlet />
      </div>
    </div>
  );
}
