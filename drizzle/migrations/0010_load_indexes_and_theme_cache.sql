CREATE INDEX IF NOT EXISTS questions_session_id_idx ON public.questions(session_id);
CREATE INDEX IF NOT EXISTS questions_user_id_idx ON public.questions(user_id);
CREATE INDEX IF NOT EXISTS question_votes_user_id_idx ON public.question_votes(user_id);
CREATE INDEX IF NOT EXISTS session_feedback_user_id_idx ON public.session_feedback(user_id);
CREATE INDEX IF NOT EXISTS session_feedback_session_id_idx ON public.session_feedback(session_id);
CREATE INDEX IF NOT EXISTS general_feedback_user_id_idx ON public.general_feedback(user_id);

CREATE TABLE public.question_themes (
  session_id uuid PRIMARY KEY REFERENCES public.sessions(id) ON DELETE CASCADE,
  themes jsonb NOT NULL DEFAULT '[]'::jsonb,
  question_count integer NOT NULL DEFAULT 0,
  latest_question_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.question_themes TO authenticated;
GRANT ALL ON public.question_themes TO service_role;
ALTER TABLE public.question_themes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "moderators read themes" ON public.question_themes FOR SELECT TO authenticated USING (public.can_moderate_session(session_id));
CREATE POLICY "moderators write themes" ON public.question_themes FOR INSERT TO authenticated WITH CHECK (public.can_moderate_session(session_id));
CREATE POLICY "moderators update themes" ON public.question_themes FOR UPDATE TO authenticated USING (public.can_moderate_session(session_id)) WITH CHECK (public.can_moderate_session(session_id));