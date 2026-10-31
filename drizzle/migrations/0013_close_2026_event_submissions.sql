CREATE POLICY "event closed no session reviews" ON public.session_feedback AS RESTRICTIVE FOR INSERT TO authenticated WITH CHECK (false);
CREATE POLICY "event closed no session review edits" ON public.session_feedback AS RESTRICTIVE FOR UPDATE TO authenticated USING (false) WITH CHECK (false);
CREATE POLICY "event closed no day feedback" ON public.general_feedback AS RESTRICTIVE FOR INSERT TO authenticated WITH CHECK (false);
CREATE POLICY "event closed no day feedback edits" ON public.general_feedback AS RESTRICTIVE FOR UPDATE TO authenticated USING (false) WITH CHECK (false);
CREATE POLICY "event closed no questions" ON public.questions AS RESTRICTIVE FOR INSERT TO authenticated WITH CHECK (false);
CREATE POLICY "event closed no upvotes" ON public.question_votes AS RESTRICTIVE FOR INSERT TO authenticated WITH CHECK (false);
CREATE POLICY "event closed no vote changes" ON public.question_votes AS RESTRICTIVE FOR DELETE TO authenticated USING (false);