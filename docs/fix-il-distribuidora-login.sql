-- Corrige o login il@lookassessoria.com para abrir a area da IL Distribuidora.
-- Rode no SQL Editor do Supabase da Look.

insert into public.profiles (id, email, full_name, role)
select u.id, u.email, 'IL Distribuidora', 'client'
from auth.users u
where u.email = 'il@lookassessoria.com'
on conflict (id) do update
set email = excluded.email,
    full_name = excluded.full_name,
    role = excluded.role;

delete from public.user_client_access
where user_id = (
  select id
  from auth.users
  where email = 'il@lookassessoria.com'
)
and client_id not in (
  select id
  from public.clients
  where name = 'IL Distribuidora'
);

insert into public.user_client_access (user_id, client_id, access_level)
select u.id, c.id, 'client'
from auth.users u
join public.clients c on c.name = 'IL Distribuidora'
where u.email = 'il@lookassessoria.com'
on conflict (user_id, client_id) do update
set access_level = excluded.access_level;

select
  u.email,
  p.full_name,
  p.role,
  c.name as cliente,
  a.access_level
from auth.users u
left join public.profiles p on p.id = u.id
left join public.user_client_access a on a.user_id = u.id
left join public.clients c on c.id = a.client_id
where u.email = 'il@lookassessoria.com';
