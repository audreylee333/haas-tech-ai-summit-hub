import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { themesAreFresh, type Theme } from "./themes";

export const groupSessionQuestions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { sessionId: string }) => input)
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: allowed } = await supabase.rpc("can_moderate_session", { _session_id: data.sessionId });
    if (!allowed) return { error: "You don't moderate this session", themes: [] as Theme[], cached: false };
    const [{ data: session }, { data: qs, error }, { data: cache }] = await Promise.all([
      supabase.from("sessions").select("title").eq("id", data.sessionId).maybeSingle(),
      supabase.from("questions").select("id, body, created_at").eq("session_id", data.sessionId).eq("hidden", false).order("created_at"),
      supabase.from("question_themes").select("*").eq("session_id", data.sessionId).maybeSingle(),
    ]);
    if (error) return { error: "Could not load questions", themes: [] as Theme[], cached: false };
    if (!qs?.length) return { error: null, themes: [] as Theme[], cached: false };
    const latest = qs[qs.length - 1]!.created_at;
    // Normalize timestamps so the cache comparison is format-independent.
    const latestIso = new Date(latest).toISOString();
    const cacheNorm = cache ? { question_count: cache.question_count, latest_question_at: cache.latest_question_at ? new Date(cache.latest_question_at).toISOString() : null } : null;
    if (cache && themesAreFresh(cacheNorm, qs.length, latestIso)) {
      return { error: null, themes: cache.themes as unknown as Theme[], cached: true };
    }
    try {
      const { groupQuestionsByTheme } = await import("./themes.server");
      const themes = await groupQuestionsByTheme(qs, session?.title ?? "");
      await supabase.from("question_themes").upsert({
        session_id: data.sessionId, themes: themes as never, question_count: qs.length, latest_question_at: latestIso, updated_at: new Date().toISOString(),
      });
      return { error: null, themes, cached: false };
    } catch (e) {
      console.error("theme grouping failed", e);
      const status = (e as { statusCode?: number })?.statusCode;
      if (status === 402) return { error: "AI credits are used up. Add credits in Settings to keep grouping.", themes: [] as Theme[], cached: false };
      if (status === 429) return { error: "Too many requests. Try again in a minute.", themes: [] as Theme[], cached: false };
      return { error: "Grouping failed. Try again.", themes: [] as Theme[], cached: false };
    }
  });
