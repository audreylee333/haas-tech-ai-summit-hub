CREATE OR REPLACE FUNCTION public.day_feedback_group(_category text)
 RETURNS text LANGUAGE sql IMMUTABLE SET search_path TO 'public'
AS $$
  select case
    when _category = 'overall' then 'overall'
    when _category in ('pacing','topics','speakers') then 'program'
    when _category in ('catering','venue','logistics') then 'venue'
    else _category end
$$;

CREATE OR REPLACE FUNCTION public.raffle_leaderboard()
 RETURNS TABLE(user_id uuid, email text, display_name text, entries bigint)
 LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
begin
  if not public.has_role(auth.uid(), 'admin') then raise exception 'Forbidden'; end if;
  return query
  select t.user_id, p.email, p.display_name, count(*) as entries
  from (select f.user_id from public.session_feedback f
        union all select g.user_id from (select distinct g2.user_id, public.day_feedback_group(g2.category) from public.general_feedback g2) g
        union all select q.user_id from (select distinct q2.user_id, q2.session_id from public.questions q2) q) t
  left join public.profiles p on p.id = t.user_id
  group by t.user_id, p.email, p.display_name
  order by entries desc;
end; $function$;

CREATE OR REPLACE FUNCTION public.draw_raffle_winner()
 RETURNS public.raffle_draws LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
declare winner uuid; n int; result public.raffle_draws;
begin
  if not public.has_role(auth.uid(), 'admin') then raise exception 'Forbidden'; end if;
  select t.user_id into winner
  from (select f.user_id from public.session_feedback f
        union all select g.user_id from (select distinct g2.user_id, public.day_feedback_group(g2.category) from public.general_feedback g2) g
        union all select q.user_id from (select distinct q2.user_id, q2.session_id from public.questions q2) q) t
  where t.user_id not in (select d.user_id from public.raffle_draws d)
  order by random() limit 1;
  if winner is null then raise exception 'No eligible entries'; end if;
  select (select count(*) from public.session_feedback where user_id = winner)
       + (select count(distinct public.day_feedback_group(category)) from public.general_feedback where user_id = winner)
       + (select count(distinct session_id) from public.questions where user_id = winner) into n;
  insert into public.raffle_draws (user_id, email, display_name, entries)
  select winner, p.email, p.display_name, n from public.profiles p where p.id = winner
  returning * into result;
  if result.id is null then
    insert into public.raffle_draws (user_id, entries) values (winner, n) returning * into result;
  end if;
  return result;
end; $function$;