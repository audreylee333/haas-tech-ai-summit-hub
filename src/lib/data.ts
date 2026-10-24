import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { countRaffleEntries } from "@/lib/raffle";

export function useUser() {
  return useQuery({
    queryKey: ["user"],
    queryFn: async () => (await supabase.auth.getUser()).data.user,
    staleTime: 60_000,
  });
}

export function useSessions() {
  return useQuery({
    queryKey: ["sessions"],
    queryFn: async () => {
      const { data, error } = await supabase.from("sessions").select("*").order("sort_order");
      if (error) throw error;
      return data;
    },
  });
}

export function useMyFeedback() {
  return useQuery({
    queryKey: ["my-feedback"],
    queryFn: async () => {
      const uid = (await supabase.auth.getUser()).data.user?.id;
      if (!uid) return { sessions: [], general: [], entries: 0 };
      const [s, g] = await Promise.all([
        supabase.from("session_feedback").select("*").eq("user_id", uid),
        supabase.from("general_feedback").select("*").eq("user_id", uid),
      ]);
      if (s.error) throw s.error;
      if (g.error) throw g.error;
      return {
        sessions: s.data,
        general: g.data,
        entries: countRaffleEntries(
          s.data.map((r) => r.session_id),
          g.data.map((r) => r.category),
        ),
      };
    },
  });
}

export function useIsAdmin() {
  return useQuery({
    queryKey: ["is-admin"],
    queryFn: async () => {
      const uid = (await supabase.auth.getUser()).data.user?.id;
      if (!uid) return false;
      const { data } = await supabase.rpc("has_role", { _user_id: uid, _role: "admin" });
      return !!data;
    },
  });
}
