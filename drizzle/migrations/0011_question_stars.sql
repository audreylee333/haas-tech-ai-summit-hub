CREATE TABLE public.question_stars (
  question_id uuid NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (question_id, user_id)
);
GRANT SELECT, INSERT, DELETE ON public.question_stars TO authenticated;
GRANT ALL ON public.question_stars TO service_role;
ALTER TABLE public.question_stars ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read own stars" ON public.question_stars FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "star moderated" ON public.question_stars FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND EXISTS (SELECT 1 FROM public.questions q WHERE q.id = question_id AND public.can_moderate_session(q.session_id)));
CREATE POLICY "unstar own" ON public.question_stars FOR DELETE TO authenticated USING (user_id = auth.uid());