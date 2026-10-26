import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const groupSessionQuestions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { sessionId: string }) => input)
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: allowed } = await supabase.rpc("can_moderate_session", { _session_id: data.sessionId });
    if (!allowed) return { error: "You don't moderate this session", themes: [] };
    const [{ data: session }, { data: qs, error }] = await Promise.all([
      supabase.from("sessions").select("title").eq("id", data.sessionId).maybeSingle(),
      supabase.from("questions").select("id, body").eq("session_id", data.sessionId).eq("hidden", false),
    ]);
    if (error) return { error: "Could not load questions", themes: [] };
    if (!qs?.length) return { error: null, themes: [] };
    try {
      const { groupQuestionsByTheme } = await import("./themes.server");
      return { error: null, themes: await groupQuestionsByTheme(qs, session?.title ?? "") };
    } catch (e) {
      console.error("theme grouping failed", e);
      const status = (e as { statusCode?: number })?.statusCode;
      if (status === 402) return { error: "AI credits are used up. Add credits in Settings to keep grouping.", themes: [] };
      if (status === 429) return { error: "Too many requests. Try again in a minute.", themes: [] };
      return { error: "Grouping failed. Try again.", themes: [] };
    }
  });
