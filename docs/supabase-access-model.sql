-- Modelo inicial do Portal Look para Supabase.
-- Use este SQL como base depois que o projeto Supabase estiver criado.
-- Antes de liberar clientes reais, rode os advisors de seguranca/performance no Supabase.

create extension if not exists pgcrypto;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'look_user_role') then
    create type public.look_user_role as enum ('client', 'admin_social', 'admin_master');
  end if;
end $$;

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  status text not null default 'active',
  social_media_group text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text not null,
  role public.look_user_role not null default 'client',
  created_at timestamptz not null default now()
);

create table if not exists public.user_client_access (
  user_id uuid not null references auth.users(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  access_level text not null default 'manager',
  created_at timestamptz not null default now(),
  primary key (user_id, client_id)
);

create table if not exists public.planning_items (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  title text not null,
  status text not null default 'planned',
  due_date date,
  source text not null default 'manual',
  external_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.action_items (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  title text not null,
  status text not null default 'open',
  progress integer not null default 0 check (progress between 0 and 100),
  created_at timestamptz not null default now()
);

create table if not exists public.social_metrics (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  month text not null,
  year integer not null,
  followers integer,
  new_followers integer,
  reach integer,
  views integer,
  engagement integer,
  interactions integer,
  link_taps integer,
  created_at timestamptz not null default now(),
  unique (client_id, month, year)
);

create table if not exists public.traffic_reports (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  period text not null,
  status text not null default 'draft',
  summary text,
  pdf_storage_path text,
  published_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.clients enable row level security;
alter table public.profiles enable row level security;
alter table public.user_client_access enable row level security;
alter table public.planning_items enable row level security;
alter table public.action_items enable row level security;
alter table public.social_metrics enable row level security;
alter table public.traffic_reports enable row level security;

grant usage on schema public to authenticated;
grant select, insert, update, delete on
  public.clients,
  public.profiles,
  public.user_client_access,
  public.planning_items,
  public.action_items,
  public.social_metrics,
  public.traffic_reports
to authenticated;

create policy "profiles_select_own_or_master"
on public.profiles
for select
to authenticated
using (
  id = (select auth.uid())
);

create policy "access_select_own_or_master"
on public.user_client_access
for select
to authenticated
using (
  user_id = (select auth.uid())
  or exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid())
      and p.role = 'admin_master'
  )
);

create policy "master_manage_client_access"
on public.user_client_access
for all
to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid())
      and p.role = 'admin_master'
  )
)
with check (
  exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid())
      and p.role = 'admin_master'
  )
);

create policy "clients_select_by_access_or_master"
on public.clients
for select
to authenticated
using (
  exists (
    select 1 from public.user_client_access a
    where a.user_id = (select auth.uid())
      and a.client_id = clients.id
  )
  or exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid())
      and p.role = 'admin_master'
  )
);

create policy "clients_write_by_master"
on public.clients
for all
to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid())
      and p.role = 'admin_master'
  )
)
with check (
  exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid())
      and p.role = 'admin_master'
  )
);

create policy "planning_select_by_client_access"
on public.planning_items
for select
to authenticated
using (
  exists (
    select 1 from public.user_client_access a
    where a.user_id = (select auth.uid())
      and a.client_id = planning_items.client_id
  )
  or exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid())
      and p.role = 'admin_master'
  )
);

create policy "actions_select_by_client_access"
on public.action_items
for select
to authenticated
using (
  exists (
    select 1 from public.user_client_access a
    where a.user_id = (select auth.uid())
      and a.client_id = action_items.client_id
  )
  or exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid())
      and p.role = 'admin_master'
  )
);

create policy "metrics_select_by_client_access"
on public.social_metrics
for select
to authenticated
using (
  exists (
    select 1 from public.user_client_access a
    where a.user_id = (select auth.uid())
      and a.client_id = social_metrics.client_id
  )
  or exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid())
      and p.role = 'admin_master'
  )
);

create policy "traffic_select_by_client_access"
on public.traffic_reports
for select
to authenticated
using (
  exists (
    select 1 from public.user_client_access a
    where a.user_id = (select auth.uid())
      and a.client_id = traffic_reports.client_id
  )
  or exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid())
      and p.role = 'admin_master'
  )
);

create policy "admin_write_planning"
on public.planning_items
for all
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    left join public.user_client_access a on a.user_id = p.id
    where p.id = (select auth.uid())
      and (
        p.role = 'admin_master'
        or (p.role = 'admin_social' and a.client_id = planning_items.client_id)
      )
  )
)
with check (
  exists (
    select 1
    from public.profiles p
    left join public.user_client_access a on a.user_id = p.id
    where p.id = (select auth.uid())
      and (
        p.role = 'admin_master'
        or (p.role = 'admin_social' and a.client_id = planning_items.client_id)
      )
  )
);

create policy "admin_write_actions"
on public.action_items
for all
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    left join public.user_client_access a on a.user_id = p.id
    where p.id = (select auth.uid())
      and (
        p.role = 'admin_master'
        or (p.role = 'admin_social' and a.client_id = action_items.client_id)
      )
  )
)
with check (
  exists (
    select 1
    from public.profiles p
    left join public.user_client_access a on a.user_id = p.id
    where p.id = (select auth.uid())
      and (
        p.role = 'admin_master'
        or (p.role = 'admin_social' and a.client_id = action_items.client_id)
      )
  )
);

create policy "admin_write_metrics"
on public.social_metrics
for all
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    left join public.user_client_access a on a.user_id = p.id
    where p.id = (select auth.uid())
      and (
        p.role = 'admin_master'
        or (p.role = 'admin_social' and a.client_id = social_metrics.client_id)
      )
  )
)
with check (
  exists (
    select 1
    from public.profiles p
    left join public.user_client_access a on a.user_id = p.id
    where p.id = (select auth.uid())
      and (
        p.role = 'admin_master'
        or (p.role = 'admin_social' and a.client_id = social_metrics.client_id)
      )
  )
);

create policy "admin_write_traffic"
on public.traffic_reports
for all
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    left join public.user_client_access a on a.user_id = p.id
    where p.id = (select auth.uid())
      and (
        p.role = 'admin_master'
        or (p.role = 'admin_social' and a.client_id = traffic_reports.client_id)
      )
  )
)
with check (
  exists (
    select 1
    from public.profiles p
    left join public.user_client_access a on a.user_id = p.id
    where p.id = (select auth.uid())
      and (
        p.role = 'admin_master'
        or (p.role = 'admin_social' and a.client_id = traffic_reports.client_id)
      )
  )
);

insert into public.clients (name, status, social_media_group)
values
  ('Cardiocenter', 'active', 'Social media 1'),
  ('Daniela Moura', 'active', 'Social media 1'),
  ('Fature Mais', 'active', 'Social media 1'),
  ('Instituto Landim', 'active', 'Social media 1'),
  ('Luanda', 'active', 'Social media 1'),
  ('Sobramid', 'active', 'Social media 1'),
  ('Rodrigo da Guarda', 'active', 'Social media 1'),
  ('Lazzo Matumbi', 'active', 'Social media 1'),
  ('Lucas Fraga', 'active', 'Social media 2'),
  ('Marcelo Midlej', 'active', 'Social media 2'),
  ('Rose Meire', 'active', 'Social media 2'),
  ('Senge', 'active', 'Social media 2'),
  ('IL Distribuidora', 'active', 'Social media 2'),
  ('Prime Esthetics', 'active', 'Social media 2'),
  ('Serenity', 'active', 'Social media 2'),
  ('Isabor', 'active', 'Social media 2')
on conflict (name) do update
set status = excluded.status,
    social_media_group = excluded.social_media_group,
    updated_at = now();

-- Depois de criar/convidar os usuarios no Supabase Auth, rode o bloco abaixo
-- para cadastrar os perfis e liberar os clientes corretos para cada ADM.

insert into public.profiles (id, email, full_name, role)
select id, email,
  case email
    when 'alessia@lookassessoria.com' then 'Alessia'
    when 'bianca@lookassessoria.com' then 'Bianca'
    when 'cecilio@lookassessoria.com' then 'Cecilio'
  end,
  case email
    when 'cecilio@lookassessoria.com' then 'admin_master'::public.look_user_role
    else 'admin_social'::public.look_user_role
  end
from auth.users
where email in (
  'alessia@lookassessoria.com',
  'bianca@lookassessoria.com',
  'cecilio@lookassessoria.com'
)
on conflict (id) do update
set full_name = excluded.full_name,
    role = excluded.role;

insert into public.user_client_access (user_id, client_id, access_level)
select u.id, c.id, 'manager'
from auth.users u
join public.clients c on (
  (u.email = 'alessia@lookassessoria.com' and c.social_media_group = 'Social media 1')
  or (u.email = 'bianca@lookassessoria.com' and c.social_media_group = 'Social media 2')
)
on conflict (user_id, client_id) do update
set access_level = excluded.access_level;
