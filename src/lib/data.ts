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
      const [s, g, q] = await Promise.all([
        supabase.from("session_feedback").select("*").eq("user_id", uid),
        supabase.from("general_feedback").select("*").eq("user_id", uid),
        supabase.from("questions").select("session_id").eq("user_id", uid),
      ]);
      if (s.error) throw s.error;
      if (g.error) throw g.error;
      if (q.error) throw q.error;
      return {
        sessions: s.data,
        general: g.data,
        entries: countRaffleEntries(
          s.data.map((r) => r.session_id),
          g.data.map((r) => r.category),
          q.data.map((r) => r.session_id),
        ),
      };
    },
  });
}

export type StaffRole = "admin" | "moderator" | null;

/** "admin" = super admin (everything), "moderator" = Q&A for assigned sessions, null = attendee. */
export function useStaffRole() {
  return useQuery({
    queryKey: ["staff-role"],
    queryFn: async (): Promise<StaffRole> => {
      const uid = (await supabase.auth.getUser()).data.user?.id;
      if (!uid) return null;
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", uid);
      return pickStaffRole((data ?? []).map((r) => r.role));
    },
  });
}

export function pickStaffRole(roles: string[]): StaffRole {
  if (roles.includes("admin")) return "admin";
  if (roles.includes("moderator")) return "moderator";
  return null;
}

/** Super admins only (feedback, raffle). */
export function useIsAdmin() {
  const q = useStaffRole();
  return { ...q, data: q.data === "admin" };
}

/** Anyone with the moderator desk (super admins and moderators). */
export function useIsStaff() {
  const q = useStaffRole();
  return { ...q, data: !!q.data };
}

export function useModeratedSessionIds(enabled = true) {
  return useQuery({
    queryKey: ["moderated-sessions"],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("my_moderated_sessions");
      if (error) throw error;
      return new Set((data ?? []) as string[]);
    },
  });
}
