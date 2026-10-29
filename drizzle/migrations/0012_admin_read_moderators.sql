GRANT SELECT ON public.moderator_emails TO authenticated;
GRANT SELECT ON public.moderator_assignments TO authenticated;
ALTER TABLE public.moderator_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moderator_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "super admins read staff list" ON public.moderator_emails FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "super admins read assignments" ON public.moderator_assignments FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));