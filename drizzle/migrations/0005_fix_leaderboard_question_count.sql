CREATE OR REPLACE FUNCTION public.raffle_leaderboard()
 RETURNS TABLE(user_id uuid, email text, display_name text, entries bigint)
 LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
begin
  if not public.has_role(auth.uid(), 'admin') then raise exception 'Forbidden'; end if;
  return query
  select t.user_id, p.email, p.display_name, count(*) as entries
  from (select f.user_id from public.session_feedback f
        union all select g.user_id from public.general_feedback g
        union all select q.user_id from (select distinct q2.user_id, q2.session_id from public.questions q2) q) t
  left join public.profiles p on p.id = t.user_id
  group by t.user_id, p.email, p.display_name
  order by entries desc;
end; $function$;