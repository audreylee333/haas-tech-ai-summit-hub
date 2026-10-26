CREATE OR REPLACE FUNCTION public.can_upvote_question(_question_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.questions q
    WHERE q.id = _question_id
      AND auth.uid() IS NOT NULL
      AND NOT q.hidden
      AND q.user_id <> auth.uid()
  );
$$;
REVOKE ALL ON FUNCTION public.can_upvote_question(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_upvote_question(uuid) TO authenticated;
ALTER POLICY "vote" ON public.question_votes
WITH CHECK (
  user_id = auth.uid()
  AND public.can_upvote_question(question_id)
);