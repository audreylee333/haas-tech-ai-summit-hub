ALTER TABLE public.moderator_emails ADD COLUMN IF NOT EXISTS role public.app_role NOT NULL DEFAULT 'moderator';
ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS open_to_all_moderators boolean NOT NULL DEFAULT false;

CREATE TABLE public.moderator_assignments (
  email text NOT NULL,
  session_id uuid NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  PRIMARY KEY (email, session_id)
);
GRANT ALL ON public.moderator_assignments TO service_role;
ALTER TABLE public.moderator_assignments ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.sync_staff_role(_user_id uuid, _email text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
declare r public.app_role;
begin
  select m.role into r from public.moderator_emails m where lower(m.email) = lower(_email) limit 1;
  delete from public.user_roles where user_id = _user_id and role in ('admin','moderator') and (r is null or role <> r);
  if r is not null then
    insert into public.user_roles (user_id, role) values (_user_id, r) on conflict do nothing;
  end if;
end; $$;
REVOKE EXECUTE ON FUNCTION public.sync_staff_role(uuid, text) FROM anon, authenticated, public;

CREATE OR REPLACE FUNCTION public.grant_moderator_role()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
begin
  perform public.sync_staff_role(new.id, new.email);
  return new;
end; $$;

CREATE OR REPLACE FUNCTION public.moderator_email_added()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
declare p record;
begin
  for p in select id, email from public.profiles where lower(email) = lower(coalesce(new.email, old.email)) or (tg_op = 'UPDATE' and lower(email) = lower(old.email)) loop
    perform public.sync_staff_role(p.id, p.email);
  end loop;
  return null;
end; $$;

DROP TRIGGER IF EXISTS on_moderator_email_added ON public.moderator_emails;
CREATE TRIGGER on_moderator_email_added AFTER INSERT OR UPDATE OR DELETE ON public.moderator_emails
  FOR EACH ROW EXECUTE FUNCTION public.moderator_email_added();

CREATE OR REPLACE FUNCTION public.can_moderate_session(_session_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  select auth.uid() is not null and (
    public.has_role(auth.uid(), 'admin')
    or (public.has_role(auth.uid(), 'moderator') and (
      exists (select 1 from public.sessions s where s.id = _session_id and s.open_to_all_moderators)
      or exists (select 1 from public.moderator_assignments a join public.profiles p on lower(p.email) = lower(a.email)
                 where p.id = auth.uid() and a.session_id = _session_id)))
  )
$$;
REVOKE EXECUTE ON FUNCTION public.can_moderate_session(uuid) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.can_moderate_session(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.my_moderated_sessions()
RETURNS SETOF uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  select s.id from public.sessions s where public.can_moderate_session(s.id)
$$;
REVOKE EXECUTE ON FUNCTION public.my_moderated_sessions() FROM anon, public;
GRANT EXECUTE ON FUNCTION public.my_moderated_sessions() TO authenticated;

DROP POLICY IF EXISTS "read own or admin" ON public.questions;
CREATE POLICY "read own or moderated" ON public.questions FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.can_moderate_session(session_id));
DROP POLICY IF EXISTS "admins moderate" ON public.questions;
CREATE POLICY "moderators moderate" ON public.questions FOR UPDATE TO authenticated
  USING (public.can_moderate_session(session_id)) WITH CHECK (public.can_moderate_session(session_id));