
create type public.app_role as enum ('admin', 'user');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.user_roles where user_id = _user_id and role = _role) $$;

create policy "read own roles" on public.user_roles for select to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(), 'admin'));

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now()
);
grant select, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "read own or admin" on public.profiles for select to authenticated using (id = auth.uid() or public.has_role(auth.uid(), 'admin'));
create policy "update own" on public.profiles for update to authenticated using (id = auth.uid());

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name, avatar_url)
  values (new.id, new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url')
  on conflict (id) do nothing;
  return new;
end; $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create table public.sessions (
  id uuid primary key default gen_random_uuid(),
  sort_order int not null,
  start_time text not null,
  kind text not null,
  title text not null,
  subtitle text,
  speakers text,
  location text not null default 'Spieker Forum',
  qa_enabled boolean not null default false,
  created_at timestamptz not null default now()
);
grant select on public.sessions to authenticated;
grant all on public.sessions to service_role;
grant update on public.sessions to authenticated;
alter table public.sessions enable row level security;
create policy "sessions readable" on public.sessions for select to authenticated using (true);
create policy "admins update sessions" on public.sessions for update to authenticated using (public.has_role(auth.uid(), 'admin'));

insert into public.sessions (sort_order, start_time, kind, title, subtitle, speakers, location, qa_enabled) values
(1, '9:15 AM', 'Opening', 'Welcome', null, 'Mathijs De Vaan', 'Spieker Forum', false),
(2, '9:25 AM', 'Keynote', 'The Reinvention Mandate', 'How AI is changing roles, and how to stay competitive', 'Ally Legend Siegel', 'Spieker Forum', true),
(3, '10:05 AM', 'Panel', 'Healthcare, Rewritten', 'Where AI is reshaping healthcare, and the opportunities and risks', 'Joel Davis · Steve Pham', 'Spieker Forum', true),
(4, '10:55 AM', 'Panel', 'Fintech, Rewritten', 'Where AI is reshaping fintech, and the opportunities and risks', 'Tom Shaw · Jerry Chuang · Deepthi Jarugu', 'Spieker Forum', true),
(5, '10:55 AM', 'Coffee chat', 'Samsung corporate development', null, 'Andrew Protopsaltis · Bo Li', 'Breakout room N500', false),
(6, '11:35 AM', 'Fireside', 'Leading Through the AI Reset', 'AI, the travel industry and the operator''s day to day', 'Preeti Semwal', 'Spieker Forum', true),
(7, '1:05 PM', 'Spotlight', 'When Your Agent Can''t Afford to Fail', 'Voice AI lessons from Waymo', 'Brooke Hopkins', 'Spieker Forum', true),
(8, '1:35 PM', 'Panel', 'Building and Investing in What Comes Next', 'Investors and builders on where physical AI is heading', 'Ryan Green · Freddy Dopfel · Chen Su · Sriranjani Kalimani', 'Spieker Forum', true),
(9, '2:20 PM', 'Spotlight', 'Chasing the Edge of AI', null, 'Kaustubh Bawdekar', 'Spieker Forum', true),
(10, '3:00 PM', 'Workshop', 'Lovable workshop', null, null, 'Breakout room N500', false),
(11, '3:05 PM', 'Panel', 'AI, Agents, and Trust', null, 'Shabaz Patel · Javier Martin · moderated by Ayushman Dey', 'Spieker Forum', true),
(12, '3:45 PM', 'Panel', 'Cybersecurity, Rewritten', 'Where AI is reshaping cybersecurity, and the opportunities and risks', 'Sameer Vasanthapuram · Adam Seligman', 'Spieker Forum', true),
(13, '4:25 PM', 'Keynote', 'Where Intelligence Goes Next', 'Closing keynote', 'David Li', 'Spieker Forum', true);

create table public.session_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  comment text check (char_length(comment) <= 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, session_id)
);
grant select, insert, update on public.session_feedback to authenticated;
grant all on public.session_feedback to service_role;
alter table public.session_feedback enable row level security;
create policy "read own or admin" on public.session_feedback for select to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(), 'admin'));
create policy "insert own" on public.session_feedback for insert to authenticated with check (user_id = auth.uid());
create policy "update own" on public.session_feedback for update to authenticated using (user_id = auth.uid());

create table public.general_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  category text not null check (category in ('overall','pacing','topics','speakers','catering','venue','logistics')),
  rating int not null check (rating between 1 and 5),
  comment text check (char_length(comment) <= 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, category)
);
grant select, insert, update on public.general_feedback to authenticated;
grant all on public.general_feedback to service_role;
alter table public.general_feedback enable row level security;
create policy "read own or admin" on public.general_feedback for select to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(), 'admin'));
create policy "insert own" on public.general_feedback for insert to authenticated with check (user_id = auth.uid());
create policy "update own" on public.general_feedback for update to authenticated using (user_id = auth.uid());

create table public.questions (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  user_id uuid not null default auth.uid(),
  author_name text,
  body text not null check (char_length(body) between 3 and 500),
  vote_count int not null default 0,
  answered boolean not null default false,
  hidden boolean not null default false,
  created_at timestamptz not null default now()
);
grant select, insert, update on public.questions to authenticated;
grant all on public.questions to service_role;
alter table public.questions enable row level security;
create policy "read visible" on public.questions for select to authenticated using (hidden = false or user_id = auth.uid() or public.has_role(auth.uid(), 'admin'));
create policy "insert own on qa sessions" on public.questions for insert to authenticated with check (
  user_id = auth.uid() and exists (select 1 from public.sessions s where s.id = session_id and s.qa_enabled));
create policy "admins moderate" on public.questions for update to authenticated using (public.has_role(auth.uid(), 'admin'));

create or replace function public.questions_before_insert()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  new.author_name := (select display_name from public.profiles where id = new.user_id);
  new.vote_count := 0; new.answered := false; new.hidden := false;
  return new;
end; $$;
create trigger questions_before_insert before insert on public.questions for each row execute function public.questions_before_insert();

create table public.question_votes (
  question_id uuid not null references public.questions(id) on delete cascade,
  user_id uuid not null default auth.uid(),
  created_at timestamptz not null default now(),
  primary key (question_id, user_id)
);
grant select, insert, delete on public.question_votes to authenticated;
grant all on public.question_votes to service_role;
alter table public.question_votes enable row level security;
create policy "read own votes" on public.question_votes for select to authenticated using (user_id = auth.uid());
create policy "vote" on public.question_votes for insert to authenticated with check (user_id = auth.uid());
create policy "unvote" on public.question_votes for delete to authenticated using (user_id = auth.uid());

create or replace function public.sync_vote_count()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  update public.questions set vote_count = (select count(*) from public.question_votes where question_id = coalesce(new.question_id, old.question_id))
  where id = coalesce(new.question_id, old.question_id);
  return null;
end; $$;
create trigger sync_vote_count after insert or delete on public.question_votes for each row execute function public.sync_vote_count();

create table public.raffle_draws (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  email text,
  display_name text,
  entries int not null,
  drawn_at timestamptz not null default now()
);
grant select on public.raffle_draws to authenticated;
grant all on public.raffle_draws to service_role;
alter table public.raffle_draws enable row level security;
create policy "admins read draws" on public.raffle_draws for select to authenticated using (public.has_role(auth.uid(), 'admin'));

-- One ticket per session reviewed + one per general-feedback category; previous winners excluded.
create or replace function public.raffle_leaderboard()
returns table (user_id uuid, email text, display_name text, entries bigint)
language plpgsql stable security definer set search_path = public
as $$
begin
  if not public.has_role(auth.uid(), 'admin') then raise exception 'Forbidden'; end if;
  return query
  select t.user_id, p.email, p.display_name, count(*) as entries
  from (select f.user_id from public.session_feedback f union all select g.user_id from public.general_feedback g) t
  left join public.profiles p on p.id = t.user_id
  group by t.user_id, p.email, p.display_name
  order by entries desc;
end; $$;

create or replace function public.draw_raffle_winner()
returns public.raffle_draws
language plpgsql security definer set search_path = public
as $$
declare winner uuid; n int; result public.raffle_draws;
begin
  if not public.has_role(auth.uid(), 'admin') then raise exception 'Forbidden'; end if;
  select t.user_id into winner
  from (select f.user_id from public.session_feedback f union all select g.user_id from public.general_feedback g) t
  where t.user_id not in (select d.user_id from public.raffle_draws d)
  order by random() limit 1;
  if winner is null then raise exception 'No eligible entries'; end if;
  select (select count(*) from public.session_feedback where user_id = winner) + (select count(*) from public.general_feedback where user_id = winner) into n;
  insert into public.raffle_draws (user_id, email, display_name, entries)
  select winner, p.email, p.display_name, n from public.profiles p where p.id = winner
  returning * into result;
  if result.id is null then
    insert into public.raffle_draws (user_id, entries) values (winner, n) returning * into result;
  end if;
  return result;
end; $$;

alter publication supabase_realtime add table public.questions;
