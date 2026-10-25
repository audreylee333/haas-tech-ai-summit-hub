CREATE TABLE public.moderator_emails (
  email text PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.moderator_emails TO service_role;
ALTER TABLE public.moderator_emails ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.grant_moderator_role()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
begin
  if exists (select 1 from public.moderator_emails m where lower(m.email) = lower(new.email)) then
    insert into public.user_roles (user_id, role) values (new.id, 'admin') on conflict do nothing;
  end if;
  return new;
end; $$;

CREATE TRIGGER on_profile_grant_moderator AFTER INSERT OR UPDATE OF email ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.grant_moderator_role();

CREATE OR REPLACE FUNCTION public.moderator_email_added()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
begin
  insert into public.user_roles (user_id, role)
  select p.id, 'admin' from public.profiles p where lower(p.email) = lower(new.email)
  on conflict do nothing;
  return new;
end; $$;

CREATE TRIGGER on_moderator_email_added AFTER INSERT ON public.moderator_emails
FOR EACH ROW EXECUTE FUNCTION public.moderator_email_added();

CREATE OR REPLACE FUNCTION public.session_questions(_session_id uuid)
RETURNS TABLE(id uuid, body text, vote_count integer, created_at timestamptz, voted_by_me boolean, is_mine boolean)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  select q.id, q.body, q.vote_count, q.created_at,
    exists (select 1 from public.question_votes v where v.question_id = q.id and v.user_id = auth.uid()),
    q.user_id = auth.uid()
  from public.questions q join public.sessions s on s.id = q.session_id
  where auth.uid() is not null and q.session_id = _session_id and not q.hidden and s.qa_enabled
  order by q.vote_count desc, q.created_at asc
$$;
REVOKE EXECUTE ON FUNCTION public.session_questions(uuid) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.session_questions(uuid) TO authenticated;

DROP POLICY IF EXISTS "vote" ON public.question_votes;
CREATE POLICY "vote" ON public.question_votes FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid() AND EXISTS (
  SELECT 1 FROM public.questions q WHERE q.id = question_id AND NOT q.hidden AND q.user_id <> auth.uid()));
GRANT SELECT, INSERT, DELETE ON public.question_votes TO authenticated;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname LIKE '%vote%' AND tgrelid = 'public.question_votes'::regclass) THEN
    CREATE TRIGGER sync_vote_count_trg AFTER INSERT OR DELETE ON public.question_votes FOR EACH ROW EXECUTE FUNCTION public.sync_vote_count();
  END IF;
END $$;